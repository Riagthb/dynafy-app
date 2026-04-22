// supabase/functions/impersonate-user/index.ts
// Deno Edge Function — generates a magic-link session for a target user,
// so an admin can log in as them for support/debug purposes.
//
// Security:
//   - Only is_admin=true callers are allowed
//   - Cannot impersonate yourself
//   - Cannot impersonate another admin (no privilege escalation)
//   - Every call is logged to audit_log table
//
// Returns: { token_hash, email } — client calls supabase.auth.verifyOtp to swap session.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ok = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const fail = (msg: string, status = 400) =>
  new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return fail("Niet geautoriseerd", 401);

    // Verify caller is an admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
    if (authError || !caller) return fail("Ongeldige sessie", 401);

    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("is_admin, email")
      .eq("id", caller.id)
      .single();

    if (!callerProfile?.is_admin) return fail("Geen admin-rechten", 403);

    // Parse body
    const { userId, reason } = await req.json();
    if (!userId) return fail("userId ontbreekt");
    if (userId === caller.id) return fail("Je kunt niet als jezelf inloggen");

    // Admin client for privileged ops
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch target profile — block impersonating admins
    const { data: target, error: targetErr } = await adminClient
      .from("profiles")
      .select("id, email, is_admin, disabled")
      .eq("id", userId)
      .single();

    if (targetErr || !target) return fail("Gebruiker niet gevonden", 404);
    if (target.is_admin) return fail("Kan geen andere admin impersoneren", 403);
    if (target.disabled) return fail("Gebruiker is geblokkeerd", 400);
    if (!target.email) return fail("Gebruiker heeft geen e-mailadres", 400);

    // Generate magic link — returns token_hash + action_link
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: target.email,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      return fail(`Magic link mislukt: ${linkErr?.message || "onbekend"}`, 500);
    }

    // Audit log — start event
    await adminClient.from("audit_log").insert({
      actor_id: caller.id,
      actor_email: callerProfile.email || caller.email,
      action: "impersonate_start",
      target_id: target.id,
      target_email: target.email,
      reason: reason || null,
      metadata: { user_agent: req.headers.get("user-agent") || null },
    });

    return ok({
      token_hash: linkData.properties.hashed_token,
      email: target.email,
      target_id: target.id,
    });
  } catch (err) {
    console.error("impersonate-user error:", err);
    return fail("Interne serverfout", 500);
  }
});
