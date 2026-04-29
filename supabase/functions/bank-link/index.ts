// ============================================================================
// bank-link
// ----------------------------------------------------------------------------
// Eén Edge Function die de drie stappen van de GoCardless Bank Account Data
// (ex-Nordigen) consent-flow afhandelt:
//
//   action: "list_institutions"   → lijst banken voor land (default NL)
//   action: "create_requisition"  → maak consent, return checkout URL
//   action: "finalize"            → na bank-callback: opslaan accounts
//
// Auth: Supabase user JWT vereist in Authorization header.
//
// Env (via `supabase secrets set`):
//   GOCARDLESS_SECRET_ID   — UUID, te vinden in BAD dashboard
//   GOCARDLESS_SECRET_KEY  — secret, idem
//
// Auto-injected:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GC_API = "https://bankaccountdata.gocardless.com/api/v2";
const APP_URL = "https://app.dynafy.nl";
const REDIRECT_URL = `${APP_URL}/?bank_link=callback`;

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

    // Verify user JWT
    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "invalid_token" }, 401);
    const user = userData.user;

    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    // Get GC access token (fresh per request — simple, no cache yet)
    const token = await getGcToken(gcSecretId, gcSecretKey);
    if (!token) return json({ error: "gc_token_failed" }, 502);

    // ------------------------------------------------------------------------
    if (action === "list_institutions") {
      const country = body.country || "NL";
      const res = await gcFetch(token, "GET", `/institutions/?country=${country}`);
      if (!res.ok) return json({ error: "gc_institutions_failed", detail: res.body }, 502);
      // Trim payload — UI doesn't need everything
      const trimmed = (res.body as any[]).map((i) => ({
        id: i.id,
        name: i.name,
        bic: i.bic,
        logo: i.logo,
        transaction_total_days: i.transaction_total_days,
      }));
      return json({ institutions: trimmed });
    }

    // ------------------------------------------------------------------------
    if (action === "create_requisition") {
      const { institution_id, institution_name, institution_logo } = body;
      if (!institution_id) return json({ error: "missing_institution_id" }, 400);

      // Use a stable reference per (user, institution, date) — debugging-friendly
      const reference = `dynafy_${user.id.slice(0, 8)}_${Date.now()}`;

      const res = await gcFetch(token, "POST", "/requisitions/", {
        redirect: REDIRECT_URL,
        institution_id,
        reference,
        user_language: "NL",
      });
      if (!res.ok) {
        return json({ error: "gc_requisition_failed", detail: res.body }, 502);
      }

      const requisition = res.body;

      // Compute expiry — GC default access valid 90 days
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

      const { data: connection, error: dbErr } = await admin
        .from("bank_connections")
        .insert({
          user_id: user.id,
          institution_id,
          institution_name: institution_name ?? null,
          institution_logo: institution_logo ?? null,
          requisition_id: requisition.id,
          reference,
          status: requisition.status ?? "CR",
          consent_url: requisition.link,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (dbErr) return json({ error: "db_insert_failed", detail: dbErr.message }, 500);

      return json({
        connection_id: connection.id,
        consent_url: requisition.link,
        requisition_id: requisition.id,
      });
    }

    // ------------------------------------------------------------------------
    if (action === "finalize") {
      // Frontend roept dit aan na bank-redirect terug naar /?bank_link=callback&ref=...
      // We zoeken de connection op via reference of requisition_id.
      const { reference, requisition_id, connection_id } = body;

      let conn: any = null;
      if (connection_id) {
        const { data } = await admin
          .from("bank_connections")
          .select("*")
          .eq("id", connection_id)
          .eq("user_id", user.id)
          .maybeSingle();
        conn = data;
      } else if (requisition_id) {
        const { data } = await admin
          .from("bank_connections")
          .select("*")
          .eq("requisition_id", requisition_id)
          .eq("user_id", user.id)
          .maybeSingle();
        conn = data;
      } else if (reference) {
        const { data } = await admin
          .from("bank_connections")
          .select("*")
          .eq("reference", reference)
          .eq("user_id", user.id)
          .maybeSingle();
        conn = data;
      }
      if (!conn) return json({ error: "connection_not_found" }, 404);

      // Fetch fresh requisition state from GC
      const reqRes = await gcFetch(token, "GET", `/requisitions/${conn.requisition_id}/`);
      if (!reqRes.ok) {
        return json({ error: "gc_requisition_fetch_failed", detail: reqRes.body }, 502);
      }
      const requisition = reqRes.body as any;

      // Update connection status
      await admin
        .from("bank_connections")
        .update({ status: requisition.status })
        .eq("id", conn.id);

      // Status LN = Linked = consent geslaagd, accounts beschikbaar
      if (requisition.status !== "LN") {
        return json({
          status: requisition.status,
          accounts: [],
          message: `consent_status=${requisition.status}`,
        });
      }

      // Voor elke account: details ophalen + opslaan
      const accountIds: string[] = requisition.accounts ?? [];
      const accountsOut: any[] = [];

      for (const gcAccountId of accountIds) {
        const [detailsRes, balancesRes] = await Promise.all([
          gcFetch(token, "GET", `/accounts/${gcAccountId}/details/`),
          gcFetch(token, "GET", `/accounts/${gcAccountId}/balances/`),
        ]);

        const details = detailsRes.ok ? (detailsRes.body as any).account ?? {} : {};
        const balances = balancesRes.ok ? (balancesRes.body as any).balances ?? [] : [];

        // Pak eerst booked balance, anders eerste beschikbare
        const booked = balances.find((b: any) => b.balanceType === "closingBooked")
          ?? balances[0]
          ?? null;
        const balanceCents = booked
          ? Math.round(parseFloat(booked.balanceAmount.amount) * 100)
          : null;

        const { data: bankAcc, error: accErr } = await admin
          .from("bank_accounts")
          .upsert(
            {
              user_id: user.id,
              connection_id: conn.id,
              gc_account_id: gcAccountId,
              iban: details.iban ?? null,
              name: details.name ?? details.ownerName ?? "Bankrekening",
              currency: details.currency ?? "EUR",
              balance_cents: balanceCents,
              balance_synced_at: balanceCents !== null ? new Date().toISOString() : null,
            },
            { onConflict: "gc_account_id" },
          )
          .select()
          .single();

        if (accErr) {
          // Don't bail — log and continue with the others
          console.error("bank_accounts upsert error:", accErr);
          continue;
        }
        accountsOut.push(bankAcc);
      }

      return json({
        status: "LN",
        connection_id: conn.id,
        accounts: accountsOut,
      });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (err) {
    console.error("bank-link error:", err);
    return json({ error: "internal", message: String(err) }, 500);
  }
});

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
