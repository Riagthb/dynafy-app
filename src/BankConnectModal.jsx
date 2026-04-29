// ============================================================================
// BankConnectModal — institution picker + start consent flow
// ----------------------------------------------------------------------------
// Toont een lijst van NL banken (incl. Sandbox voor testen). Bij klik op een
// bank wordt startBankConnect aangeroepen, wat de browser redirect naar de
// bank-consent pagina. Na consent komt de gebruiker terug op
// /?bank_link=callback&ref=... — dat handelt App.jsx af via finalizeBankConnect.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { fetchInstitutions, startBankConnect } from './bankConnect.js';

export default function BankConnectModal({ onClose, isDark = true, lang = 'nl' }) {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState(null); // institution.id while redirecting

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchInstitutions('NL');
        if (cancelled) return;
        setInstitutions(list);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Kon banken niet laden');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return institutions;
    return institutions.filter(i => i.name.toLowerCase().includes(q));
  }, [institutions, search]);

  const handlePick = async (inst) => {
    setError('');
    setConnecting(inst.id);
    try {
      await startBankConnect(inst);
      // startBankConnect redirects — we komen hier alleen op error
    } catch (e) {
      setError(e.message || 'Koppelen mislukt');
      setConnecting(null);
    }
  };

  const C = isDark ? {
    bg: '#0b0f1a', card: '#111827', border: 'rgba(255,255,255,0.08)',
    text: '#f3f4f6', muted: '#9ca3af', rowBg: 'rgba(255,255,255,0.04)',
    rowHover: 'rgba(79,142,247,0.08)', input: 'rgba(255,255,255,0.05)',
  } : {
    bg: '#f9fafb', card: '#ffffff', border: '#e5e7eb',
    text: '#111827', muted: '#6b7280', rowBg: '#f9fafb',
    rowHover: '#eff6ff', input: '#ffffff',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card, color: C.text, borderRadius: 16,
          border: `1px solid ${C.border}`, width: '100%', maxWidth: 480,
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 22px 12px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            {lang === 'nl' ? 'Bank koppelen' : 'Connect bank'}
          </div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
            {lang === 'nl'
              ? 'Kies je bank. Je wordt doorgestuurd naar je bank om toestemming te geven (PSD2). Read-only — Dynafy kan niet betalen of overschrijven.'
              : 'Pick your bank. You will be redirected to authorize (PSD2). Read-only — Dynafy cannot move money.'}
          </div>
        </div>

        <div style={{ padding: '12px 22px', borderBottom: `1px solid ${C.border}` }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'nl' ? 'Zoek bank…' : 'Search bank…'}
            autoFocus
            style={{
              width: '100%', padding: '10px 12px', background: C.input,
              border: `1px solid ${C.border}`, borderRadius: 10, color: C.text,
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {loading && (
            <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontSize: 13 }}>
              {lang === 'nl' ? 'Banken laden…' : 'Loading banks…'}
            </div>
          )}
          {!loading && error && (
            <div style={{ padding: 16, color: '#f87171', fontSize: 13, lineHeight: 1.5 }}>
              {error}
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: C.muted, fontSize: 13 }}>
              {lang === 'nl' ? 'Geen banken gevonden' : 'No banks found'}
            </div>
          )}
          {!loading && !error && filtered.map((inst) => (
            <button
              key={inst.id}
              onClick={() => handlePick(inst)}
              disabled={connecting !== null}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', background: 'transparent',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                color: C.text, textAlign: 'left',
                opacity: connecting !== null && connecting !== inst.id ? 0.4 : 1,
              }}
              onMouseEnter={(e) => { if (connecting === null) e.currentTarget.style.background = C.rowHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: C.rowBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
              }}>
                {inst.logo
                  ? <img src={inst.logo} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                  : <span style={{ fontSize: 16 }}>🏦</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{inst.name}</div>
                {inst.bic && (
                  <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>
                    {inst.bic}
                  </div>
                )}
              </div>
              {connecting === inst.id && (
                <div style={{ fontSize: 11, color: '#4f8ef7' }}>
                  {lang === 'nl' ? 'Doorsturen…' : 'Redirecting…'}
                </div>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 22px', borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={onClose}
            disabled={connecting !== null}
            style={{
              width: '100%', padding: '10px 0', background: 'transparent',
              border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted,
              fontSize: 13, cursor: connecting === null ? 'pointer' : 'not-allowed',
            }}
          >
            {lang === 'nl' ? 'Annuleren' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
