-- ============================================================================
-- Admin bypass voor subscriptions + billing_invoices SELECT policies
-- ============================================================================
-- De originele policies (zie 20260417_mollie_billing.sql) staan alleen toe
-- dat een user zijn eigen subscription/invoices kan lezen. Dat klopt voor
-- gewone users, maar admins moeten in het admin-panel de billing-status
-- van álle Diamond-klanten kunnen zien om te weten wie attention nodig heeft
-- (past_due, expired, etc).
--
-- We breiden de SELECT-policies uit zodat ook profiles.is_admin = true mag.
-- INSERT/UPDATE blijven zoals ze waren (geen client policies = service-role
-- only via webhooks).
--
-- Rollout safety:
--   - Idempotent: DROP POLICY IF EXISTS + CREATE POLICY
--   - Geen schema-wijzigingen, alleen RLS aanpassing
--   - Geen impact op write-paden
-- ============================================================================


-- 1. subscriptions: admin mag alle rijen zien
DROP POLICY IF EXISTS "users_select_own_subscription" ON public.subscriptions;
CREATE POLICY "users_select_own_subscription"
  ON public.subscriptions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );


-- 2. billing_invoices: idem (zodat het user-data panel ze later ook kan tonen)
DROP POLICY IF EXISTS "users_select_own_invoices" ON public.billing_invoices;
CREATE POLICY "users_select_own_invoices"
  ON public.billing_invoices FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
