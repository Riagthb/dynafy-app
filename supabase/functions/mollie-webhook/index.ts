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

  // --- Idempotency: skip only if row exists AND PDF already generated ------
  // If PDF is missing (earlier webhook crashed or v2-era invoice), fall
  // through so createInvoice → generateAndSendInvoice runs and fills the gap.
  const { data: existingInvoice } = await admin
    .from("billing_invoices")
    .select("id, status, pdf_storage_path")
    .eq("mollie_payment_id", p.id)
    .maybeSingle();

  if (
    existingInvoice &&
    existingInvoice.status === "paid" &&
    existingInvoice.pdf_storage_path
  ) {
    return;
  }

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
  const { data: upserted } = await admin
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
    )
    .select("id, invoice_number, pdf_storage_path")
    .single();

  // --- PDF + email (best-effort; don't fail webhook on PDF errors) ---------
  if (upserted && !upserted.pdf_storage_path) {
    try {
      await generateAndSendInvoice({
        admin,
        userId,
        invoiceId: upserted.id,
        invoiceNumber: upserted.invoice_number,
        subtotalCents,
        vatCents,
        totalCents,
        currency: payment.amount.currency,
        periodStart,
        periodEnd,
        paymentId: payment.id,
        paidAt: payment.paidAt ?? new Date().toISOString(),
      });
    } catch (err) {
      console.error("invoice pdf/email failed (non-fatal):", err);
    }
  }
}

