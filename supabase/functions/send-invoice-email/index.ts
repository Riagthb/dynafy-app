// ============================================================================
// send-invoice-email
// ----------------------------------------------------------------------------
// Verstuurt factuur-mail via Resend. Sinds v2 bevat de From-display de
// bedrijfsnaam van de afzender (de Dynafy-gebruiker, niet de ontvanger),
// zodat de klant van de Dynafy-gebruiker direct ziet wie de factuur stuurt
// in plaats van een anoniem "Dynafy <noreply@dynafy.nl>".
//
// Voorbeeld inbox-weergave bij ontvanger:
//   Bakkerij Jansen via Dynafy <noreply@dynafy.nl>
//   Onderwerp: Factuur 2026-003 van Bakkerij Jansen
//
// Reply-To wordt op het opgegeven adres gezet (caller-keuze) of valt terug op
// senderEmail. Dit zorgt dat antwoorden direct bij de echte afzender komen.
//
// Body:
//   to            (verplicht)  string — primaire ontvanger
//   subject       (optioneel)  string — anders gegenereerd
//   body          (optioneel)  string — pre-rendered platte tekst
//   invoiceNumber (verplicht)  string
//   clientName    (optioneel)  string — naam ontvanger voor aanhef
//   totalAmount   (optioneel)  string — al geformatteerd "€ 1.234,56"
//   pdfBase64     (optioneel)  string — PDF attachment
//   cc            (optioneel)  string — extra cc
//   replyTo       (optioneel)  string — overrules senderEmail
//   senderName    (optioneel)  string — bedrijfsnaam van Dynafy-gebruiker
//   senderEmail   (optioneel)  string — email van Dynafy-gebruiker (Reply-To fallback)
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voorkom dat een kwaadwillende sendername mail-headers kan injecteren.
// CR/LF en quotes/<>/comma's zijn de gevaarlijke karakters in een display-name.
const sanitizeDisplayName = (s: string) =>
  String(s ?? "")
    .replace(/[\r\n<>"]/g, " ")
    .replace(/,/g, " ")
    .trim()
    .slice(0, 80);

// Basale email-validatie zodat we geen ongeldige Reply-To meegeven aan Resend.
const isValidEmail = (s: string) =>
  typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      to, subject, body, invoiceNumber, clientName, totalAmount, pdfBase64,
      cc, replyTo, senderName, senderEmail,
    } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");

    // ── Afzender-display: "Bakkerij Jansen via Dynafy <noreply@dynafy.nl>" ──
    // Mail blijft technisch vanuit noreply@dynafy.nl (DKIM/SPF gebruikt het
    // verified Resend-domein), maar visueel zien ontvangers de Dynafy-gebruiker
    // als afzender. Geen DNS-werk nodig.
    const cleanSender = sanitizeDisplayName(senderName);
    const fromHeader = cleanSender
      ? `${cleanSender} via Dynafy <noreply@dynafy.nl>`
      : `Dynafy <noreply@dynafy.nl>`;

    // ── Reply-To: caller-opgegeven adres > senderEmail > geen Reply-To ──
    const replyCandidates = [replyTo, senderEmail].filter((x): x is string =>
      typeof x === "string" && isValidEmail(x.trim())
    );
    const replyToHeader = replyCandidates.length ? replyCandidates[0].trim() : undefined;

    // ── Subject + body: gebruik senderName waar beschikbaar ──
    const senderForCopy = cleanSender || "Dynafy";
    const finalSubject =
      subject ||
      `Factuur ${invoiceNumber} van ${senderForCopy}`;

    const html = body
      ? body.replace(/\n/g, "<br/>")  // pre-rendered plain text → simple HTML
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4f46e5;">Factuur ${invoiceNumber}</h2>
          <p>Beste ${clientName || "heer/mevrouw"},</p>
          <p>Hierbij ontvangt u factuur <strong>${invoiceNumber}</strong>${
            totalAmount ? ` met een totaalbedrag van <strong>${totalAmount}</strong>` : ""
          }.</p>
          <p>De factuur is bijgevoegd als PDF bij deze e-mail.</p>
          <p>Heeft u vragen? Neem gerust contact met ons op.</p>
          <br/>
          <p>Met vriendelijke groet,<br/>${senderForCopy}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 12px; color: #999;">Verzonden via Dynafy.</p>
        </div>
      `;

    const emailPayload: Record<string, unknown> = {
      from: fromHeader,
      to: [to],
      subject: finalSubject,
      html,
    };
    if (cc && isValidEmail(String(cc).trim())) emailPayload.cc = [String(cc).trim()];
    if (replyToHeader) emailPayload.reply_to = [replyToHeader];

    if (pdfBase64) {
      emailPayload.attachments = [
        {
          filename: `Factuur-${invoiceNumber}.pdf`,
          content: pdfBase64,
        },
      ];
    }

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
