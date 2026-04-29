// ============================================================================
// bank-sync
// ----------------------------------------------------------------------------
// Haalt transacties + balance op voor één bank_connection (alle accounts
// daarbinnen) en schrijft ze additief in public.transactions.
//
// Dedupe: bank_transaction_id is UNIQUE per user via partial index, dus we
// gebruiken upsert met onConflict op (user_id, bank_transaction_id) om
// dubbele rijen te voorkomen wanneer dezelfde transactie meerdere keren
// langs komt (GoCardless levert dezelfde tx soms in opeenvolgende calls).
//
// Body:
//   { connection_id: uuid }     — sync alle accounts onder deze connection
//   { account_id: uuid }        — sync één specifieke bank_account
//
// Auth: Supabase user JWT vereist.
//
// Env:
//   GOCARDLESS_SECRET_ID
//   GOCARDLESS_SECRET_KEY
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GC_API = "https://bankaccountdata.gocardless.com/api/v2";

// ----------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const gcSecretId = Deno.env.get("GOCARDLESS_SECRET_ID");
    const gcSecretKey = Deno.env.get("GOCARDLESS_SECRET_KEY");

    if (!gcSecretId || !gcSecretKey) {
      return json({ error: "gocardless_not_configured" }, 500);
    }

    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "invalid_token" }, 401);
    const user = userData.user;

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));

    // Resolve target accounts
    let bankAccounts: any[] = [];
    if (body.account_id) {
      const { data } = await admin
        .from("bank_accounts")
        .select("*")
        .eq("id", body.account_id)
        .eq("user_id", user.id);
      bankAccounts = data ?? [];
    } else if (body.connection_id) {
      const { data } = await admin
        .from("bank_accounts")
        .select("*")
        .eq("connection_id", body.connection_id)
        .eq("user_id", user.id);
      bankAccounts = data ?? [];
    } else {
      return json({ error: "missing_target", message: "Provide connection_id or account_id" }, 400);
    }

    if (bankAccounts.length === 0) {
      return json({ error: "no_accounts_found" }, 404);
    }

    const token = await getGcToken(gcSecretId, gcSecretKey);
    if (!token) return json({ error: "gc_token_failed" }, 502);

    let totalInserted = 0;
    let totalSeen = 0;
    const perAccount: any[] = [];

    for (const acc of bankAccounts) {
      // 1. Transactions
      const txRes = await gcFetch(token, "GET", `/accounts/${acc.gc_account_id}/transactions/`);
      if (!txRes.ok) {
        perAccount.push({ account_id: acc.id, error: "gc_transactions_failed", detail: txRes.body });
        continue;
      }
      const booked = (txRes.body as any).transactions?.booked ?? [];
      totalSeen += booked.length;

      // Map GC tx → our transactions schema
      const rows = booked.map((tx: any) => mapGcTransaction(tx, user.id, acc));
      // Filter out rows we couldn't map (missing required fields)
      const validRows = rows.filter((r: any) => r !== null);

      // Upsert per chunk to avoid huge single statement
      const CHUNK = 200;
      let inserted = 0;
      for (let i = 0; i < validRows.length; i += CHUNK) {
        const chunk = validRows.slice(i, i + CHUNK);
        const { error, count } = await admin
          .from("transactions")
          .upsert(chunk, {
            onConflict: "user_id,bank_transaction_id",
            ignoreDuplicates: false,
            count: "exact",
          });
        if (error) {
          perAccount.push({ account_id: acc.id, error: "db_upsert_failed", detail: error.message });
          break;
        }
        inserted += count ?? chunk.length;
      }
      totalInserted += inserted;

      // 2. Balance refresh
      const balRes = await gcFetch(token, "GET", `/accounts/${acc.gc_account_id}/balances/`);
      if (balRes.ok) {
        const balances = (balRes.body as any).balances ?? [];
        const booked = balances.find((b: any) => b.balanceType === "closingBooked") ?? balances[0];
        if (booked) {
          await admin
            .from("bank_accounts")
            .update({
              balance_cents: Math.round(parseFloat(booked.balanceAmount.amount) * 100),
              balance_synced_at: new Date().toISOString(),
            })
            .eq("id", acc.id);
        }
      }

      perAccount.push({ account_id: acc.id, seen: booked.length, upserted: inserted });
    }

    // Update last_synced_at on connection
    if (body.connection_id) {
      await admin
        .from("bank_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", body.connection_id);
    } else if (bankAccounts[0]?.connection_id) {
      await admin
        .from("bank_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", bankAccounts[0].connection_id);
    }

    return json({
      total_seen: totalSeen,
      total_upserted: totalInserted,
      accounts: perAccount,
    });
  } catch (err) {
    console.error("bank-sync error:", err);
    return json({ error: "internal", message: String(err) }, 500);
  }
});

// ----------------------------------------------------------------------------
// Map een GoCardless booked-transaction naar Dynafy's transactions schema.
// Dynafy schema (afgeleid uit App.jsx queries — geen migratie file aanwezig):
//   id, user_id, date, description, category, account, amount, ...
// We voegen toe: bank_transaction_id, bank_account_id.
//
// account: vult de bestaande client-side account-naam in voor UI consistentie.
// category: laten we leeg ("Other") — bestaande Categorize-flow pakt het op.
function mapGcTransaction(tx: any, userId: string, bankAcc: any): any | null {
  // Stable id: prefer transactionId, fallback internalTransactionId
  const bankTxId = tx.transactionId ?? tx.internalTransactionId;
  if (!bankTxId) return null;

  const date = tx.bookingDate ?? tx.valueDate ?? null;
  if (!date) return null;

  const amount = parseFloat(tx.transactionAmount?.amount);
  if (Number.isNaN(amount)) return null;

  const description =
    tx.remittanceInformationUnstructured ??
    (Array.isArray(tx.remittanceInformationUnstructuredArray)
      ? tx.remittanceInformationUnstructuredArray.join(" ")
      : null) ??
    tx.creditorName ??
    tx.debtorName ??
    "Bank transactie";

  return {
    user_id: userId,
    date,
    description,
    category: "Other",
    account: bankAcc.client_account_id ?? bankAcc.name ?? "Bank",
    amount,
    bank_transaction_id: bankTxId,
    bank_account_id: bankAcc.id,
  };
}

// ----------------------------------------------------------------------------
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function getGcToken(secretId: string, secretKey: string): Promise<string | null> {
  const res = await fetch(`${GC_API}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ secret_id: secretId, secret_key: secretKey }),
  });
  if (!res.ok) {
    console.error("gc_token error:", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.access ?? null;
}

async function gcFetch(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch(`${GC_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: data };
}
