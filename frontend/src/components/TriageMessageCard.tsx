import { motion } from "framer-motion";
import { AlertTriangle, Clock, ImageOff, Info, type LucideIcon } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { SPRING_SOFT } from "../lib/motion";
import type { UploadResult } from "../types/api";

// Purely presentational mapping for the fixed TRIAGE_LABELS enum (see
// backend/app/models/risk_assessment.py) — chooses an icon + category color,
// never changes or infers meaning beyond the label the backend already sent.
// patient_facing_message/disclaimer text is rendered verbatim.
//
// `banner` colors the leading block (the single at-a-glance category signal,
// since the card no longer has a colored ring); `iconWrap` is the icon's
// circle, tuned for contrast on light vs. saturated banners.
const TRIAGE_VISUALS: Record<
  string,
  { Icon: LucideIcon; banner: string; iconWrap: string }
> = {
  URGENT_REVIEW: {
    Icon: AlertTriangle,
    banner: "bg-gradient-to-br from-urgent to-rose-deep text-white",
    iconWrap: "bg-white/20 text-white",
  },
  PRIORITY_REVIEW: {
    Icon: AlertTriangle,
    banner: "bg-lavender text-white",
    iconWrap: "bg-white/20 text-white",
  },
  ROUTINE_FOLLOWUP: {
    Icon: Info,
    banner: "bg-rose-bg text-rose-deep",
    iconWrap: "bg-white text-rose-deep",
  },
  PENDING_REVIEW: {
    Icon: Clock,
    banner: "bg-peach-bg text-peach-deep",
    iconWrap: "bg-white text-peach-deep",
  },
  INSUFFICIENT_QUALITY: {
    Icon: ImageOff,
    banner: "bg-surface-3 text-ink-soft",
    iconWrap: "bg-white text-ink-soft",
  },
};
const DEFAULT_TRIAGE_VISUAL = {
  Icon: Clock,
  banner: "bg-surface-3 text-ink-soft",
  iconWrap: "bg-white text-ink-soft",
};

export function TriageMessageCard({ result }: { result: UploadResult }) {
  const { t } = useLanguage();
  const visual = TRIAGE_VISUALS[result.triage_label] ?? DEFAULT_TRIAGE_VISUAL;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SOFT}
      className="space-y-3 rounded-card border-[1.5px] border-line bg-surface p-4 shadow-soft"
    >
      {/* Leading category banner — large and color-saturated so the triage
          category reads instantly (URGENT especially), replacing the old
          colored card ring with a stronger, single signal. */}
      <div className={`flex items-center gap-3 rounded-input p-3.5 ${visual.banner}`}>
        <span className={`grid h-12 w-12 flex-none place-items-center rounded-full ${visual.iconWrap}`}>
          <visual.Icon size={24} strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
            {t("uploadResultTitle")}
          </p>
          <p className="font-mono text-sm font-medium">{result.triage_label}</p>
        </div>
      </div>

      <div className="rounded-input bg-surface-2 p-3 text-sm text-ink">
        {result.patient_facing_message}
      </div>
      <p className="text-xs leading-relaxed text-ink-soft">{result.disclaimer}</p>
    </motion.div>
  );
}
