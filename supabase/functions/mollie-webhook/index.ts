// ============================================================================
// mollie-webhook
// ----------------------------------------------------------------------------
// Mollie posts `id=tr_xxx` (payment) or `id=sub_xxx` (subscription event).
//
// Security model: Mollie does NOT sign webhooks. Defense is that only Mollie
// knows the payment ID — we ALWAYS re-fetch from Mollie API, never trust the
// posted body beyond the ID. Idempotent: re-posts with same ID = no-op.
//
// Flow:
//   1. First payment paid    → create Mollie subscription (recurring), activate plan
//   2. Recurring payment paid → extend current_period_end + create billing_invoice
//   3. Payment failed/expired → mark subscription as failed/past_due
//
// Env:
//   MOLLIE_API_KEY (set via `supabase secrets set`)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MOLLIE_API = "https://api.mollie.com/v2";
const WEBHOOK_URL =
  "https://gcsvxintwotkezxigpdg.supabase.co/functions/v1/mollie-webhook";

// v1 scope
// Pricing excl BTW: €89 + 21% = €107.69 incl BTW. Mollie incasseert incl-bedrag,
// invoice math reverses 21/121 zodat subtotal/vat/total correct worden.
const AMOUNT_CENTS = 10769; // €107.69 incl BTW (= €89 excl + 21%)
const VAT_RATE = 21.0;

// ----------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }

  try {
    // Mollie sends application/x-www-form-urlencoded with `id=...`
    const form = await req.formData();
    const id = form.get("id")?.toString() ?? "";
    if (!id) return text("missing_id", 400);

    const mollieKey = Deno.env.get("MOLLIE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!mollieKey) return text("mollie_not_configured", 500);

    const admin = createClient(supabaseUrl, serviceKey);

    // Dispatch by ID prefix
    if (id.startsWith("tr_")) {
      await handlePayment(id, mollieKey, admin);
    } else if (id.startsWith("sub_")) {
      // Subscription-level events (rare) — re-fetch subscription
      await handleSubscriptionEvent(id, mollieKey, admin);
    }
    // Mollie expects 200 even on internal errors we want to retry
    // (we return 200 after successful processing; errors thrown → 500 → Mollie retries)
    return text("ok", 200);
  } catch (err) {
    console.error("mollie-webhook error:", err);
    return text("internal_error", 500);
  }
});

// ----------------------------------------------------------------------------
async function handlePayment(
  paymentId: string,
  mollieKey: string,
  admin: ReturnType<typeof createClient>,
) {
  // Always re-fetch from Mollie (never trust body)
  const res = await mollieFetch(mollieKey, "GET", `/payments/${paymentId}`);
  if (!res.ok) {
    console.error("fetch payment failed", res.status, res.body);
    throw new Error(`mollie_fetch_failed_${res.status}`);
  }

  const p = res.body;
  const meta = p.metadata ?? {};
  const userId = meta.user_id;
  const tier = meta.tier ?? "zzp_diamond";
  const interval = meta.interval ?? "month";
  const sequenceType = p.sequenceType as "first" | "recurring" | "oneoff";

  if (!userId) {
    console.warn("payment without user_id metadata, ignoring:", paymentId);
    return;
  }

  // --- Idempotency: if we already recorded this payment, stop --------------
  const { data: existingInvoice } = await admin
    .from("billing_invoices")
    .select("id, status")
    .eq("mollie_payment_id", p.id)
    .maybeSingle();

  if (existingInvoice && existingInvoice.status === "paid") return;

  // --- FIRST payment (captured mandate) ------------------------------------
  if (sequenceType === "first") {
    if (p.status === "paid") {
      await activateSubscription({ admin, userId, tier, interval, p, mollieKey });
    } else if (["failed", "expired", "canceled"].includes(p.status)) {
      await admin
        .from("subscriptions")
        .update({ status: "failed" })
        .eq("user_id", userId)
        .eq("tier", tier);
    }
    return;
  }

  // --- RECURRING payment (auto-charged by Mollie) --------------------------
  if (sequenceType === "recurring") {
    if (p.status === "paid") {
      await extendSubscription({ admin, userId, tier, p });
    } else if (["failed", "expired", "canceled"].includes(p.status)) {
      await admin
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("user_id", userId)
        .eq("tier", tier);
    }
    return;
  }

  // oneoff — not expected in v1
  console.warn("unexpected oneoff payment:", paymentId);
}

