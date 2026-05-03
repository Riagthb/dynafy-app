-- ============================================================================
-- Dynafy Transfer Pairs — interne overboekingen uitsluiten van totalen
-- ============================================================================
-- Klant-feedback: overboekingen tussen eigen rekeningen tellen nu dubbel mee
-- (uitgaande als expense + inkomende als income), wat cumulatieve totalen
-- onbruikbaar maakt voor wie veel heen-en-weer boekt.
--
-- Oplossing: transactions krijgt twee nieuwe velden:
--   is_transfer        — boolean flag, snel filterbaar in client-side aggregaties
--   transfer_pair_id   — gedeelde UUID tussen de twee zijden van één overboeking
--
-- Aggregaties (totalIncome/Expenses, monthly, dashboard, BTW) gaan filteren op
-- is_transfer = false. Display-listen tonen transfers gewoon, maar met andere
-- styling (Repeat icon + grijze kleur ipv rood/groen).
--
-- Rollout safety:
--   - Volledig additief: ADD COLUMN met DEFAULT zorgt dat bestaande rijen
--     automatisch is_transfer=false krijgen, geen lock-blocking.
--   - Geen DROPs, geen renames, geen NOT NULL op kolom zonder DEFAULT.
--   - Idempotent (IF NOT EXISTS / DO blocks).
-- ============================================================================


-- 1. Kolommen toevoegen aan transactions ------------------------------------
-- is_transfer: NOT NULL met DEFAULT false. Bestaande rijen krijgen automatisch
--   false, en client-side aggregaties hoeven niet te raden of het veld bestaat.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS is_transfer boolean NOT NULL DEFAULT false;

-- transfer_pair_id: nullable UUID. Beide zijden van een overboeking delen
--   dezelfde waarde. Geen FK want het verwijst niet naar een externe tabel —
--   het is gewoon een groep-id die de twee bij elkaar horende rijen markeert.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transfer_pair_id uuid;


-- 2. Indexes ----------------------------------------------------------------
-- Lookup: bij UI-actie 'navigeer naar tegen-tx' of 'unmark transfer' moet
-- snel de andere helft te vinden zijn. Partial index alleen op rijen die
-- daadwerkelijk een pair-id hebben — houdt 'm klein.
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_pair
  ON public.transactions(transfer_pair_id)
  WHERE transfer_pair_id IS NOT NULL;

-- Filter-index: aggregaties draaien queries als
--   SELECT ... WHERE user_id = ... AND is_transfer = false
-- We hebben al een user_id-index; combinatie is niet nodig zolang het
-- meeste filtering client-side gebeurt na een user_id select. Laat ik weg.


-- 3. Sanity-check: een overboeking-pair hoort altijd is_transfer=true te
--    hebben. We dwingen dat met een lichte CHECK constraint.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transactions_transfer_pair_consistency'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_transfer_pair_consistency
      CHECK (
        -- Mag niet: pair_id gezet maar is_transfer=false
        NOT (transfer_pair_id IS NOT NULL AND is_transfer = false)
      );
  END IF;
END $$;


-- 4. RLS — geen wijziging nodig. Bestaande policies op transactions
--    (user_id = auth.uid()) blijven gelden voor de nieuwe kolommen.
