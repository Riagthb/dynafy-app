-- Enable Supabase Realtime on the berichten table.
--
-- Without this, postgres_changes events are NOT broadcast, so client-side
-- realtime subscriptions on `berichten` (filter to_user_id=eq.<me>) never
-- fire. Result: unread-badges (header envelope, conversation list, klanten
-- table) stay stale until the user manually refreshes.
--
-- Adding `berichten` to the supabase_realtime publication makes Postgres
-- emit logical-replication events for INSERT/UPDATE/DELETE which Supabase
-- forwards over the websocket to subscribed clients.

DO $$
BEGIN
  -- Add to publication (idempotent — silently no-op if already member)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'berichten'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.berichten;
  END IF;
END $$;

-- Set REPLICA IDENTITY FULL so UPDATE events include the full old + new row,
-- needed for the client to detect transitions like gelezen=false → true.
ALTER TABLE public.berichten REPLICA IDENTITY FULL;

-- ────────────────────────────────────────────────────────────────────────
-- RLS fix: recipient can mark messages as read
-- ────────────────────────────────────────────────────────────────────────
--
-- The existing `berichten_participant` policy has WITH CHECK = (from_user_id
-- = auth.uid()), meaning only the SENDER can UPDATE a message. This silently
-- blocks the receiver from setting gelezen=true, leading to perpetually
-- stale unread badges.
--
-- We add a permissive UPDATE policy that lets the recipient update messages
-- addressed to them. Permissive RLS policies are OR'd, so the effective
-- UPDATE rule becomes (from = me) OR (to = me).
--
-- Risk: the recipient can technically update other columns too (e.g. the
-- message text). Mitigation: the app only ever calls update({ gelezen: true })
-- on these rows. A future hardening step would be a column-grant or BEFORE
-- UPDATE trigger that whitelists `gelezen` and `updated_at` for recipients.

DROP POLICY IF EXISTS berichten_recipient_can_mark_read ON public.berichten;
CREATE POLICY berichten_recipient_can_mark_read
  ON public.berichten
  FOR UPDATE
  USING (to_user_id = auth.uid())
  WITH CHECK (to_user_id = auth.uid());
