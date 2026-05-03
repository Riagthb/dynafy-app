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
