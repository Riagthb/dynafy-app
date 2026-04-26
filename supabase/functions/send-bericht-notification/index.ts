// Edge function: stuurt een email-notificatie wanneer iemand een bericht
// post via de Dynafy in-app chat (BerichtenChat). De ontvanger krijgt
// een korte preview + een deeplink naar Dynafy om te antwoorden.
//
// Body: { to_email, to_name, from_name, bericht_preview, app_url }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to_email, to_name, from_name, bericht_preview, app_url } = await req.json();

    if (!to_email || !bericht_preview) {
      throw new Error("to_email en bericht_preview zijn verplicht");
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");

    const safeFrom    = escapeHtml(from_name || "Iemand");
    const safeTo      = escapeHtml(to_name || "");
    const safePreview = escapeHtml(
      bericht_preview.length > 240
        ? bericht_preview.slice(0, 237) + "…"
        : bericht_preview
    );
    const link = app_url || "https://dynafy.nl";

    const emailPayload = {
      from: "Dynafy <noreply@dynafy.nl>",
      to: [to_email],
      subject: `Nieuw bericht van ${from_name || "je contactpersoon"} op Dynafy`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
          <div style="padding: 24px 28px; background: linear-gradient(135deg,#a855f7,#6366f1); border-radius: 14px 14px 0 0; color: #fff;">
            <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.85;">Dynafy bericht</div>
            <div style="font-size: 20px; font-weight: 800; margin-top: 4px;">Nieuw bericht van ${safeFrom}</div>
          </div>
          <div style="padding: 24px 28px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 14px 14px;">
            ${safeTo ? `<p style="margin: 0 0 12px; color: #64748b;">Hallo ${safeTo},</p>` : ""}
            <p style="margin: 0 0 16px; color: #0f172a;">Je hebt een nieuw bericht ontvangen in Dynafy:</p>
            <div style="padding: 14px 16px; background: #f8fafc; border-left: 3px solid #a855f7; border-radius: 8px; color: #0f172a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safePreview}</div>
            <div style="margin-top: 22px; text-align: center;">
              <a href="${link}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg,#a855f7,#6366f1); color: #fff; text-decoration: none; font-weight: 700; border-radius: 10px; font-size: 14px;">Open Dynafy om te antwoorden →</a>
            </div>
            <p style="margin: 24px 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
              Antwoorden gaat via Dynafy, niet via reply op deze mail.
            </p>
          </div>
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 14px;">
            Je ontvangt deze mail omdat je via Dynafy gekoppeld bent met ${safeFrom}.
          </p>
        </div>
      `,
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send email via Resend");

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
