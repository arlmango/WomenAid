import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "navy" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  // FemTech CTA — the brand's magenta→pink gradient.
  primary:
    "bg-gradient-to-r from-magenta to-pink text-white shadow-btn hover:shadow-btn-hover disabled:opacity-50 disabled:shadow-none",
  // Serious/clinic actions — solid deep indigo.
  navy: "bg-navy text-white hover:bg-indigo disabled:opacity-50",
  // Strict MedTech — thin deep-blue outline on white.
  outline: "border border-navy bg-surface text-navy hover:bg-surface-2 disabled:opacity-50",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-3/60 disabled:text-ink-muted",
  // Same red as the URGENT triage status, for consistency.
  destructive: "bg-urgent text-white shadow-btn hover:brightness-95 disabled:opacity-50 disabled:shadow-none",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 px-3.5 text-sm gap-1.5",
  md: "min-h-11 px-5 text-sm gap-2",
  lg: "min-h-12 px-7 text-base gap-2",
  icon: "h-10 w-10",
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-btn font-semibold transition-all",
        "disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={size === "lg" ? 18 : 16} aria-hidden="true" />}
      {children}
    </motion.button>
  );
});
