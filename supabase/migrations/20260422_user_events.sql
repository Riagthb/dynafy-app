-- ============================================================================
-- Dynafy user_events — per-user activity log
-- ============================================================================
-- Registreert gebruikersacties: login, logout, signup, invoice_created,
-- invoice_sent, btw_submitted, plan_changed, kosten_added, account_connected.
-- Zichtbaar in admin user-data side panel (tab 'Activiteit').
--
-- Onderscheid met audit_log: audit_log = admin-acties (impersonate, bulk plan),
-- user_events = acties door de user zelf (of door het systeem namens hen).
--
-- Run in Supabase SQL editor. Idempotent (IF NOT EXISTS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_events (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  metadata    jsonb
);

CREATE INDEX IF NOT EXISTS user_events_user_created_idx
  ON public.user_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_events_type_idx
  ON public.user_events (event_type);

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own events
DROP POLICY IF EXISTS "user_events own read" ON public.user_events;
CREATE POLICY "user_events own read"
  ON public.user_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can read any user's events
DROP POLICY IF EXISTS "user_events admin read" ON public.user_events;
CREATE POLICY "user_events admin read"
  ON public.user_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- Users can insert only their own events — prevents spoofing other user_ids
DROP POLICY IF EXISTS "user_events own insert" ON public.user_events;
CREATE POLICY "user_events own insert"
  ON public.user_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- No updates or deletes from clients (immutable log). Service role bypasses RLS anyway.
