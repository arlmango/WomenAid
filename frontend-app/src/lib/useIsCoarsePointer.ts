// Coarse pointer (touch) + narrow viewport is our proxy for "likely a phone,
// keep the 3D scene cheap (or skip it)". Not a precise GPU-tier check, but
// good enough to bias toward the simpler path without a perf-measurement lib.
import { useEffect, useState } from "react";

export function useIsCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(
    () => window.matchMedia("(pointer: coarse), (max-width: 640px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse), (max-width: 640px)");
    const handler = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return coarse;
}
