// ============================================================================
// accept-invitation
// ----------------------------------------------------------------------------
// Klant accepteert (of weigert) een boekhouder-uitnodiging via token.
//
//   action: "lookup"    → token-info opvragen voor de consent-modal
//                          (geen state-change; non-revealing als token ongeldig)
//   action: "accept"    → bevestiging: client_links rij + status=accepted
//   action: "decline"   → status=declined
//
// Auth: Supabase user JWT vereist. Daarnaast STRICT email-match: alleen de
// auth.user wiens email gelijk is aan invitation.invite_email mag accepteren.
// Als ingelogd account afwijkt → wrong_account error (frontend forceert
// logout + opnieuw inloggen op het juiste account).
//
// Env (auto-injected):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });

// Een opt-in helper die uitnodigingen die over de expiry zijn auto-markeert.
// Op die manier krijgt de klant nooit een "succesvolle accept" op een verlopen
// uitnodiging, en is de status-trail in de DB consistent.
function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "invalid_token" }, 401);
    const caller = userData.user;
    const callerEmail = (caller.email ?? "").toLowerCase();

    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const token = String(body?.token ?? "");
    if (!token) return json({ error: "missing_token" }, 400);

    // Token ophalen + boekhouder-info voor display in modal.
    const { data: inv, error: invErr } = await admin
      .from("accountant_invitations")
      .select("id, accountant_user_id, invite_email, status, expires_at")
      .eq("invite_token", token)
      .maybeSingle();
    if (invErr) return json({ error: "lookup_failed", detail: invErr.message }, 500);
    if (!inv) return json({ error: "invitation_not_found" }, 404);

    // Auto-expire bij eerste contact na expiry-tijd.
    if (inv.status === "pending" && isExpired(inv.expires_at)) {
      await admin
        .from("accountant_invitations")
        .update({ status: "expired" })
        .eq("id", inv.id);
      inv.status = "expired";
    }

    // Boekhouder-profiel voor display
    const { data: accountantProfile } = await admin
      .from("profiles")
      .select("id, name, company_name, email, role")
      .eq("id", inv.accountant_user_id)
      .maybeSingle();
    const accountantDisplay =
      accountantProfile?.company_name?.trim() ||
      accountantProfile?.name?.trim() ||
      accountantProfile?.email ||
      "Onbekend";

    // ------------------------------------------------------------------------
    // LOOKUP — geeft frontend de info voor de consent-modal.
    // Bij wrong_account toch het email tonen zodat UI duidelijk kan maken
    // welk account vereist is, maar nooit de boekhouder-identiteit lekken
    // als token ongeldig is.
    // ------------------------------------------------------------------------
    if (action === "lookup") {
      if (inv.status !== "pending") {
        return json({
          status: inv.status,
          error: inv.status, // "expired" | "accepted" | "declined" | "revoked"
        });
      }
      if (callerEmail !== inv.invite_email) {
        return json({
          error: "wrong_account",
          required_email: inv.invite_email,
        }, 403);
      }
      return json({
        status: "pending",
        accountant_name: accountantDisplay,
        accountant_role: accountantProfile?.role ?? "boekhouder",
        invite_email: inv.invite_email,
        expires_at: inv.expires_at,
      });
    }

    // ------------------------------------------------------------------------
    // Vanaf hier muteren we — strict checks
    // ------------------------------------------------------------------------
    if (inv.status !== "pending") {
      return json({ error: inv.status }, 409); // expired/accepted/declined/revoked
    }
    if (callerEmail !== inv.invite_email) {
      return json({
        error: "wrong_account",
        required_email: inv.invite_email,
      }, 403);
    }

    // ------------------------------------------------------------------------
    if (action === "accept") {
      // Bestaat al een actieve client_links rij tussen deze twee? (race-safety)
      const { data: existingLink } = await admin
        .from("client_links")
        .select("id")
        .eq("client_user_id", caller.id)
        .eq("linked_user_id", inv.accountant_user_id)
        .eq("status", "accepted")
        .maybeSingle();

      if (!existingLink) {
        const { error: linkErr } = await admin
          .from("client_links")
          .insert({
            client_user_id: caller.id,
            linked_user_id: inv.accountant_user_id,
            role: accountantProfile?.role ?? "boekhouder",
            invite_code: `INVITE-${inv.id.slice(0, 8)}`,
            status: "accepted",
          });
        if (linkErr) {
          return json({ error: "link_create_failed", detail: linkErr.message }, 500);
        }
      }

      const { error: updErr } = await admin
        .from("accountant_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          accepted_by_user_id: caller.id,
        })
        .eq("id", inv.id);
      if (updErr) {
        return json({ error: "status_update_failed", detail: updErr.message }, 500);
      }

      return json({
        success: true,
        accountant_name: accountantDisplay,
      });
    }

    // ------------------------------------------------------------------------
    if (action === "decline") {
      const { error: updErr } = await admin
        .from("accountant_invitations")
        .update({
          status: "declined",
          declined_at: new Date().toISOString(),
          accepted_by_user_id: caller.id, // wie heeft op decline gedrukt
        })
        .eq("id", inv.id);
      if (updErr) {
        return json({ error: "status_update_failed", detail: updErr.message }, 500);
      }
      return json({ success: true });
    }

    return json({ error: "unknown_action", action }, 400);
  } catch (err) {
    return json({ error: "internal_error", detail: (err as Error).message }, 500);
  }
});
