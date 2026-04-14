const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { symbol, interval = "1d", range = "2d" } = await req.json();

    if (!symbol) {
      return new Response(JSON.stringify({ error: "symbol is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://finance.yahoo.com/",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance returned ${res.status}`);
    }

    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;

    if (!meta?.regularMarketPrice) {
      throw new Error("No price data in response");
    }

    const current = meta.regularMarketPrice;
    const prev = meta.previousClose || meta.chartPreviousClose;
    const change24h = prev ? ((current - prev) / prev) * 100 : null;

    return new Response(
      JSON.stringify({
        price: Math.round(current * 100) / 100,
        change24h: change24h ? Math.round(change24h * 100) / 100 : null,
        currency: meta.currency || "USD",
        symbol,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
