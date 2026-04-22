-- ============================================================================
-- Dynafy admin audit log
-- ============================================================================
-- Logs sensitive admin actions: impersonation, plan changes, user deletion, etc.
-- Only admins can read; inserts happen via service role (edge functions).
--
-- Run in Supabase SQL editor. Idempotent (IF NOT EXISTS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id           bigserial PRIMARY KEY,
  created_at   timestamptz NOT NULL DEFAULT now(),

  actor_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email  text,

  action       text NOT NULL,  -- 'impersonate_start' | 'impersonate_end' | 'plan_change' | 'role_change' | ...

  target_id    uuid,           -- not FK: we keep log entries even if target is deleted
  target_email text,

  reason       text,
  metadata     jsonb
);

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx      ON public.audit_log (actor_id);
CREATE INDEX IF NOT EXISTS audit_log_target_idx     ON public.audit_log (target_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx     ON public.audit_log (action);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins only can select
DROP POLICY IF EXISTS "audit_log admin read" ON public.audit_log;
CREATE POLICY "audit_log admin read"
  ON public.audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

-- No client-side inserts/updates/deletes — only service role writes
DROP POLICY IF EXISTS "audit_log no client write" ON public.audit_log;
CREATE POLICY "audit_log no client write"
  ON public.audit_log
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Allow authenticated admins to log impersonate_end client-side
-- (end-event needs to work even when admin session isn't restored via edge function)
DROP POLICY IF EXISTS "audit_log admin insert end-events" ON public.audit_log;
CREATE POLICY "audit_log admin insert end-events"
  ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    action IN ('impersonate_end')
    AND actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );
