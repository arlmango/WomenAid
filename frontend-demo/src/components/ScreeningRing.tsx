import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

// Radial screening timeline: an animated progress arc around a ring, with the
// status icon + label + headline in the center. `progress` is 0..1 (how far
// through the screening cycle the patient is; 1 = due/overdue).
export function ScreeningRing({
  progress,
  accent,
  Icon,
  statusLabel,
  headline,
  sub,
}: {
  progress: number;
  accent: string;
  Icon: LucideIcon;
  statusLabel: string;
  headline: string;
  sub: string;
}) {
  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - clamped * c }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 18 }}
          className="mb-1 grid h-10 w-10 place-items-center rounded-full"
          style={{ backgroundColor: "color-mix(in srgb, " + accent + " 18%, white)", color: accent }}
        >
          <Icon size={20} strokeWidth={2.25} />
        </motion.span>
        <p className="font-serif text-lg leading-tight text-ink">{headline}</p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          {statusLabel}
        </p>
        <p className="mt-1 text-xs text-ink-soft">{sub}</p>
      </div>
    </div>
  );
}
