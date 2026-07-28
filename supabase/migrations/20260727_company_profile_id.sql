-- ============================================================================
-- Dynafy multi-company scoping — v1
-- ============================================================================
-- Voegt company_profile_id toe aan invoices + costs zodat facturen/kosten
-- per bedrijfsprofiel gescheiden kunnen worden.
--
-- Context:
--   Multi-company feature is client-side gebouwd — companyProfiles zit in
--   localStorage per user, elk profiel heeft een gegenereerd _id (string,
--   "main" voor het default profiel of een random UUID-achtige waarde voor
--   secundaire profielen). Er is dus GEEN company_profiles tabel — dit is
--   puur een string-tag voor scoping op de bestaande rijen.
--
--   De filter-code in FacturenView/KostenView leest al company_profile_id
--   sinds oplevering, maar de kolom bestond niet → alles kreeg undefined →
--   filter behandelde alles als "main" → nieuwe items van 2e/3e profiel
--   verschenen onder het eerste profiel (Ranny 2026-07-26 → 2026-07-27).
--
-- Rollout safety:
--   - Additief: ADD COLUMN ... NULL, geen constraint op bestaande rijen.
--   - Bestaande rijen blijven NULL → filter behandelt ze als "main" (huidig
--     gedrag: alles onder default profiel). Geen data-verlies.
--   - Idempotent (IF NOT EXISTS guards).
--   - Geen index — verwachte cardinaliteit per user is laag. Voeg later toe
--     als queries traag worden.
-- ============================================================================


-- 1. invoices ----------------------------------------------------------------
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS company_profile_id TEXT DEFAULT NULL;

COMMENT ON COLUMN public.invoices.company_profile_id IS
  $$Client-side profile _id ("main" default, random string voor secundaire profielen). NULL = default/main profiel. Geen foreign key — companyProfiles wordt in localStorage bewaard, niet in database.$$;


-- 2. costs -------------------------------------------------------------------
ALTER TABLE public.costs
  ADD COLUMN IF NOT EXISTS company_profile_id TEXT DEFAULT NULL;

COMMENT ON COLUMN public.costs.company_profile_id IS
  $$Client-side profile _id. Zelfde semantiek als invoices.company_profile_id.$$;


-- 3. Force PostgREST schema cache reload -------------------------------------
-- Zonder deze notify moeten we soms tot een minuut wachten voor de API de
-- nieuwe kolom kent. NOTIFY werkt direct.
NOTIFY pgrst, 'reload schema';
