import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";
import { SPRING_SNAPPY } from "../lib/motion";

const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [role="button"], [data-cursor-interactive]';

// Decorative dot cursor that lags the real pointer with a spring and grows
// over clickable elements. Desktop-only by construction: skipped entirely
// on touch/coarse-pointer devices (where there is no hover concept) and on
// prefers-reduced-motion, where it would just be motion for no reason.
export function CustomCursor() {
  const reducedMotion = usePrefersReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, SPRING_SNAPPY);
  const springY = useSpring(y, SPRING_SNAPPY);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setEnabled(mq.matches && !reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    if (!enabled) {
      document.body.classList.remove("custom-cursor-active");
      return;
    }
    document.body.classList.add("custom-cursor-active");

    function onMove(e: PointerEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as Element | null;
      setHovering(!!target?.closest(INTERACTIVE_SELECTOR));
    }
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.body.classList.remove("custom-cursor-active");
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[999] -ml-2 -mt-2 h-4 w-4 rounded-full bg-magenta/70 mix-blend-difference"
      style={{ x: springX, y: springY }}
      animate={{ scale: hovering ? 2.4 : 1 }}
      transition={SPRING_SNAPPY}
    />
  );
}
