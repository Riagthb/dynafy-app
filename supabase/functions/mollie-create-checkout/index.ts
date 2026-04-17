// ============================================================================
// mollie-create-checkout
// ----------------------------------------------------------------------------
// Called by the frontend when user clicks "Upgrade naar ZZP Diamond".
// Creates a Mollie customer (if needed) + first payment (sequenceType=first),
// which captures a mandate. After successful first payment, the webhook will
// upgrade the user's plan AND create the Mollie subscription for recurring.
//
// Auth: requires Supabase user JWT in Authorization header.
//
// Env (set via `supabase secrets set`):
//   MOLLIE_API_KEY   - test_... or live_... (start with test!)
//
// Auto-injected by Supabase:
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

// v1 scope constants (see dec-billing-v1-scope in brain)
const TIER = "zzp_diamond";
const INTERVAL = "month";
const AMOUNT_CENTS = 8900; // €89.00
const CURRENCY = "EUR";
const DESCRIPTION = "Dynafy ZZP Diamond — maand";

// URLs
const APP_URL = "https://app.dynafy.nl";
const REDIRECT_URL = `${APP_URL}/?billing=success`;
const WEBHOOK_URL =
  "https://gcsvxintwotkezxigpdg.supabase.co/functions/v1/mollie-webhook";

const MOLLIE_API = "https://api.mollie.com/v2";

// ----------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // --- Auth: extract user from JWT ----------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "missing_auth" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mollieKey = Deno.env.get("MOLLIE_API_KEY");

    if (!mollieKey) {
      return json({ error: "mollie_not_configured" }, 500);
    }

    // Client with user JWT → for getUser()
    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "invalid_token" }, 401);
    }
    const user = userData.user;

    // Admin client for DB writes (bypasses RLS)
    const admin = createClient(supabaseUrl, serviceKey);

    // --- Fetch profile (name / email) ---------------------------------------
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const email = profile?.email ?? user.email ?? "";
    const name = profile?.display_name ?? email.split("@")[0] ?? "Dynafy user";

    if (!email) {
      return json({ error: "missing_email" }, 400);
    }

    // --- Existing subscription check ----------------------------------------
    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("id, status, mollie_customer_id, mollie_subscription_id")
      .eq("user_id", user.id)
      .eq("tier", TIER)
      .maybeSingle();

    if (existingSub && existingSub.status === "active") {
      return json({ error: "already_active" }, 409);
    }

    // --- Create or reuse Mollie customer ------------------------------------
    let mollieCustomerId = existingSub?.mollie_customer_id ?? null;
    if (!mollieCustomerId) {
      const customerRes = await mollieFetch(
        mollieKey,
        "POST",
        "/customers",
        {
          name,
          email,
          metadata: { user_id: user.id },
        },
      );
      if (!customerRes.ok) {
        return json(
          { error: "mollie_customer_create_failed", detail: customerRes.body },
          502,
        );
      }
      mollieCustomerId = customerRes.body.id;
    }

    // --- Create first payment (sequenceType: first) -------------------------
    // After it's paid, Mollie has a mandate — we then create the subscription
    // inside the webhook handler.
    const paymentRes = await mollieFetch(mollieKey, "POST", "/payments", {
      amount: { currency: CURRENCY, value: (AMOUNT_CENTS / 100).toFixed(2) },
      description: DESCRIPTION,
      customerId: mollieCustomerId,
      sequenceType: "first",
      redirectUrl: REDIRECT_URL,
      webhookUrl: WEBHOOK_URL,
      metadata: {
        user_id: user.id,
        tier: TIER,
        interval: INTERVAL,
        kind: "subscription_first",
      },
    });
    if (!paymentRes.ok) {
      return json(
        { error: "mollie_payment_create_failed", detail: paymentRes.body },
        502,
      );
    }

    const checkoutUrl = paymentRes.body?._links?.checkout?.href;
    if (!checkoutUrl) {
      return json({ error: "no_checkout_url", detail: paymentRes.body }, 502);
    }

    // --- Upsert pending subscription row ------------------------------------
    await admin
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          tier: TIER,
          billing_interval: INTERVAL,
          amount_cents: AMOUNT_CENTS,
          currency: CURRENCY,
          mollie_customer_id: mollieCustomerId,
          status: "pending",
        },
        { onConflict: "user_id,tier" },
      );

    return json({ checkoutUrl, paymentId: paymentRes.body.id }, 200);
  } catch (err) {
    console.error("mollie-create-checkout error:", err);
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

async function mollieFetch(
  apiKey: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch(`${MOLLIE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body: data };
}
