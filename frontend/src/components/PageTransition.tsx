import { type ReactNode } from "react";
import { motion } from "framer-motion";

// Mobile (patient) gets a stronger horizontal slide to feel app-like; desktop
// (clinic) gets a subtler fade — passed in by the layout that renders this.
const VARIANTS = {
  mobile: {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  },
  desktop: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
};

export function PageTransition({
  children,
  variant = "desktop",
}: {
  children: ReactNode;
  variant?: "mobile" | "desktop";
}) {
  const v = VARIANTS[variant];
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
