-- ============================================================================
-- Dynafy Bank Connect — GoCardless Bank Account Data (ex-Nordigen) — v1
-- ============================================================================
-- Adds PSD2 bank-account linking via GoCardless BAD API.
--
-- Design:
--   bank_connections: one row per requisition (= per consent, per institution).
--     A connection can hold 1..N bank accounts after the user consents.
--   bank_accounts:    one row per IBAN/account exposed by the bank.
--   transactions:     gets two new nullable columns to mark rows that came
--                     from a bank-sync (so CSV/manual rows stay untouched).
--
-- Rollout safety:
--   - All operations are additive (CREATE TABLE / ADD COLUMN ... NULL).
--   - No drops, no renames, no NOT NULL on existing rows.
--   - Idempotent (IF NOT EXISTS guards).
-- ============================================================================


-- 1. bank_connections ---------------------------------------------------------
-- Eén rij per consent-flow met de bank. Nordigen/GoCardless noemt dit een
-- "requisition". Levensduur: 90 dagen na CR (Created → Linked), daarna moet
-- de gebruiker opnieuw consent geven. We bewaren de requisition_id zodat we
-- accounts kunnen ophalen, en expires_at om de UI te waarschuwen.
CREATE TABLE IF NOT EXISTS public.bank_connections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- GoCardless identifiers
  institution_id    text NOT NULL,             -- bv. ING_INGBNL2A, RABOBANK_RABONL2U, SANDBOXFINANCE_SFIN0000
  institution_name  text,                      -- human-readable bv. "ING"
  institution_logo  text,                      -- optional logo URL
  requisition_id    text NOT NULL UNIQUE,      -- GoCardless requisition UUID
  reference         text,                      -- our own reference passed to GoCardless

  -- Lifecycle
  status            text NOT NULL DEFAULT 'CR' -- CR | GA | UA | RJ | SA | GC | LN | EX
                    CHECK (status IN ('CR','GA','UA','RJ','SA','GC','LN','EX')),
  consent_url       text,                      -- bank-redirect URL (alleen tot LN)
  expires_at        timestamptz,               -- 90 dagen na linked
  last_synced_at    timestamptz,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_connections_user
  ON public.bank_connections(user_id);


-- 2. bank_accounts ------------------------------------------------------------
-- Eén rij per IBAN/account die binnen een connection valt. Eén connection
-- kan meerdere accounts opleveren (zakelijk + privé bij dezelfde bank).
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id    uuid NOT NULL REFERENCES public.bank_connections(id) ON DELETE CASCADE,

  -- GoCardless account identifier (UUID in their system)
  gc_account_id     text NOT NULL UNIQUE,

  -- Account metadata
  iban              text,
  name              text,                      -- bv. "Privérekening" of bank-supplied name
  currency          text DEFAULT 'EUR',
  balance_cents     bigint,                    -- meest recente bekende balance (booked)
  balance_synced_at timestamptz,

  -- Link naar bestaande client-side "accounts" array (localStorage id).
  -- Wanneer NULL: dit is een nieuwe bank-only account.
  -- Wanneer gevuld: gebruiker heeft hem aan een handmatige account gelinkt
  -- zodat historische CSV-data zich onder dezelfde account-id verzamelt.
  client_account_id text,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user
  ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_connection
  ON public.bank_accounts(connection_id);


-- 3. transactions: extra kolommen voor bank-sync ------------------------------
-- bank_transaction_id: GoCardless levert per transactie een stabiel
--   transactionId/internalTransactionId — gebruik die voor dedupe.
-- bank_account_id:     wijst naar bank_accounts.id voor traceability.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS bank_transaction_id text;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

-- Dedupe-index: same user mag dezelfde bank-tx niet twee keer hebben.
-- Partial index: alleen rijen die uit een bank-sync komen tellen mee.
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_bank_tx
  ON public.transactions(user_id, bank_transaction_id)
  WHERE bank_transaction_id IS NOT NULL;


-- 4. RLS ----------------------------------------------------------------------
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts    ENABLE ROW LEVEL SECURITY;

-- Users zien alleen hun eigen rijen.
DROP POLICY IF EXISTS "bank_connections_select_own" ON public.bank_connections;
CREATE POLICY "bank_connections_select_own" ON public.bank_connections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bank_accounts_select_own" ON public.bank_accounts;
CREATE POLICY "bank_accounts_select_own" ON public.bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE gebeurt alleen via service-role in Edge Functions.
-- Geen client policies daarvoor — dat houdt requisitions/tokens veilig.


-- 5. updated_at trigger -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bank_connections_updated_at ON public.bank_connections;
CREATE TRIGGER trg_bank_connections_updated_at
  BEFORE UPDATE ON public.bank_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_bank_accounts_updated_at ON public.bank_accounts;
CREATE TRIGGER trg_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
