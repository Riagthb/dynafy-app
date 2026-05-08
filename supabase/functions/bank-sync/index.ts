// ============================================================================
// bank-sync
// ----------------------------------------------------------------------------
// Haalt transacties + balance op voor één bank_connection (alle accounts
// daarbinnen) en schrijft ze additief in public.transactions.
//
// Provider: Enable Banking (https://api.enablebanking.com).
// Authenticatie: self-signed RS256 JWT, zelfde als bank-link.
//
// Dedupe: bank_transaction_id is UNIQUE per user via partial index, dus we
// gebruiken upsert met onConflict op (user_id, bank_transaction_id) om
// dubbele rijen te voorkomen.
//
// Body:
//   { connection_id: uuid }     — sync alle accounts onder deze connection
//   { account_id: uuid }        — sync één specifieke bank_account
//
// Auth: Supabase user JWT vereist.
//
// Env:
//   ENABLE_BANKING_APP_ID
//   ENABLE_BANKING_PRIVATE_KEY
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EB_API = "https://api.enablebanking.com";

// Hoeveel dagen historie ophalen per sync-run als er nog niet eerder gesynced is.
const INITIAL_HISTORY_DAYS = 90;
// Hoeveel dagen overlap pakken bij een refresh-sync (om late-booked tx te vangen).
const REFRESH_OVERLAP_DAYS = 7;

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
    const ebAppId = Deno.env.get("ENABLE_BANKING_APP_ID");
    const ebPrivateKey = Deno.env.get("ENABLE_BANKING_PRIVATE_KEY");

    if (!ebAppId || !ebPrivateKey) {
      return json({ error: "enable_banking_not_configured" }, 500);
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

    const token = await getEbToken(ebAppId, ebPrivateKey);
    if (!token) return json({ error: "eb_token_failed" }, 502);

    let totalInserted = 0;
    let totalSeen = 0;
    const perAccount: any[] = [];

    for (const acc of bankAccounts) {
      const uid = acc.provider_account_id;
      if (!uid) {
        perAccount.push({ account_id: acc.id, error: "missing_provider_account_id" });
        continue;
      }

      // 1. Transactions — bepaal date_from
      const dateFrom = pickDateFrom(acc);
      const txParams = new URLSearchParams({
        date_from: dateFrom,
        transaction_status: "BOOK",
      });

      let pageCount = 0;
      let seenThisAcc = 0;
      let upsertedThisAcc = 0;
      let continuationKey: string | null = null;

      do {
        if (continuationKey) txParams.set("continuation_key", continuationKey);
        const txRes = await ebFetch(
          token,
          "GET",
          `/accounts/${uid}/transactions?${txParams.toString()}`,
        );
        if (!txRes.ok) {
          perAccount.push({ account_id: acc.id, error: "eb_transactions_failed", detail: txRes.body });
          break;
        }
        const page = txRes.body as any;
        const txs: any[] = page.transactions ?? [];
        seenThisAcc += txs.length;

        const rows = txs.map((tx: any) => mapEbTransaction(tx, user.id, acc));
        const validRows = rows.filter((r: any) => r !== null);

        const CHUNK = 200;
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
            continuationKey = null;
            break;
          }
          upsertedThisAcc += count ?? chunk.length;
        }

        continuationKey = page.continuation_key ?? null;
        pageCount += 1;
        // Veiligheidsklep — voorkom infinite loop bij API-foutje
        if (pageCount > 50) {
          console.warn(`bank-sync pagination cap hit for ${acc.id}`);
          break;
        }
      } while (continuationKey);

      totalSeen += seenThisAcc;
      totalInserted += upsertedThisAcc;

      // 2. Balance refresh
      const balRes = await ebFetch(token, "GET", `/accounts/${uid}/balances`);
      if (balRes.ok) {
        const balances = (balRes.body as any).balances ?? [];
        const booked = balances.find((b: any) =>
          b.balance_type === "CLBD" || b.balance_type === "ITBD"
        ) ?? balances[0];
        if (booked?.balance_amount?.amount) {
          await admin
            .from("bank_accounts")
            .update({
              balance_cents: Math.round(parseFloat(booked.balance_amount.amount) * 100),
              balance_synced_at: new Date().toISOString(),
            })
            .eq("id", acc.id);
        }
      }

      perAccount.push({
        account_id: acc.id,
        seen: seenThisAcc,
        upserted: upsertedThisAcc,
        pages: pageCount,
      });
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
// Bepaal date_from voor de transactions-call op deze account.
// Eerste sync: nu - INITIAL_HISTORY_DAYS.
// Refresh sync: laatste balance_synced_at - REFRESH_OVERLAP_DAYS, capped op 90d.
function pickDateFrom(acc: any): string {
  const now = Date.now();
  const initialFrom = new Date(now - INITIAL_HISTORY_DAYS * 24 * 60 * 60 * 1000);

  if (!acc.balance_synced_at) return formatDate(initialFrom);

  const lastSync = new Date(acc.balance_synced_at);
  const refreshFrom = new Date(lastSync.getTime() - REFRESH_OVERLAP_DAYS * 24 * 60 * 60 * 1000);
  // Niet verder terug dan onze initial-history-window
  if (refreshFrom < initialFrom) return formatDate(initialFrom);
  return formatDate(refreshFrom);
}

function formatDate(d: Date): string {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

// ----------------------------------------------------------------------------
// Map een Enable Banking transactie naar Dynafy's transactions schema.
//
// Enable Banking format (https://enablebanking.com/docs/api/reference/):
//   transaction_id, entry_reference, transaction_amount: { currency, amount },
//   credit_debit_indicator: "CRDT"|"DBIT",
//   booking_date, value_date, status: "BOOK"|"PEND"|...,
//   remittance_information: [...],
//   creditor: { name }, debtor: { name }, ...
//
// Dynafy schema:
//   id, user_id, date, description, category, account, amount, ...
//   + bank_transaction_id, bank_account_id (toegevoegd in 20260429 migratie)
function mapEbTransaction(tx: any, userId: string, bankAcc: any): any | null {
  // Stable id: prefer transaction_id, fallback entry_reference
  const bankTxId = tx.transaction_id ?? tx.entry_reference;
  if (!bankTxId) return null;

  const date = tx.booking_date ?? tx.value_date ?? null;
  if (!date) return null;

  const rawAmount = parseFloat(tx.transaction_amount?.amount);
  if (Number.isNaN(rawAmount)) return null;

  // CRDT = inkomend (positief), DBIT = uitgaand (negatief)
  const sign = tx.credit_debit_indicator === "DBIT" ? -1 : 1;
  const amount = Math.abs(rawAmount) * sign;

  // Description: best-effort uit remittance_information of namen
  const remittance = Array.isArray(tx.remittance_information)
    ? tx.remittance_information.filter(Boolean).join(" ")
    : null;
  const counterparty = sign < 0
    ? tx.creditor?.name
    : tx.debtor?.name;
  const description = remittance || counterparty || "Bank transactie";

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

async function getEbToken(appId: string, privateKeyPem: string): Promise<string | null> {
  try {
    const pem = privateKeyPem.replace(/\\n/g, "\n").trim();
    const privateKey = await importPKCS8(pem, "RS256");

    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: appId })
      .setIssuer("enablebanking.com")
      .setAudience("api.enablebanking.com")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);
    return jwt;
  } catch (e) {
    console.error("eb_token sign error:", e);
    return null;
  }
}

async function ebFetch(
  token: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch(`${EB_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`eb_fetch ${method} ${path} → ${res.status}`, data);
  }
  return { ok: res.ok, status: res.status, body: data };
}
