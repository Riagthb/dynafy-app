// ─── HOOKS ────────────────────────────────────────────────────
// Geëxtraheerd uit App.jsx tijdens Fase-1 refactor (2026-05-27).
// Pure React hooks zonder app-specifieke dependencies.

import { useState, useEffect, useRef } from "react";

// useIsMobile: reactief op viewport <=640px. Gebruikt matchMedia
// listener zodat resize (desktop devtools, rotatie) live update.
export function useIsMobile(maxWidth = 640) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(`(max-width: ${maxWidth}px)`).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const handler = e => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [maxWidth]);
  return isMobile;
}

// useCountUp: ease-out animatie van 0 naar target over duration ms.
// Gebruikt voor StatCard / BalanceStatCard nummer-animaties.
export function useCountUp(target, duration = 900) {
  const [current, setCurrent] = useState(0);
  const startRef = useRef(0);
  const rafRef   = useRef(null);
  useEffect(() => {
    if (target == null || isNaN(target)) return;
    const from = startRef.current;
    const diff = target - from;
    if (Math.abs(diff) < 0.001) { setCurrent(target); return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);          // ease-out cubic
      setCurrent(from + diff * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else { startRef.current = target; setCurrent(target); }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return current;
}
