// ============================================================================
// invite-client
// ----------------------------------------------------------------------------
// Boekhouder-initiated klantkoppeling — variant A (strict email-match).
//
//   action: "send"    → nieuwe uitnodiging (lookup + checks + email)
//   action: "resend"  → bestaande pending: nieuwe token + expiry, mail opnieuw
//   action: "revoke"  → boekhouder trekt pending uitnodiging in
//
// Auth: Supabase user JWT vereist; alleen profiles met role 'boekhouder' of
// 'administrateur' mogen uitnodigen.
//
// Env (auto-injected):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APP_URL = "https://app.dynafy.nl";
const RATE_LIMIT_PER_DAY = 10;
const TOKEN_TTL_DAYS = 14;

// ----------------------------------------------------------------------------
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

// URL-safe random token (32 bytes → 43 chars base64url).
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Basis-validatie email (server-side; UI valideert ook).
function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}

// ----------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "resend_not_configured" }, 500);

    // Verify caller JWT
    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "invalid_token" }, 401);
    const caller = userData.user;

    const admin = createClient(supabaseUrl, serviceKey);

    // Caller-profiel ophalen voor rol-check + naam in email
    const { data: callerProfile, error: profErr } = await admin
      .from("profiles")
      .select("id, name, company_name, role, email")
      .eq("id", caller.id)
      .single();
    if (profErr || !callerProfile) return json({ error: "profile_not_found" }, 404);
    if (!["boekhouder", "administrateur"].includes(callerProfile.role)) {
      return json({ error: "not_an_accountant" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    // ------------------------------------------------------------------------
    if (action === "send" || action === "resend") {
      const rawEmail = String(body?.email ?? "").trim().toLowerCase();
      const message = body?.message ? String(body.message).slice(0, 1000) : null;
      if (!isValidEmail(rawEmail)) return json({ error: "invalid_email" }, 400);

      // Rate limit: max 10 invites in laatste 24u door deze boekhouder
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: recentCount, error: countErr } = await admin
        .from("accountant_invitations")
        .select("id", { count: "exact", head: true })
        .eq("accountant_user_id", caller.id)
        .gte("created_at", since);
      if (countErr) return json({ error: "rate_check_failed" }, 500);
      if ((recentCount ?? 0) >= RATE_LIMIT_PER_DAY) {
        return json({ error: "rate_limit_exceeded", limit: RATE_LIMIT_PER_DAY }, 429);
      }

      // Strict email-match: email moet bij een bestaand Dynafy-account horen.
      // We checken auth.users (authoritative) ipv profiles.email.
      const { data: targetList, error: lookupErr } = await admin
        .auth.admin.listUsers({ page: 1, perPage: 1, /* filter via API niet beschikbaar */ });
      // listUsers heeft geen email-filter — gebruik directe query.
      // (De lookup hier is alleen fallback; we doen primair een directe query op auth.users
      // via admin.from is niet mogelijk. We gebruiken profiles.email als index met
      // backup-check via auth.admin.getUserById.)
      let targetUserId: string | null = null;
      let targetProfile: { id: string; email: string | null; company_name: string | null; name: string | null } | null = null;

      const { data: profByEmail } = await admin
        .from("profiles")
        .select("id, email, company_name, name")
        .ilike("email", rawEmail)
        .maybeSingle();

      if (profByEmail) {
        targetUserId = profByEmail.id;
        targetProfile = profByEmail;
      } else {
        // Fallback: scan auth.users via pagination (alleen kleine schaal acceptabel).
        // In productie: vervang door RPC die auth.users direct queriet.
        const { data: authList } = await admin.auth.admin.listUsers({
          page: 1, perPage: 1000,
        });
        const match = authList?.users?.find(
          (u: any) => (u.email || "").toLowerCase() === rawEmail
        );
        if (match) {
          targetUserId = match.id;
          targetProfile = { id: match.id, email: match.email ?? rawEmail, company_name: null, name: null };
        }
      }

      if (!targetUserId) {
        return json({ error: "email_not_found" }, 404);
      }

      // Self-invite blokkeren
      if (targetUserId === caller.id) {
        return json({ error: "cannot_invite_self" }, 400);
      }

      // Bestaande accepted koppeling? Dan al gekoppeld.
      const { data: existingLink } = await admin
        .from("client_links")
        .select("id")
        .eq("client_user_id", targetUserId)
        .eq("linked_user_id", caller.id)
        .eq("status", "accepted")
        .maybeSingle();
      if (existingLink) return json({ error: "already_linked" }, 409);

      // Bestaande pending uitnodiging? Resend.
      const { data: existingInv } = await admin
        .from("accountant_invitations")
        .select("id, status")
        .eq("accountant_user_id", caller.id)
        .eq("invite_email", rawEmail)
        .in("status", ["pending", "expired"])
        .maybeSingle();

      const newToken = generateToken();
      const newExpiry = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

      let invitationId: string;
      if (existingInv) {
        // Resend: vernieuw token + expiry, status terug naar pending.
        const { data: updated, error: updErr } = await admin
          .from("accountant_invitations")
          .update({
            invite_token: newToken,
            expires_at: newExpiry,
            status: "pending",
            message: message ?? undefined,
          })
          .eq("id", existingInv.id)
          .select("id")
          .single();
        if (updErr || !updated) return json({ error: "resend_failed", detail: updErr?.message }, 500);
        invitationId = updated.id;
      } else {
        const { data: inserted, error: insErr } = await admin
          .from("accountant_invitations")
          .insert({
            accountant_user_id: caller.id,
            invite_email: rawEmail,
            invite_token: newToken,
            message: message,
            expires_at: newExpiry,
            status: "pending",
          })
          .select("id")
          .single();
        if (insErr || !inserted) return json({ error: "insert_failed", detail: insErr?.message }, 500);
        invitationId = inserted.id;
      }

      // Email versturen via Resend
      const accountantDisplay =
        callerProfile.company_name?.trim() ||
        callerProfile.name?.trim() ||
        callerProfile.email ||
        "Je boekhouder";
      const targetDisplay = targetProfile?.name?.trim() || targetProfile?.company_name?.trim() || "";

      const acceptUrl = `${APP_URL}/?koppel=${newToken}`;
      const safeAccountant = escapeHtml(accountantDisplay);
      const safeTarget = escapeHtml(targetDisplay);
      const safeMessage = message ? escapeHtml(message) : null;

      const emailPayload = {
        from: "Dynafy <noreply@dynafy.nl>",
        to: [rawEmail],
        subject: `${accountantDisplay} wil je boekhouding doen via Dynafy`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
            <div style="padding: 24px 28px; background: linear-gradient(135deg,#a855f7,#6366f1); border-radius: 14px 14px 0 0; color: #fff;">
              <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.85;">Dynafy koppelverzoek</div>
              <div style="font-size: 20px; font-weight: 800; margin-top: 4px;">${safeAccountant} vraagt toegang</div>
            </div>
            <div style="padding: 24px 28px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 14px 14px;">
              ${safeTarget ? `<p style="margin: 0 0 12px; color: #64748b;">Hallo ${safeTarget},</p>` : ""}
              <p style="margin: 0 0 16px; color: #0f172a;">
                <strong>${safeAccountant}</strong> wil je boekhouding doen via Dynafy
                en vraagt toestemming om jouw administratie te bekijken.
              </p>
              ${safeMessage ? `
                <div style="padding: 14px 16px; background: #f8fafc; border-left: 3px solid #a855f7; border-radius: 8px; color: #0f172a; font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 16px;">${safeMessage}</div>
              ` : ""}
              <p style="margin: 0 0 16px; color: #475569; font-size: 14px;">
                Klik op onderstaande knop om het verzoek te bekijken.
                Je beslist daarna zelf of je accepteert of weigert.
                Je hebt <strong>14 dagen</strong> de tijd.
              </p>
              <div style="margin-top: 22px; text-align: center;">
                <a href="${acceptUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg,#a855f7,#6366f1); color: #fff; text-decoration: none; font-weight: 700; border-radius: 10px; font-size: 14px;">Verzoek bekijken →</a>
              </div>
              <p style="margin: 24px 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
                Dit verzoek is alleen geldig met je Dynafy-account.
                Heb je dit niet aangevraagd? Negeer deze mail.
              </p>
            </div>
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 14px;">
              Verzonden door ${safeAccountant} via Dynafy.
            </p>
          </div>
        `,
      };

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });
      const emailData = await res.json();
      if (!res.ok) {
        return json({ error: "email_send_failed", detail: emailData?.message }, 502);
      }

      return json({
        success: true,
        invitation_id: invitationId,
        resent: !!existingInv,
      });
    }

    // ------------------------------------------------------------------------
    if (action === "revoke") {
      const invitationId = String(body?.invitation_id ?? "");
      if (!invitationId) return json({ error: "missing_invitation_id" }, 400);

      const { data: inv, error: invErr } = await admin
        .from("accountant_invitations")
        .select("id, accountant_user_id, status")
        .eq("id", invitationId)
        .maybeSingle();
      if (invErr || !inv) return json({ error: "invitation_not_found" }, 404);
      if (inv.accountant_user_id !== caller.id) return json({ error: "forbidden" }, 403);
      if (inv.status !== "pending") {
        return json({ error: "not_pending", current_status: inv.status }, 409);
      }

      const { error: updErr } = await admin
        .from("accountant_invitations")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", invitationId);
      if (updErr) return json({ error: "revoke_failed", detail: updErr.message }, 500);

      return json({ success: true });
    }

    return json({ error: "unknown_action", action }, 400);
  } catch (err) {
    return json({ error: "internal_error", detail: (err as Error).message }, 500);
  }
});