// ----------------------------------------------------------------------------
// PDF + email: generates NL-compliant invoice PDF via pdf-lib, uploads to
// private 'invoices' bucket at path {user_id}/{invoice_number}.pdf, updates
// billing_invoices.pdf_storage_path, and emails customer via Resend with PDF
// as attachment.
// ----------------------------------------------------------------------------
async function generateAndSendInvoice(args: {
  admin: ReturnType<typeof createClient>;
  userId: string;
  invoiceId: string;
  invoiceNumber: string;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  paymentId: string;
  paidAt: string;
}) {
  const { admin, userId, invoiceNumber, subtotalCents, vatCents, totalCents,
    currency, periodStart, periodEnd, paymentId, paidAt } = args;

  // Fetch customer details (for PDF header + email recipient)
  // Note: profiles schema has 'name' but no 'display_name'.
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("email, name, company_name, address, postal_code, city, btw_number, kvk")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) console.warn("profile fetch failed:", profileErr.message);

  const customerEmail = profile?.email;
  const customerName =
    profile?.name ?? (customerEmail ?? "").split("@")[0] ?? "Dynafy klant";
  if (!customerEmail) {
    console.warn("no email on profile; skip email, still generate PDF");
  }

  // --- Generate PDF -------------------------------------------------------
  const pdfBytes = await renderInvoicePdf({
    invoiceNumber,
    paidAt: new Date(paidAt),
    periodStart,
    periodEnd,
    customerName,
    customerEmail: customerEmail ?? "",
    companyName: profile?.company_name ?? "",
    address: profile?.address ?? "",
    postalCode: profile?.postal_code ?? "",
    city: profile?.city ?? "",
    btwNumber: profile?.btw_number ?? "",
    kvk: profile?.kvk ?? "",
    subtotalCents,
    vatCents,
    totalCents,
    currency,
    paymentId,
  });

  // --- Upload to Storage -------------------------------------------------
  const storagePath = `${userId}/${invoiceNumber}.pdf`;
  const { error: uploadErr } = await admin.storage
    .from("invoices")
    .upload(storagePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadErr) {
    console.error("storage upload failed:", uploadErr);
    // Still try to email if we have bytes
  } else {
    await admin
      .from("billing_invoices")
      .update({ pdf_storage_path: storagePath })
      .eq("mollie_payment_id", paymentId);
  }

  // --- Email via Resend --------------------------------------------------
  if (customerEmail) {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("RESEND_API_KEY not set; skip email");
      return;
    }
    const pdfBase64 = bytesToBase64(pdfBytes);
    const totalEur = (totalCents / 100).toFixed(2).replace(".", ",");
    const emailPayload = {
      from: "Dynafy <contact@dynafy.nl>",
      to: [customerEmail],
      subject: `Factuur ${invoiceNumber} — Dynafy ZZP Diamond`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #0f172a;">
          <h2 style="color: #4f8ef7; margin-top: 0;">Bedankt voor je betaling</h2>
          <p>Hoi ${escapeHtml(customerName)},</p>
          <p>We hebben je betaling van <strong>€ ${totalEur}</strong> ontvangen voor Dynafy ZZP Diamond (maand).</p>
          <p>De factuur <strong>${invoiceNumber}</strong> zit als PDF bij deze e-mail.</p>
          <p>Je kunt de factuur ook altijd terugvinden in de app onder <em>Instellingen → Facturen</em>.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b;">Dynafy is een product van Jong Inzicht B.V. Vragen? Stuur een mail naar <a href="mailto:contact@dynafy.nl" style="color: #4f8ef7;">contact@dynafy.nl</a>.</p>
        </div>
      `,
      attachments: [
        { filename: `Factuur-${invoiceNumber}.pdf`, content: pdfBase64 },
      ],
    };
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("resend send failed:", res.status, err);
    }
  }
}

// ----------------------------------------------------------------------------
// Render a clean invoice PDF using pdf-lib (Deno-compatible).
// Layout: Dynafy header, to/from boxes, line table, totals block, footer.
// ----------------------------------------------------------------------------
async function renderInvoicePdf(d: {
  invoiceNumber: string;
  paidAt: Date;
  periodStart: Date;
  periodEnd: Date;
  customerName: string;
  customerEmail: string;
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
  btwNumber: string;
  kvk: string;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  currency: string;
  paymentId: string;
}): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import(
    "https://esm.sh/pdf-lib@1.17.1"
  );
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const M = 50; // margin
  const W = 595.28;
  let y = 795;

  const text = (s: string, x: number, yy: number, opts: { size?: number; f?: any; color?: any } = {}) => {
    page.drawText(s, {
      x, y: yy,
      size: opts.size ?? 10,
      font: opts.f ?? font,
      color: opts.color ?? rgb(0.06, 0.09, 0.16),
    });
  };
  const line = (x1: number, y1: number, x2: number, y2: number, color = rgb(0.85, 0.87, 0.91)) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color });
  };

  // Header: "Dynafy" brand + invoice title
  text("Dynafy", M, y, { size: 22, f: bold, color: rgb(0.31, 0.56, 0.97) });
  text("FACTUUR", W - M - bold.widthOfTextAtSize("FACTUUR", 22), y, { size: 22, f: bold });
  y -= 26;
  text("Jong Inzicht B.V.", M, y, { size: 9, color: rgb(0.4, 0.46, 0.53) });
  y -= 16;
  line(M, y, W - M, y);
  y -= 24;

  // Two columns: Van (left), Factuur aan (right)
  const leftX = M;
  const rightX = W / 2 + 10;
  text("VAN", leftX, y, { size: 8, f: bold, color: rgb(0.4, 0.46, 0.53) });
  text("FACTUUR AAN", rightX, y, { size: 8, f: bold, color: rgb(0.4, 0.46, 0.53) });
  y -= 14;
  const fromLines = [
    "Jong Inzicht B.V.",
    "contact@dynafy.nl",
    "https://dynafy.nl",
  ];
  const toLines = [
    d.companyName || d.customerName,
    ...(d.companyName && d.customerName !== d.companyName ? [d.customerName] : []),
    ...(d.address ? [d.address] : []),
    ...(d.postalCode || d.city ? [`${d.postalCode} ${d.city}`.trim()] : []),
    d.customerEmail,
    ...(d.btwNumber ? [`BTW: ${d.btwNumber}`] : []),
    ...(d.kvk ? [`KvK: ${d.kvk}`] : []),
  ];
  const maxLines = Math.max(fromLines.length, toLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (fromLines[i]) text(fromLines[i], leftX, y, { size: 10 });
    if (toLines[i]) text(toLines[i], rightX, y, { size: 10 });
    y -= 14;
  }
  y -= 10;
  line(M, y, W - M, y);
  y -= 24;

  // Invoice meta
  const meta = [
    ["Factuurnummer", d.invoiceNumber],
    ["Factuurdatum", d.paidAt.toLocaleDateString("nl-NL")],
    ["Periode", `${d.periodStart.toLocaleDateString("nl-NL")} t/m ${d.periodEnd.toLocaleDateString("nl-NL")}`],
    ["Betaalreferentie", d.paymentId],
  ];
  for (const [k, v] of meta) {
    text(k, leftX, y, { size: 9, color: rgb(0.4, 0.46, 0.53) });
    text(v, leftX + 120, y, { size: 10 });
    y -= 14;
  }
  y -= 18;

  // Line item table
  text("OMSCHRIJVING", leftX, y, { size: 8, f: bold, color: rgb(0.4, 0.46, 0.53) });
  text("BEDRAG (EXCL.)", W - M - 120, y, { size: 8, f: bold, color: rgb(0.4, 0.46, 0.53) });
  y -= 8;
  line(M, y, W - M, y);
  y -= 18;
  text("Dynafy ZZP Diamond — maand abonnement", leftX, y, { size: 11 });
  const amountExcl = eur(d.subtotalCents, d.currency);
  text(amountExcl, W - M - font.widthOfTextAtSize(amountExcl, 11), y, { size: 11 });
  y -= 14;
  text(
    `Periode: ${d.periodStart.toLocaleDateString("nl-NL")} – ${d.periodEnd.toLocaleDateString("nl-NL")}`,
    leftX, y, { size: 9, color: rgb(0.4, 0.46, 0.53) },
  );
  y -= 22;
  line(M, y, W - M, y);
  y -= 20;

  // Totals block (right-aligned)
  const drawTotalRow = (label: string, value: string, opts: { emphasize?: boolean } = {}) => {
    const f = opts.emphasize ? bold : font;
    const size = opts.emphasize ? 12 : 10;
    const labelX = W - M - 250;
    const valueX = W - M - f.widthOfTextAtSize(value, size);
    text(label, labelX, y, { size, f });
    text(value, valueX, y, { size, f });
    y -= opts.emphasize ? 20 : 16;
  };
  drawTotalRow("Subtotaal (excl. BTW)", eur(d.subtotalCents, d.currency));
  drawTotalRow(`BTW 21%`, eur(d.vatCents, d.currency));
  y -= 4;
  line(W - M - 250, y + 10, W - M, y + 10);
  drawTotalRow("Totaal (incl. BTW)", eur(d.totalCents, d.currency), { emphasize: true });

  // Paid stamp (use ASCII only — Helvetica WinAnsi encoding can't render ✓)
  y -= 20;
  page.drawRectangle({
    x: W - M - 110, y: y - 4, width: 110, height: 22,
    borderColor: rgb(0.13, 0.77, 0.37), borderWidth: 1.5, color: rgb(0.13, 0.77, 0.37), opacity: 0.08,
  });
  text("BETAALD", W - M - 85, y + 4, { size: 11, f: bold, color: rgb(0.09, 0.54, 0.25) });

  // Footer
  y = 80;
  line(M, y + 20, W - M, y + 20);
  text(
    "Betaling is ontvangen via Mollie. Deze factuur voldoet aan de vereisten van de Nederlandse Belastingdienst.",
    M, y, { size: 8, color: rgb(0.4, 0.46, 0.53) },
  );
  text(
    "Dynafy is een product van Jong Inzicht B.V. — vragen? contact@dynafy.nl",
    M, y - 12, { size: 8, color: rgb(0.4, 0.46, 0.53) },
  );

  return await pdf.save();
}

// EUR formatter in NL style (€ 89,00)
function eur(cents: number, currency = "EUR"): string {
  const v = (cents / 100).toFixed(2).replace(".", ",");
  const sym = currency === "EUR" ? "€" : currency + " ";
  return `${sym} ${v}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!
  ));
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
