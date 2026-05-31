// ─── DYNAFY LOGO — Wave 4A ─────────────────────────────────────
// Geëxtraheerd uit App.jsx tijdens Fase-1 refactor (2026-05-27).
// SVG met unique gradient-ids per instance om botsing tussen meerdere
// gerenderde logo's te voorkomen.

import { useRef } from 'react';

export function DynafyLogo({ size = 32 }) {
  // Stable unique ID per instance to avoid SVG gradient conflicts
  const uid = useRef(Math.random().toString(36).slice(2, 7)).current;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" style={{ flexShrink: 0 }}>
      <rect width="44" height="44" rx={Math.round(size * 0.27)} fill="#070c1a"/>
      <defs>
        <linearGradient id={`wl-${uid}`} x1="5" y1="0" x2="39" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#4f8ef7"/>
          <stop offset="60%"  stopColor="#a855f7"/>
          <stop offset="100%" stopColor="#ec4899"/>
        </linearGradient>
        <linearGradient id={`wf-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#a855f7" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d="M5,30 C10,30 10,18 16,18 C22,18 22,26 27,24 C32,22 34,15 39,14 L39,36 L5,36 Z"
        fill={`url(#wf-${uid})`}/>
      {/* Wave line */}
      <path d="M5,30 C10,30 10,18 16,18 C22,18 22,26 27,24 C32,22 34,15 39,14"
        fill="none" stroke={`url(#wl-${uid})`} strokeWidth="2.5" strokeLinecap="round"/>
      {/* Peak dot */}
      <circle cx="39" cy="14" r="3"   fill="#a855f7"/>
      <circle cx="39" cy="14" r="5.5" fill="#a855f7" opacity="0.15"/>
    </svg>
  );
}
