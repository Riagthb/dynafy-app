// supabase/functions/moneybird-proxy/index.ts
// Deno Edge Function — proxies Moneybird API requests server-side to bypass CORS.
// Always returns HTTP 200; errors are reported in JSON body as { error: "..." }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const MONEYBIRD_BASE = "https://moneybird.com/api/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ok = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const fail = (msg: string) =>
  new Response(JSON.stringify({ error: msg }), {
    status: 200, // always 200 so supabase.functions.invoke() doesn't throw
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ALLOWED = ["sales_invoices", "documents/purchase_invoices", "administrations"];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { endpoint, mb_token, administration_id } = await req.json();

    if (!endpoint || !mb_token) {
      return fail("Verplichte velden ontbreken: endpoint, mb_token");
    }

    if (!ALLOWED.some(e => endpoint.startsWith(e))) {
      return fail("Endpoint niet toegestaan");
    }

    const url = endpoint === "administrations"
      ? `${MONEYBIRD_BASE}/administrations.json`
      : `${MONEYBIRD_BASE}/${administration_id}/${endpoint}.json?per_page=100`;

    const mbRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${mb_token}`,
        Accept: "application/json",
      },
    });

    let data: unknown;
    try { data = await mbRes.json(); } catch { data = null; }

    if (!mbRes.ok) {
      const msg =
        mbRes.status === 401 ? "Ongeldig API token — maak een nieuw token aan in Moneybird (Instellingen → Externe applicaties)"
        : mbRes.status === 403 ? "Geen toegang — controleer je Administratie-ID"
        : mbRes.status === 404 ? "Administratie niet gevonden — controleer je Administratie-ID"
        : `Moneybird API fout (${mbRes.status})`;
      return fail(msg);
    }

    return ok(data);
  } catch (e) {
    return fail(e?.message || "Onbekende serverfout");
  }
});
