// ─── SKELETON LOADERS ──────────────────────────────────────────
// Geëxtraheerd uit App.jsx tijdens Fase-1 refactor (2026-05-27).
// `card` style import komt uit theme.js zodat SkeletonCard dezelfde
// container-styling hergebruikt als echte stat-cards.

import { card } from '../../lib/theme.js';

export function Skeleton({ width = "100%", height = 14, radius = 6, style: s = {} }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, flexShrink: 0, ...s }} />;
}

export function SkeletonCard({ isDark }) {
  return (
    <div style={{ ...card(isDark), flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          <Skeleton width={80} height={10} radius={4}/>
          <Skeleton width="70%" height={28} radius={6}/>
          <Skeleton width={60} height={10} radius={4}/>
        </div>
        <Skeleton width={40} height={40} radius={12} style={{ flexShrink: 0 }}/>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
        <Skeleton width={30} height={30} radius={8} style={{ flexShrink: 0 }}/>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton width="55%" height={11} radius={4}/>
          <Skeleton width="35%" height={9} radius={4}/>
        </div>
      </div>
      <Skeleton width={70} height={13} radius={4} style={{ flexShrink: 0 }}/>
    </div>
  );
}
