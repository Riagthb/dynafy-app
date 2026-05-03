-- ============================================================================
-- Dynafy Accountant Invitations — boekhouder-initiated klantkoppeling — v1
-- ============================================================================
-- Adds the inverse flow of the existing client-shares-invite_code path:
-- a boekhouder enters a client email, server verifies that email belongs to
-- an existing Dynafy account (strict match — variant A), creates a token,
-- emails the client, and on accept inserts a row in the existing client_links
-- table with the same rights as the invite_code flow.
--
-- Design:
--   accountant_invitations: separate from client_links so expired/declined
--     tokens don't pollute the live-koppelings table. On accept we INSERT
--     into client_links (reusing all existing permission logic).
--
-- Rollout safety:
--   - All operations are additive (CREATE TABLE / CREATE INDEX).
--   - No drops, no renames, no changes to existing tables.
--   - Idempotent (IF NOT EXISTS guards).
-- ============================================================================


-- 1. accountant_invitations ---------------------------------------------------
-- Eén rij per uitnodiging die een boekhouder verstuurt. Status loopt van
-- pending → accepted | declined | expired | revoked. expires_at = now+14d.
-- invite_token is een random secret dat in de email-link zit; uniek + indexed.
-- accepted_by_user_id is gevuld zodra de klant accepteert (FK naar auth.users).
CREATE TABLE IF NOT EXISTS public.accountant_invitations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accountant_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Uitnodiging-data
  invite_email         text NOT NULL,                 -- altijd lowercased aan server-zijde
  invite_token         text NOT NULL UNIQUE,          -- random secret (URL-safe)
  message              text,                          -- optioneel persoonlijk bericht boekhouder

  -- Lifecycle
  status               text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','accepted','declined','expired','revoked')),
  expires_at           timestamptz NOT NULL,          -- now() + interval '14 days'

  -- Audit / accept-trail
  accepted_at          timestamptz,
  accepted_by_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  declined_at          timestamptz,
  revoked_at           timestamptz,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Lookup-index: edge function zoekt o.b.v. token bij accept/decline.
CREATE UNIQUE INDEX IF NOT EXISTS idx_accountant_invitations_token
  ON public.accountant_invitations(invite_token);

-- Rate-limit-index: count(invites door deze boekhouder in laatste 24u).
CREATE INDEX IF NOT EXISTS idx_accountant_invitations_accountant_created
  ON public.accountant_invitations(accountant_user_id, created_at DESC);

-- Lookup-index: klant ziet pending uitnodigingen voor zijn email.
CREATE INDEX IF NOT EXISTS idx_accountant_invitations_email_status
  ON public.accountant_invitations(invite_email, status);


-- 2. RLS ----------------------------------------------------------------------
ALTER TABLE public.accountant_invitations ENABLE ROW LEVEL SECURITY;

-- Boekhouder ziet zijn eigen verzonden uitnodigingen (voor de pending-lijst).
DROP POLICY IF EXISTS "accountant_invitations_select_own_sent"
  ON public.accountant_invitations;
CREATE POLICY "accountant_invitations_select_own_sent"
  ON public.accountant_invitations
  FOR SELECT USING (auth.uid() = accountant_user_id);

-- Klant ziet uitnodigingen gericht aan zijn email (om badge/notificatie te tonen).
-- Match op auth.users.email zodat we niet hoeven te vertrouwen op de
-- ingevulde profiles.email.
DROP POLICY IF EXISTS "accountant_invitations_select_own_received"
  ON public.accountant_invitations;
CREATE POLICY "accountant_invitations_select_own_received"
  ON public.accountant_invitations
  FOR SELECT USING (
    invite_email = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- INSERT/UPDATE/DELETE gebeurt uitsluitend via service-role in edge functions
-- (invite-client, accept-invitation, decline-invitation, revoke-invitation).
-- Geen client policies daarvoor — token-generatie en status-overgangen
-- moeten server-side gevalideerd blijven.


-- 3. updated_at trigger -------------------------------------------------------
-- Hergebruikt set_updated_at() uit eerdere migration (20260429_bank_connect.sql).
-- Idempotent: CREATE OR REPLACE.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_accountant_invitations_updated_at
  ON public.accountant_invitations;
CREATE TRIGGER trg_accountant_invitations_updated_at
  BEFORE UPDATE ON public.accountant_invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
