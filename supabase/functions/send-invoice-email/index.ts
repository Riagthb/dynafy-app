import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, invoiceNumber, clientName, totalAmount, pdfBase64 } =
      await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    // Build the email payload
    const emailPayload: Record<string, unknown> = {
      from: "Dynafy <noreply@dynafy.nl>",
      to: [to],
      subject: subject || `Factuur ${invoiceNumber} van Dynafy`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #4f46e5;">Factuur ${invoiceNumber}</h2>
          <p>Beste ${clientName},</p>
          <p>Hierbij ontvangt u factuur <strong>${invoiceNumber}</strong> met een totaalbedrag van <strong>${totalAmount}</strong>.</p>
          <p>De factuur is bijgevoegd als PDF bij deze e-mail.</p>
          <p>Heeft u vragen? Neem gerust contact met ons op.</p>
          <br/>
          <p>Met vriendelijke groet,<br/>Dynafy</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 12px; color: #999;">Dit is een automatisch gegenereerde e-mail van Dynafy.</p>
        </div>
      `,
    };

    // Attach PDF if provided
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

    if (!res.ok) {
      throw new Error(data.message || "Failed to send email via Resend");
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
