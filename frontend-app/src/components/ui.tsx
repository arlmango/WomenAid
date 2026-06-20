import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border-[1.5px] border-line bg-surface shadow-soft ${className}`}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: HTMLMotionProps<"button">) {
  return (
    <motion.button
      whileHover={props.disabled ? undefined : { scale: 1.03 }}
      whileTap={props.disabled ? undefined : { scale: 0.98 }}
      {...props}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-btn bg-gradient-to-br from-pink to-magenta px-5 font-bold uppercase tracking-wide text-white shadow-btn transition-shadow disabled:cursor-not-allowed disabled:from-pink-soft disabled:to-pink-soft disabled:shadow-none ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: HTMLMotionProps<"button">) {
  return (
    <motion.button
      whileHover={props.disabled ? undefined : { scale: 1.03 }}
      whileTap={props.disabled ? undefined : { scale: 0.98 }}
      {...props}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-btn border-2 border-navy bg-transparent px-5 text-sm font-semibold text-navy transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </motion.button>
  );
}

// Disclaimer text — deliberately a plain, instant fade (no slow entrance):
// safety text must never be the thing the user is still waiting to read.
export function Disclaimer({ text, className = "" }: { text: string; className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-ink-soft ${className}`}>{text}</p>
  );
}
