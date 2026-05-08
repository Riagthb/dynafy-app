// ============================================================================
// bank-link
// ----------------------------------------------------------------------------
// Eén Edge Function die de drie stappen van de Enable Banking AIS consent-flow
// afhandelt:
//
//   action: "list_institutions"   → lijst banken (ASPSPs) voor land (default NL)
//   action: "create_requisition"  → start consent (POST /auth), return checkout URL
//   action: "finalize"            → na bank-callback (?code=&state=): exchange
//                                    code voor session, opslaan accounts
//
// Auth: Supabase user JWT vereist in Authorization header.
//
// Env (via `supabase secrets set`):
//   ENABLE_BANKING_APP_ID       — Application ID (UUID) uit Enable Banking CP
//   ENABLE_BANKING_PRIVATE_KEY  — PEM-encoded RSA private key (PKCS8), volledige
//                                 -----BEGIN PRIVATE KEY----- ... ----- string,
//                                 inclusief newlines (gebruik `supabase secrets
//                                 set --env-file` of multi-line value)
//
// Auto-injected:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
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
const APP_URL = "https://app.dynafy.nl";
const REDIRECT_URL = `${APP_URL}/bank-callback`;
// Default consent-duur in dagen (Enable Banking laat tot 180 toe waar bank
// dat ondersteunt; we vragen 90 voor brede compatibiliteit).
const CONSENT_DAYS = 90;

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

    // Sign one JWT per request — TTL 1h is far longer than needed.
    const token = await getEbToken(ebAppId, ebPrivateKey);
    if (!token) return json({ error: "eb_token_failed" }, 502);

    // ------------------------------------------------------------------------
    if (action === "list_institutions") {
      const country = body.country || "NL";
      const res = await ebFetch(token, "GET", `/aspsps?country=${country}`);
      if (!res.ok) return json({ error: "eb_aspsps_failed", detail: res.body }, 502);

      // Enable Banking returns { aspsps: [...] }
      const aspsps = (res.body as any).aspsps ?? [];

      // Adapt to UI shape: id = "${name}_${country}", behoud GoCardless-like fields.
      const trimmed = aspsps.map((a: any) => ({
        id: `${a.name}_${a.country}`,
        name: a.name,
        country: a.country,
        bic: a.bic ?? null,
        logo: a.logo ?? null,
        // psu_types / auth_methods nodig voor /auth call later; nemen we mee:
        psu_types: a.psu_types ?? ["personal"],
        maximum_consent_validity: a.maximum_consent_validity ?? null,
      }));

      return json({ institutions: trimmed });
    }

    // ------------------------------------------------------------------------
    if (action === "create_requisition") {
      const { institution_id, institution_name, institution_logo, country } = body;
      if (!institution_id) return json({ error: "missing_institution_id" }, 400);

      // institution_id = "${name}_${country}" — split eruit
      const aspspCountry = country || institution_id.split("_").pop() || "NL";
      const aspspName = institution_name
        || institution_id.slice(0, institution_id.lastIndexOf("_"))
        || institution_id;

      // Generate state UUID — wordt door Enable Banking teruggegeven in callback.
      const authState = crypto.randomUUID();
      const reference = `dynafy_${user.id.slice(0, 8)}_${Date.now()}`;

      // Consent valid_until: now + CONSENT_DAYS, ISO 8601
      const validUntil = new Date(
        Date.now() + CONSENT_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();

      const psuType = "personal"; // Dynafy = persoonlijk financieel beheer

      const res = await ebFetch(token, "POST", "/auth", {
        aspsp: { name: aspspName, country: aspspCountry },
        access: {
          valid_until: validUntil,
          balances: true,
          transactions: true,
        },
        state: authState,
        redirect_url: REDIRECT_URL,
        psu_type: psuType,
        language: aspspCountry === "NL" ? "nl" : "en",
      });
      if (!res.ok) {
        return json({ error: "eb_auth_failed", detail: res.body }, 502);
      }

      const auth = res.body as any;
      // Response: { url, authorization_id, psu_id_hash }
      if (!auth?.url || !auth?.authorization_id) {
        return json({ error: "eb_auth_invalid_response", detail: auth }, 502);
      }

      const expiresAt = new Date(validUntil);

      const { data: connection, error: dbErr } = await admin
        .from("bank_connections")
        .insert({
          user_id: user.id,
          aspsp_name: aspspName,
          aspsp_country: aspspCountry,
          institution_id,
          institution_name: institution_name ?? aspspName,
          institution_logo: institution_logo ?? null,
          provider_session_id: auth.authorization_id,
          reference,
          auth_state: authState,
          status: "PENDING",
          consent_url: auth.url,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (dbErr) return json({ error: "db_insert_failed", detail: dbErr.message }, 500);

      return json({
        connection_id: connection.id,
        consent_url: auth.url,
        authorization_id: auth.authorization_id,
        state: authState,
      });
    }

    // ------------------------------------------------------------------------
    if (action === "finalize") {
      // Frontend roept dit aan na bank-redirect terug naar /bank-callback?code=…&state=…
      // Voorkeur: connection_id (uit localStorage). Anders zoek op state.
      const { connection_id, code, state } = body;

      if (!code) return json({ error: "missing_code" }, 400);

      let conn: any = null;
      if (connection_id) {
        const { data } = await admin
          .from("bank_connections")
          .select("*")
          .eq("id", connection_id)
          .eq("user_id", user.id)
          .maybeSingle();
        conn = data;
      } else if (state) {
        const { data } = await admin
          .from("bank_connections")
          .select("*")
          .eq("auth_state", state)
          .eq("user_id", user.id)
          .maybeSingle();
        conn = data;
      }
      if (!conn) return json({ error: "connection_not_found" }, 404);

      // Anti-CSRF: state moet matchen met opgeslagen state
      if (state && conn.auth_state && state !== conn.auth_state) {
        return json({ error: "state_mismatch" }, 400);
      }

      // Exchange code for session
      const sessRes = await ebFetch(token, "POST", "/sessions", { code });
      if (!sessRes.ok) {
        await admin
          .from("bank_connections")
          .update({ status: "ERROR" })
          .eq("id", conn.id);
        return json({ error: "eb_sessions_failed", detail: sessRes.body }, 502);
      }
      const session = sessRes.body as any;
      // Response: { session_id, accounts: [{ uid, account_id:{iban}, name, currency, cash_account_type }], aspsp, access }

      // Update connection: vervang authorization_id → session_id,  status AUTHORIZED
      await admin
        .from("bank_connections")
        .update({
          provider_session_id: session.session_id ?? conn.provider_session_id,
          status: "AUTHORIZED",
        })
        .eq("id", conn.id);

      const accounts: any[] = session.accounts ?? [];
      const accountsOut: any[] = [];

      for (const acc of accounts) {
        const uid = acc.uid;
        if (!uid) continue;

        // Best-effort balance fetch (apart endpoint in Enable Banking)
        let balanceCents: number | null = null;
        const balRes = await ebFetch(token, "GET", `/accounts/${uid}/balances`);
        if (balRes.ok) {
          const balances = (balRes.body as any).balances ?? [];
          // Pak interim/closing booked, anders eerste
          const booked = balances.find((b: any) =>
            b.balance_type === "CLBD" || b.balance_type === "ITBD"
          ) ?? balances[0];
          if (booked?.balance_amount?.amount) {
            balanceCents = Math.round(parseFloat(booked.balance_amount.amount) * 100);
          }
        }

        const { data: bankAcc, error: accErr } = await admin
          .from("bank_accounts")
          .upsert(
            {
              user_id: user.id,
              connection_id: conn.id,
              provider_account_id: uid,
              iban: acc.account_id?.iban ?? null,
              name: acc.name ?? acc.product ?? "Bankrekening",
              currency: acc.currency ?? "EUR",
              cash_account_type: acc.cash_account_type ?? null,
              balance_cents: balanceCents,
              balance_synced_at: balanceCents !== null ? new Date().toISOString() : null,
            },
            { onConflict: "provider_account_id" },
          )
          .select()
          .single();

        if (accErr) {
          console.error("bank_accounts upsert error:", accErr);
          continue;
        }
        accountsOut.push(bankAcc);
      }

      return json({
        status: "AUTHORIZED",
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

/**
 * Sign a self-issued JWT for Enable Banking API auth.
 *
 * Spec (https://enablebanking.com/docs/api/reference/):
 *   alg: RS256
 *   typ: JWT
 *   kid: <application_id>
 *   iss: enablebanking.com
 *   aud: api.enablebanking.com
 *   iat: now
 *   exp: now + (max 24h)
 */
async function getEbToken(appId: string, privateKeyPem: string): Promise<string | null> {
  try {
    // Edge Function env vars met meerregelige PEM kunnen \n als letters bevatten
    // afhankelijk van hoe `supabase secrets set` is aangeroepen. Normaliseer.
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
