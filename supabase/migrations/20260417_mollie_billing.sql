-- ============================================================================
-- Dynafy Mollie billing schema — v1 (ZZP Diamond, maand-only)
-- ============================================================================
-- Run this in Supabase SQL editor (SQL Editor → New query → paste → Run).
-- Idempotent: re-running is safe (IF NOT EXISTS guards).
--
-- Tables:
--   subscriptions: één actieve sub per user; koppelt Mollie customer+subscription
--   invoices: sequentieel genummerde NL-compliant facturen
--
-- Assumes existing profiles.plan column (text) with values:
--   'normal' | 'premium' | 'zzp_premium' | 'zzp_diamond'
-- ============================================================================


-- 1. Invoice number sequence (NL belastingdienst: moet sequentieel zijn)
-- Start op 2026001 zodat nummers herkenbaar zijn per jaar (2026xxx).
-- Per 1 jan aanpassen naar 2027001 (handmatig, via nieuwe migratie).
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq
  START WITH 2026001
  INCREMENT BY 1
  MINVALUE 1
  NO MAXVALUE
  CACHE 1;


-- 2. Subscriptions tabel
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tier + interval
  tier                    text NOT NULL CHECK (tier IN ('premium','zzp_premium','zzp_diamond')),
  billing_interval        text NOT NULL CHECK (billing_interval IN ('month','year')),
  amount_cents            integer NOT NULL CHECK (amount_cents > 0),
  currency                text NOT NULL DEFAULT 'EUR',

  -- Mollie identifiers
  mollie_customer_id      text,
  mollie_subscription_id  text,
  mollie_mandate_id       text,

  -- Lifecycle
  status                  text NOT NULL CHECK (status IN (
    'pending',      -- checkout aangemaakt, wacht op eerste betaling
    'active',       -- eerste betaling gelukt + subscription actief
    'past_due',     -- betaling mislukt, retry fase
    'cancelled',    -- user heeft opgezegd, nog toegang tot current_period_end
    'expired',      -- toegang is voorbij
    'failed'        -- eerste betaling mislukt, nooit actief geworden
  )),
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancelled_at            timestamptz,

  -- Audit
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  -- Eén rij per (user, tier) combinatie — prevent duplicate active subs per tier
  UNIQUE (user_id, tier)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mollie_customer
  ON public.subscriptions(mollie_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mollie_subscription
  ON public.subscriptions(mollie_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);


-- 3. Invoices tabel (eigen facturen — NIET de ZZP-klantfacturen uit FacturenView)
-- Naamgeving: billing_invoices om conflict met bestaande invoices flow in app te vermijden.
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  subscription_id         uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,

  -- NL-compliant factuurnummer (sequentieel, uniek, onverwijderbaar)
  invoice_number          text NOT NULL UNIQUE DEFAULT (
    'DYN-' || to_char(nextval('public.invoice_number_seq'), 'FM0000000')
  ),

  -- Bedragen in centen (vermijd float rounding)
  subtotal_cents          integer NOT NULL,
  vat_cents               integer NOT NULL DEFAULT 0,
  vat_rate                numeric(5,2) NOT NULL DEFAULT 21.00,
  total_cents             integer NOT NULL,
  currency                text NOT NULL DEFAULT 'EUR',

  -- Referentie naar Mollie betaling
  mollie_payment_id       text UNIQUE,

  -- Status
  status                  text NOT NULL CHECK (status IN (
    'draft',
    'pending',
    'paid',
    'failed',
    'refunded'
  )),

  -- PDF
  pdf_storage_path        text,

  -- Periode dekking (voor subscription invoices)
  period_start            timestamptz,
  period_end              timestamptz,

  -- Audit
  issued_at               timestamptz NOT NULL DEFAULT now(),
  paid_at                 timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_user_id
  ON public.billing_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_subscription_id
  ON public.billing_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_mollie_payment
  ON public.billing_invoices(mollie_payment_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status
  ON public.billing_invoices(status);


-- 4. updated_at trigger (reusable)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_billing_invoices_updated_at ON public.billing_invoices;
CREATE TRIGGER trg_billing_invoices_updated_at
  BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- 5. Row Level Security
ALTER TABLE public.subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices   ENABLE ROW LEVEL SECURITY;

-- Users kunnen alleen eigen subscription/invoices lezen
DROP POLICY IF EXISTS "users_select_own_subscription" ON public.subscriptions;
CREATE POLICY "users_select_own_subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_select_own_invoices" ON public.billing_invoices;
CREATE POLICY "users_select_own_invoices"
  ON public.billing_invoices FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE gaan alleen via service_role key (Edge Functions / webhook).
-- Geen RLS policy = gewoon geweigerd voor authenticated/anon rollen. Prima.


-- 6. Grants (read-only voor authenticated; writes via service_role in Edge Functions)
GRANT SELECT ON public.subscriptions    TO authenticated;
GRANT SELECT ON public.billing_invoices TO authenticated;


-- ============================================================================
-- DONE.
--
-- Verify with:
--   SELECT * FROM public.subscriptions LIMIT 1;
--   SELECT * FROM public.billing_invoices LIMIT 1;
--   SELECT nextval('public.invoice_number_seq'); -- dan setval terug naar 2026001!
--
-- Belangrijk: NIET nextval() handmatig aanroepen buiten een invoice insert.
-- Anders ontstaat er een gat in de nummering (NL belasting = probleem).
-- ============================================================================
