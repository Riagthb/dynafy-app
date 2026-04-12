// supabase/functions/rompslomp-proxy/index.ts
// Deno Edge Function — proxies Moneybird API requests server-side to bypass CORS.
// Invoke via: supabase.functions.invoke('rompslomp-proxy', { body: { endpoint, mb_token, administration_id } })

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const MONEYBIRD_BASE = "https://moneybird.com/api/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { endpoint, mb_token, administration_id } = await req.json();

    if (!endpoint || !mb_token || !administration_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: endpoint, mb_token, administration_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only allow safe read-only endpoints
    const allowed = ["sales_invoices", "documents/purchase_invoices", "contacts"];
    const isAllowed = allowed.some(e => endpoint.includes(e));
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: "Endpoint not allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `${MONEYBIRD_BASE}/${administration_id}/${endpoint}`;

    const mbRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${mb_token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const data = await mbRes.json();

    if (!mbRes.ok) {
      return new Response(
        JSON.stringify({ error: data?.error || `Moneybird API error ${mbRes.status}`, status: mbRes.status }),
        { status: mbRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
