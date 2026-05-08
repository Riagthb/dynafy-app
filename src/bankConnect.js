// ============================================================================
// bankConnect.js — Enable Banking PSD2 AIS helpers
// ----------------------------------------------------------------------------
// Mirrors the shape of billing.js. Wraps the bank-link / bank-sync Edge
// Functions and keeps URL-callback parsing in one place.
//
// Provider: Enable Banking. Callback URL is path-based (`/bank-callback`)
// omdat Enable Banking geen query parameters in de geregistreerde redirect
// URL accepteert; de provider voegt zelf `?code=…&state=…` toe na consent.
// ============================================================================

import { supabase } from './supabase.js';

const BANK_CONNECT_REF_KEY = 'dynafy_bank_connect_ref';
const BANK_CALLBACK_PATH = '/bank-callback';

/**
 * Feature flag — alleen Ranny's hoofdaccount ziet de UI tot we breder uitrollen.
 */
export function isBankConnectEnabled(user) {
  return user?.email === 'ranny.ampomah@hotmail.com';
}

/**
 * Lijst banken (ASPSPs) ophalen voor land. Default NL.
 * Voor sandbox-tests retourneert Enable Banking ook fake-ASPSPs binnen NL.
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
 * Start de consent-flow: maak authorization, redirect naar bank.
 * Bewaart de connection_id in localStorage zodat finalize 'm op pickt na callback.
 */
export async function startBankConnect(institution) {
  const { data, error } = await supabase.functions.invoke('bank-link', {
    body: {
      action: 'create_requisition',
      institution_id: institution.id,
      institution_name: institution.name,
      institution_logo: institution.logo ?? null,
      country: institution.country ?? null,
    },
  });
  if (error) throw new Error(error.message || 'Kon koppeling niet starten');
  if (data?.error) throw new Error(data.error);
  if (!data?.consent_url) throw new Error('Geen consent-URL ontvangen');

  try {
    localStorage.setItem(
      BANK_CONNECT_REF_KEY,
      JSON.stringify({
        connection_id: data.connection_id,
        authorization_id: data.authorization_id,
        state: data.state,
      }),
    );
  } catch { /* ignore */ }

  window.location.assign(data.consent_url);
}

/**
 * Roept de finalize-actie aan na bank-redirect. Pakt code + state uit URL,
 * combineert met de bewaarde connection_id uit localStorage als anti-CSRF check.
 */
export async function finalizeBankConnect() {
  let stored = null;
  try {
    const raw = localStorage.getItem(BANK_CONNECT_REF_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch { /* ignore */ }

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const errParam = params.get('error');

  if (errParam) {
    const desc = params.get('error_description');
    try { localStorage.removeItem(BANK_CONNECT_REF_KEY); } catch { /* ignore */ }
    throw new Error(desc || `Bank-koppeling afgebroken: ${errParam}`);
  }

  if (!code) throw new Error('Geen autorisatie-code ontvangen');

  const body = { action: 'finalize', code };
  if (state) body.state = state;
  if (stored?.connection_id) body.connection_id = stored.connection_id;

  if (!body.connection_id && !state) {
    throw new Error('Geen actieve bank-koppeling gevonden');
  }

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
 * Detecteer of de huidige URL een bank-callback is.
 * Enable Banking redirect format: https://app.dynafy.nl/bank-callback?code=…&state=…
 *
 * Returnt 'callback' als path matcht én er een code/state/error aanwezig is.
 * Returnt null in alle andere gevallen.
 */
export function readBankCallbackFromUrl() {
  try {
    if (window.location.pathname !== BANK_CALLBACK_PATH) return null;
    const params = new URLSearchParams(window.location.search);
    if (params.has('code') || params.has('state') || params.has('error')) {
      return 'callback';
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Verwijder bank-callback querystring én navigeer terug naar `/` zonder reload,
 * zodat de SPA-state behouden blijft maar de URL "schoon" wordt.
 */
export function clearBankCallbackFromUrl() {
  try {
    window.history.replaceState({}, '', '/');
  } catch { /* ignore */ }
}
