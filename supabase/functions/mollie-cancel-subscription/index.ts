// ============================================================================
// mollie-cancel-subscription
// ----------------------------------------------------------------------------
// Called by the frontend when a user clicks "Abonnement opzeggen".
// Cancels the Mollie subscription (stops recurring charges) and marks our
// subscription row as 'cancelled'. User KEEPS access until current_period_end
// — no partial refund, just no renewal.
//
// Auth: requires Supabase user JWT in Authorization header.
//
// Env:
//   MOLLIE_API_KEY              - test_... or live_...
//   SUPABASE_URL                - auto-injected
//   SUPABASE_SERVICE_ROLE_KEY   - auto-injected
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MOLLIE_API = "https://api.mollie.com/v2";

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
    const mollieKey = Deno.env.get("MOLLIE_API_KEY");
    if (!mollieKey) return json({ error: "mollie_not_configured" }, 500);

    // User JWT → auth.getUser
    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "invalid_token" }, 401);
    }
    const user = userData.user;
    const admin = createClient(supabaseUrl, serviceKey);

    // --- Find active subscription -------------------------------------------
    const { data: sub, error: subErr } = await admin
      .from("subscriptions")
      .select("id, tier, status, mollie_customer_id, mollie_subscription_id, current_period_end")
      .eq("user_id", user.id)
      .in("status", ["active", "past_due"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subErr) return json({ error: "db_read_failed", detail: subErr.message }, 500);
    if (!sub) return json({ error: "no_active_subscription" }, 404);
    if (!sub.mollie_customer_id || !sub.mollie_subscription_id) {
      // Edge case: row marked active but no Mollie ids (data inconsistency).
      // Still mark as cancelled so user lands in a clean state.
      await admin
        .from("subscriptions")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", sub.id);
      return json({
        success: true,
        access_until: sub.current_period_end,
        note: "no_mollie_ids_local_only",
      }, 200);
    }

    // --- Cancel at Mollie ---------------------------------------------------
    const mollieRes = await fetch(
      `${MOLLIE_API}/customers/${sub.mollie_customer_id}/subscriptions/${sub.mollie_subscription_id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${mollieKey}`,
          "Content-Type": "application/json",
        },
      },
    );
    const mollieBody = await mollieRes.json().catch(() => ({}));

    // Mollie returns 200 with status=canceled when successful. 404 = already
    // cancelled on their side (idempotent — we proceed to update DB anyway).
    const alreadyCancelled =
      mollieRes.status === 404 ||
      (mollieBody?.status === "canceled");
    if (!mollieRes.ok && !alreadyCancelled) {
      return json(
        { error: "mollie_cancel_failed", detail: mollieBody },
        502,
      );
    }

    // --- Update DB ----------------------------------------------------------
    const { error: updateErr } = await admin
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", sub.id);
    if (updateErr) {
      return json({ error: "db_update_failed", detail: updateErr.message }, 500);
    }

    return json({
      success: true,
      access_until: sub.current_period_end,
      tier: sub.tier,
    }, 200);
  } catch (err) {
    console.error("mollie-cancel-subscription error:", err);
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
