// ============================================================================
// bankConnect.js — GoCardless Bank Account Data (ex-Nordigen) helpers
// ----------------------------------------------------------------------------
// Mirrors the shape of billing.js. Wraps the bank-link / bank-sync Edge
// Functions and keeps URL-callback parsing in one place.
// ============================================================================

import { supabase } from './supabase.js';

const BANK_CONNECT_REF_KEY = 'dynafy_bank_connect_ref';

/**
 * Feature flag — alleen Ranny's hoofdaccount ziet de UI tot we breder uitrollen.
 */
export function isBankConnectEnabled(user) {
  return user?.email === 'ranny.ampomah@hotmail.com';
}

/**
 * Lijst banken (institutions) ophalen voor land. Default NL.
 * Voor sandbox-tests wordt SANDBOXFINANCE_SFIN0000 ook teruggegeven binnen NL.
 */
export async function fetchInstitutions(country = 'NL') {
  const { data, error } = await supabase.functions.invoke('bank-link', {
    body: { action: 'list_institutions', country },
  });
  if (error) throw new Error(error.message || 'Kon banken niet ophalen');
  if (data?.error) throw new Error(data.error);
  return data?.institutions ?? [];
}

/**
 * Start de consent-flow: maak requisition, redirect naar bank.
 * Bewaart de connection_id in localStorage zodat finalize 'm op pickt na callback.
 */
export async function startBankConnect(institution) {
  const { data, error } = await supabase.functions.invoke('bank-link', {
    body: {
      action: 'create_requisition',
      institution_id: institution.id,
      institution_name: institution.name,
      institution_logo: institution.logo ?? null,
    },
  });
  if (error) throw new Error(error.message || 'Kon koppeling niet starten');
  if (data?.error) throw new Error(data.error);
  if (!data?.consent_url) throw new Error('Geen consent-URL ontvangen');

  try {
    localStorage.setItem(
      BANK_CONNECT_REF_KEY,
      JSON.stringify({ connection_id: data.connection_id, requisition_id: data.requisition_id }),
    );
  } catch { /* ignore */ }

  window.location.assign(data.consent_url);
}

/**
 * Roept de finalize-actie aan na bank-redirect. Pakt de bewaarde connection_id
 * uit localStorage; URL-param `ref` is fallback.
 */
export async function finalizeBankConnect() {
  let stored = null;
  try {
    const raw = localStorage.getItem(BANK_CONNECT_REF_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch { /* ignore */ }

  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref') ?? null;

  const body = { action: 'finalize' };
  if (stored?.connection_id) body.connection_id = stored.connection_id;
  else if (stored?.requisition_id) body.requisition_id = stored.requisition_id;
  else if (ref) body.reference = ref;
  else throw new Error('Geen actieve bank-koppeling gevonden');

  const { data, error } = await supabase.functions.invoke('bank-link', { body });
  if (error) throw new Error(error.message || 'Finalize mislukt');
  if (data?.error) throw new Error(data.error);

  try { localStorage.removeItem(BANK_CONNECT_REF_KEY); } catch { /* ignore */ }
  return data;
}

/**
 * Sync transactions voor een gekoppelde bank-rekening of hele connection.
 */
export async function syncBankConnection({ connection_id, account_id }) {
  const body = {};
  if (account_id) body.account_id = account_id;
  else if (connection_id) body.connection_id = connection_id;
  else throw new Error('Geef connection_id of account_id mee');

  const { data, error } = await supabase.functions.invoke('bank-sync', { body });
  if (error) throw new Error(error.message || 'Sync mislukt');
  if (data?.error) throw new Error(data.error);
  return data;
}

/**
 * Lees ?bank_link=callback uit URL. Returnt 'callback' | null.
 */
export function readBankCallbackFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('bank_link') === 'callback' ? 'callback' : null;
  } catch {
    return null;
  }
}

/**
 * Verwijder bank_link + ref params uit URL zonder reload.
 */
export function clearBankCallbackFromUrl() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('bank_link');
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url.toString());
  } catch { /* ignore */ }
}
