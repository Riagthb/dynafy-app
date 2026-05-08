-- ============================================================================
-- Dynafy Bank Connect — PSD2 AIS — v1
-- ============================================================================
-- Adds PSD2 bank-account linking via an AIS provider.
-- Originally designed for GoCardless BAD; migrated to Enable Banking 2026-05-08
-- after GoCardless disabled new BAD signups.
--
-- Design:
--   bank_connections: one row per consent session (per ASPSP, per user).
--     Holds 1..N bank accounts after authorization. provider_session_id is the
--     Enable Banking authorization_id / session_id (returned by POST /auth and
--     POST /sessions).
--   bank_accounts:    one row per IBAN/account exposed by the bank.
--     provider_account_id = Enable Banking account uid (UUID).
--   transactions:     gets two new nullable columns to mark rows that came
--                     from a bank-sync (so CSV/manual rows stay untouched).
--
-- Rollout safety:
--   - All operations are additive (CREATE TABLE / ADD COLUMN ... NULL).
--   - No drops, no NOT NULL on existing rows in transactions.
--   - Idempotent (IF NOT EXISTS guards).
-- ============================================================================


-- 1. bank_connections ---------------------------------------------------------
-- Eén rij per consent-sessie met de bank. Enable Banking noemt dit een
-- "authorization" (start) → "session" (na exchange code). Levensduur tot
-- maximum_consent_validity (Enable Banking: tot 180 dagen waar bank ondersteunt;
-- in praktijk 90 default voor NL banken). Daarna her-consent.
CREATE TABLE IF NOT EXISTS public.bank_connections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ASPSP / institution identifiers
  -- Enable Banking identificeert banken via (name, country) tuple — geen ID.
  -- We bewaren beide voor latere lookups; institution_id is een combinatie-key
  -- "${aspsp_name}_${aspsp_country}" voor backward compat met UI/code paths.
  aspsp_name          text NOT NULL,             -- bv. "ING"
  aspsp_country       text NOT NULL DEFAULT 'NL',-- ISO-2
  institution_id      text NOT NULL,             -- "${aspsp_name}_${aspsp_country}"
  institution_name    text,                      -- human-readable bv. "ING"
  institution_logo    text,

  -- Session / consent
  provider_session_id text NOT NULL UNIQUE,      -- Enable Banking authorization_id (later: session_id)
  reference           text,                      -- our debug-friendly tag
  auth_state          text,                      -- random UUID; valideren in callback

  -- Lifecycle
  -- Status codes (provider-agnostic):
  --   PENDING    = consent_url uitgegeven, wachten op user
  --   AUTHORIZED = sessie actief, accounts beschikbaar
  --   EXPIRED    = consent verlopen
  --   REVOKED    = user heeft toestemming ingetrokken
  --   ERROR      = callback gaf error of finalize faalde
  status              text NOT NULL DEFAULT 'PENDING',
  consent_url         text,
  expires_at          timestamptz,
  last_synced_at      timestamptz,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_connections_user
  ON public.bank_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_connections_state
  ON public.bank_connections(auth_state) WHERE auth_state IS NOT NULL;


-- 2. bank_accounts ------------------------------------------------------------
-- Eén rij per IBAN/account die binnen een connection valt. Eén connection
-- kan meerdere accounts opleveren (zakelijk + privé bij dezelfde bank).
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id        uuid NOT NULL REFERENCES public.bank_connections(id) ON DELETE CASCADE,

  -- Provider account identifier (Enable Banking: account uid UUID).
  provider_account_id  text NOT NULL UNIQUE,

  -- Account metadata
  iban                 text,
  name                 text,                     -- bv. "Privérekening" of bank-supplied name
  currency             text DEFAULT 'EUR',
  cash_account_type    text,                     -- bv. "CACC" (Enable Banking)
  balance_cents        bigint,                   -- meest recente bekende balance (booked)
  balance_synced_at    timestamptz,

  -- Link naar bestaande client-side "accounts" array (localStorage id).
  -- Wanneer NULL: dit is een nieuwe bank-only account.
  -- Wanneer gevuld: gebruiker heeft hem aan een handmatige account gelinkt
  -- zodat historische CSV-data zich onder dezelfde account-id verzamelt.
  client_account_id    text,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user
  ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_connection
  ON public.bank_accounts(connection_id);


-- 3. transactions: extra kolommen voor bank-sync ------------------------------
-- bank_transaction_id: provider-stabiele transactie-id (Enable Banking:
--   "transaction_id"; GoCardless: "transactionId"/"internalTransactionId").
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
-- Geen client policies daarvoor — dat houdt sessions/keys veilig.


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
