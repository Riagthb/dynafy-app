// ─── EMPTY STATE ───────────────────────────────────────────────
// Geëxtraheerd uit App.jsx tijdens Fase-1 refactor (2026-05-27).
// Custom SVG illustraties per type (transactions/goals/investments/default)
// + container met titel/subtitle/action-knop. Gebruikt overal waar een
// view nog geen data heeft.

import { Plus } from 'lucide-react';

const EMPTY_ILLUSTRATIONS = {
  transactions: (isDark) => (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      <rect x="14" y="8" width="44" height="56" rx="7" fill={isDark ? "#0f1e36" : "#e8ecf4"} stroke={isDark ? "#1e3454" : "#c8d4e8"} strokeWidth="1.5"/>
      <rect x="22" y="22" width="28" height="3" rx="1.5" fill={isDark ? "#1e3454" : "#b8c8de"}/>
      <rect x="22" y="31" width="20" height="3" rx="1.5" fill={isDark ? "#1e3454" : "#b8c8de"}/>
      <rect x="22" y="40" width="24" height="3" rx="1.5" fill={isDark ? "#1e3454" : "#b8c8de"}/>
      <circle cx="62" cy="62" r="18" fill="url(#txGrad)"/>
      <path d="M62 70v-16M55 61l7-7 7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="txGrad" x1="44" y1="44" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f8ef7"/><stop offset="1" stopColor="#6366f1"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  goals: (isDark) => (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      <circle cx="44" cy="44" r="34" fill={isDark ? "#0f1e36" : "#e8ecf4"} stroke={isDark ? "#1e3454" : "#c8d4e8"} strokeWidth="1.5"/>
      <circle cx="44" cy="44" r="24" fill="none" stroke={isDark ? "#1e3454" : "#c8d4e8"} strokeWidth="1.5"/>
      <circle cx="44" cy="44" r="13" fill="none" stroke="url(#goalGrad)" strokeWidth="2"/>
      <circle cx="44" cy="44" r="5" fill="url(#goalGrad)"/>
      <path d="M68 20L46 42" stroke="url(#arrowGrad)" strokeWidth="3" strokeLinecap="round"/>
      <path d="M68 20L60 21.5M68 20L66.5 28" stroke="url(#arrowGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="goalGrad" x1="31" y1="31" x2="57" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e"/><stop offset="1" stopColor="#16a34a"/>
        </linearGradient>
        <linearGradient id="arrowGrad" x1="68" y1="20" x2="46" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b"/><stop offset="1" stopColor="#d97706"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  investments: (isDark) => (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      <rect x="10" y="72" width="68" height="2.5" rx="1.25" fill={isDark ? "#1e3454" : "#c8d4e8"}/>
      <rect x="16" y="52" width="14" height="20" rx="4" fill={isDark ? "#1e3454" : "#d8e2f0"}/>
      <rect x="37" y="38" width="14" height="34" rx="4" fill={isDark ? "#1e3454" : "#d8e2f0"}/>
      <rect x="58" y="24" width="14" height="48" rx="4" fill="url(#invBarGrad)"/>
      <path d="M23 56L44 42L65 28" stroke="url(#invTrendGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="65" cy="26" r="7" fill="url(#invTrendGrad)"/>
      <path d="M65 29.5v-7M62 25.5l3-3 3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="invBarGrad" x1="58" y1="24" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f8ef7"/><stop offset="1" stopColor="#6366f1"/>
        </linearGradient>
        <linearGradient id="invTrendGrad" x1="23" y1="56" x2="72" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22c55e"/><stop offset="1" stopColor="#4f8ef7"/>
        </linearGradient>
      </defs>
    </svg>
  ),
  default: (isDark) => (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      <circle cx="44" cy="44" r="36" fill={isDark ? "#0f1e36" : "#e8ecf4"} stroke={isDark ? "#1e3454" : "#c8d4e8"} strokeWidth="1.5"/>
      <path d="M44 30v16M44 54v4" stroke="url(#defGrad)" strokeWidth="3.5" strokeLinecap="round"/>
      <defs>
        <linearGradient id="defGrad" x1="44" y1="28" x2="44" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f8ef7"/><stop offset="1" stopColor="#6366f1"/>
        </linearGradient>
      </defs>
    </svg>
  ),
};

export function EmptyState({ type = "default", title, subtitle, action, actionLabel, isDark }) {
  const illus = EMPTY_ILLUSTRATIONS[type] || EMPTY_ILLUSTRATIONS.default;
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "56px 24px 48px", gap: 0 }}>
      <div style={{ marginBottom: 20, opacity: 0.85, animation: "popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        {illus(isDark)}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? "#e2e8f0" : "#0f172a", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: isDark ? "#475569" : "#64748b", maxWidth: 300, lineHeight: 1.65, marginBottom: action ? 24 : 0 }}>{subtitle}</div>
      {action && (
        <button onClick={action} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", borderRadius: 99, background: "linear-gradient(135deg,#4f8ef7,#6366f1)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(79,142,247,0.35)" }}>
          <Plus size={14}/> {actionLabel}
        </button>
      )}
    </div>
  );
}
