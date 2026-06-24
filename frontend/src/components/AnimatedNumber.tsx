import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  className?: string;
}

// Counts up from 0 to `value` once it scrolls into view. Falls back to a
// static render under prefers-reduced-motion.
export function AnimatedNumber({ value, suffix = "", className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reducedMotion = usePrefersReducedMotion();

  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 80, damping: 20 });
  const rounded = useTransform(spring, (v) => Math.round(v).toLocaleString("ru-RU"));

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  if (reducedMotion) {
    return (
      <span ref={ref} className={className}>
        {value.toLocaleString("ru-RU")}
        {suffix}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
