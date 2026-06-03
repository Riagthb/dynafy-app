// ─── DESIGN TOKENS ─────────────────────────────────────────────
// Geëxtraheerd uit App.jsx tijdens Fase-1 refactor (2026-05-27).
// 110+ usages in App.jsx blijven werken via import.

// Border-radius scale
export const R = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };

// Spacing scale
export const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32 };

// Dark mode elevation layers
export const DK = {
  L0:  "#050b15",   // page — deepest layer
  L1:  "#0b1628",   // card surface — floats above page
  L2:  "#0f1e36",   // elevated card / nested panel
  L3:  "#142746",   // modal / highest elevation
  b0:  "rgba(255,255,255,0.06)",  // border on page
  b1:  "rgba(255,255,255,0.08)",  // border on L1 cards
  b2:  "rgba(255,255,255,0.10)",  // border on L2 elevated
};

// Theme-aware card style — returnt complete style-object voor inline gebruik
export const card = (isDark) => ({
  background: isDark ? DK.L1 : "#ffffff",
  border: `1px solid ${isDark ? DK.b1 : "#e8ecf1"}`,
  borderRadius: R.lg,
  padding: `${SP.xl}px ${SP.xxl - 8}px`,
  boxShadow: isDark
    ? `0 1px 0 rgba(255,255,255,0.05) inset, 0 4px 24px rgba(0,0,0,0.4)`
    : "0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.07)",
  transition: "transform 0.18s ease, box-shadow 0.18s ease",
});