// ----------------------------------------------------------------------------
async function activateSubscription(args: {
  admin: ReturnType<typeof createClient>;
  userId: string;
  tier: string;
  interval: string;
  p: any;
  mollieKey: string;
}) {
  const { admin, userId, tier, interval, p, mollieKey } = args;

  // Period = 1 month from now (v1 maand-only)
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Get customer id from existing sub row
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, mollie_customer_id")
    .eq("user_id", userId)
    .eq("tier", tier)
    .single();

  if (!sub) {
    console.error("no subscription row for user, tier:", userId, tier);
    return;
  }

  // --- Create Mollie subscription for recurring charges --------------------
  const subRes = await mollieFetch(
    mollieKey,
    "POST",
    `/customers/${sub.mollie_customer_id}/subscriptions`,
    {
      amount: { currency: "EUR", value: (AMOUNT_CENTS / 100).toFixed(2) },
      interval: "1 month",
      description: `Dynafy ZZP Diamond — ${new Date().toISOString().slice(0, 7)}`,
      webhookUrl: WEBHOOK_URL,
      metadata: { user_id: userId, tier, interval },
    },
  );
  if (!subRes.ok) {
    console.error("create subscription failed", subRes.status, subRes.body);
    // Don't throw — first payment succeeded, user should still get access.
    // Jij als admin moet dan handmatig de subscription aanmaken in Mollie dashboard.
  }

  // --- Update subscription row ---------------------------------------------
  await admin
    .from("subscriptions")
    .update({
      status: "active",
      mollie_subscription_id: subRes.body?.id ?? null,
      mollie_mandate_id: p.mandateId ?? null,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq("id", sub.id);

  // --- Bump profiles.plan (this is what userPlan reads in the app) ---------
  await admin.from("profiles").update({ plan: tier }).eq("id", userId);

  // --- Create invoice ------------------------------------------------------
  await createInvoice({
    admin,
    userId,
    subscriptionId: sub.id,
    payment: p,
    periodStart: now,
    periodEnd,
  });
}

// ----------------------------------------------------------------------------
async function extendSubscription(args: {
  admin: ReturnType<typeof createClient>;
  userId: string;
  tier: string;
  p: any;
}) {
  const { admin, userId, tier, p } = args;

  const { data: sub } = await admin
    .from("subscriptions")
    .select("id, current_period_end")
    .eq("user_id", userId)
    .eq("tier", tier)
    .single();

  if (!sub) {
    console.error("recurring payment without matching sub:", userId, tier);
    return;
  }

  // New period starts where previous ended (or now if no prev)
  const start = sub.current_period_end
    ? new Date(sub.current_period_end)
    : new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  await admin
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
    })
    .eq("id", sub.id);

  // Make sure plan is still set (defensive)
  await admin.from("profiles").update({ plan: tier }).eq("id", userId);

  await createInvoice({
    admin,
    userId,
    subscriptionId: sub.id,
    payment: p,
    periodStart: start,
    periodEnd: end,
  });
}

// ----------------------------------------------------------------------------
async function createInvoice(args: {
  admin: ReturnType<typeof createClient>;
  userId: string;
  subscriptionId: string;
  payment: any;
  periodStart: Date;
  periodEnd: Date;
}) {
  const { admin, userId, subscriptionId, payment, periodStart, periodEnd } =
    args;

  const totalCents = Math.round(parseFloat(payment.amount.value) * 100);
  const subtotalCents = Math.round(totalCents / (1 + VAT_RATE / 100));
  const vatCents = totalCents - subtotalCents;

  // Idempotent via mollie_payment_id UNIQUE
  await admin
    .from("billing_invoices")
    .upsert(
      {
        user_id: userId,
        subscription_id: subscriptionId,
        subtotal_cents: subtotalCents,
        vat_cents: vatCents,
        vat_rate: VAT_RATE,
        total_cents: totalCents,
        currency: payment.amount.currency,
        mollie_payment_id: payment.id,
        status: "paid",
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        paid_at: payment.paidAt ?? new Date().toISOString(),
      },
      { onConflict: "mollie_payment_id" },
    );
}

// ----------------------------------------------------------------------------
async function handleSubscriptionEvent(
  subId: string,
  mollieKey: string,
  admin: ReturnType<typeof createClient>,
) {
  // Rare path (cancel via Mollie dashboard etc.). Re-fetch + sync.
  // For v1 we just fetch the subscription and mirror cancelled state.
  const subRes = await mollieFetch(
    mollieKey,
    "GET",
    `/subscriptions/${subId}`,
  );
  if (!subRes.ok) return;
  const s = subRes.body;
  if (s.status === "canceled") {
    await admin
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: s.canceledAt ?? new Date().toISOString(),
      })
      .eq("mollie_subscription_id", s.id);
  }
}

// ----------------------------------------------------------------------------
function text(body: string, status = 200) {
  return new Response(body, { status, headers: CORS_HEADERS });
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
