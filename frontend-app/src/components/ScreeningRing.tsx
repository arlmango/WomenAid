import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

// Radial screening timeline: a ring of dots around the status icon. Dots up
// to `progress` (0..1) are filled with the brand gradient; the rest are the
// dark track outline. Each filled dot animates in one-by-one on first load
// (staggered scale+fade) instead of a static pre-rendered SVG.
const DOT_COUNT = 28;

export function ScreeningRing({
  progress,
  Icon,
  iconClassName,
  headline,
  statusLabel,
  sub,
}: {
  progress: number;
  Icon: LucideIcon;
  iconClassName: string;
  headline: string;
  statusLabel: string;
  sub: string;
}) {
  const size = 220;
  const radius = (size - 24) / 2;
  const center = size / 2;
  const clamped = Math.max(0, Math.min(1, progress));
  const filledCount = Math.round(clamped * DOT_COUNT);

  const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
    const angle = (i / DOT_COUNT) * Math.PI * 2 - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y, filled: i < filledCount };
  });

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        {dots.map((dot, i) => (
          <motion.circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={dot.filled ? 5 : 3.5}
            fill={dot.filled ? "url(#ring-gradient)" : "var(--color-line)"}
            opacity={dot.filled ? 1 : 0.25}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: dot.filled ? 1 : 0.25 }}
            transition={{ delay: i * 0.018, type: "spring", stiffness: 320, damping: 18 }}
          />
        ))}
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#0b6e63" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 18 }}
          className={`mb-1 grid h-10 w-10 place-items-center rounded-full ${iconClassName}`}
        >
          <Icon size={20} strokeWidth={2.25} />
        </motion.span>
        <p className="font-serif text-base leading-tight text-navy">{headline}</p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{statusLabel}</p>
        <p className="mt-1 text-xs text-ink-soft">{sub}</p>
      </div>
    </div>
  );
}
