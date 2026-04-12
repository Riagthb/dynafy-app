// supabase/functions/delete-user/index.ts
// Deno Edge Function — deletes a user from Supabase Auth.
// Only callable by admins (is_admin = true in profiles table).

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get caller's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return fail("Niet geautoriseerd", 401);

    // Verify caller is an admin using their own credentials
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !callerUser) return fail("Ongeldige sessie", 401);

    // Check if caller is admin
    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("is_admin")
      .eq("id", callerUser.id)
      .single();

    if (!callerProfile?.is_admin) return fail("Geen admin-rechten", 403);

    // Parse request body
    const { userId } = await req.json();
    if (!userId) return fail("userId ontbreekt");

    // Prevent self-deletion
    if (userId === callerUser.id) return fail("Je kunt je eigen account niet verwijderen");

    // Delete the user using service role (admin) client
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) return fail(`Verwijderen mislukt: ${deleteError.message}`);

    return ok({ success: true, deletedUserId: userId });
  } catch (err) {
    console.error("delete-user error:", err);
    return fail("Interne serverfout", 500);
  }
});
