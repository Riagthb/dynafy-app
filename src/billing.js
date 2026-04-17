// ============================================================================
// billing.js — Mollie checkout helpers (v1: ZZP Diamond maand-only)
// ----------------------------------------------------------------------------
// Called by the upgrade flow in App.jsx. Invokes the Supabase Edge Function
// `mollie-create-checkout`, which returns a hosted Mollie checkout URL.
// ============================================================================

import { supabase } from './supabase.js';

/**
 * Kick off an upgrade purchase. Redirects the browser to Mollie's hosted
 * checkout. Throws on unexpected errors; caller should surface a message.
 *
 * @returns {Promise<void>} resolves after window.location.assign is called
 */
export async function startUpgradeCheckout() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Je bent niet ingelogd. Log opnieuw in om te upgraden.');
  }

  const { data, error } = await supabase.functions.invoke('mollie-create-checkout', {
    body: {},
  });

  if (error) {
    console.error('[billing] create-checkout error', error);
    throw new Error('Kon upgrade niet starten: ' + (error.message || 'onbekende fout'));
  }
  if (data?.error) {
    if (data.error === 'already_active') {
      throw new Error('Je hebt dit abonnement al actief.');
    }
    console.error('[billing] create-checkout returned error', data);
    throw new Error('Upgrade mislukt: ' + data.error);
  }
  if (!data?.checkoutUrl) {
    throw new Error('Upgrade mislukt: geen checkout URL ontvangen.');
  }

  // Redirect to Mollie hosted checkout. After payment, Mollie redirects back
  // to app.dynafy.nl/?billing=success.
  window.location.assign(data.checkoutUrl);
}

/**
 * Read the ?billing=... query param on page load.
 * Returns 'success' | 'cancelled' | null.
 */
export function readBillingStatusFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('billing');
    if (v === 'success' || v === 'cancelled') return v;
    return null;
  } catch {
    return null;
  }
}

/**
 * Remove ?billing=... from the URL without reloading, so the banner
 * doesn't reappear on refresh.
 */
export function clearBillingStatusFromUrl() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('billing');
    window.history.replaceState({}, '', url.toString());
  } catch { /* ignore */ }
}
