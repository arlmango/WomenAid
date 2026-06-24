import { motion } from "framer-motion";
import { AlertTriangle, Clock, ImageOff, Info, type LucideIcon } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { SPRING_SOFT } from "../lib/motion";
import type { UploadResult } from "../types/api";

// Purely presentational mapping for the fixed TRIAGE_LABELS enum (see
// backend/app/models/risk_assessment.py) — chooses an icon/gradient ring,
// never changes or infers meaning beyond the label the backend already
// sent. patient_facing_message/disclaimer text is rendered verbatim.
const TRIAGE_VISUALS: Record<string, { Icon: LucideIcon; ring: string; chip: string }> = {
  URGENT_REVIEW: {
    Icon: AlertTriangle,
    ring: "from-urgent to-rose-deep",
    chip: "bg-gradient-to-br from-urgent to-rose-deep text-white",
  },
  PRIORITY_REVIEW: { Icon: AlertTriangle, ring: "from-lavender to-lavender-deep", chip: "bg-lavender text-white" },
  ROUTINE_FOLLOWUP: { Icon: Info, ring: "from-rose to-rose-pale", chip: "bg-rose-bg text-rose-deep" },
  PENDING_REVIEW: { Icon: Clock, ring: "from-peach to-gold", chip: "bg-peach-bg text-peach-deep" },
  INSUFFICIENT_QUALITY: { Icon: ImageOff, ring: "from-ink-muted to-ink-soft", chip: "bg-surface-3 text-ink-soft" },
};
const DEFAULT_TRIAGE_VISUAL = { Icon: Clock, ring: "from-ink-muted to-ink-soft", chip: "bg-surface-3 text-ink-soft" };

export function TriageMessageCard({ result }: { result: UploadResult }) {
  const { t } = useLanguage();
  const visual = TRIAGE_VISUALS[result.triage_label] ?? DEFAULT_TRIAGE_VISUAL;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SOFT}
      className={`rounded-card bg-gradient-to-br p-[1.5px] ${visual.ring}`}
    >
      <div className="glass-card space-y-3 rounded-card p-4">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 flex-none place-items-center rounded-full shadow-soft ${visual.chip}`}>
            <visual.Icon size={20} strokeWidth={2.25} />
          </span>
          <div>
            <h2 className="font-serif text-lg text-navy">{t("uploadResultTitle")}</h2>
            <span className="inline-flex items-center rounded-full border-[1.5px] border-line bg-white/70 px-2.5 py-0.5 font-mono text-xs font-medium text-rose-deep">
              {result.triage_label}
            </span>
          </div>
        </div>
        <div className="rounded-input border-l-3 border-rose-pale bg-surface-2/80 p-3 text-sm text-ink">
          {result.patient_facing_message}
        </div>
        <p className="text-xs leading-relaxed text-ink-soft">{result.disclaimer}</p>
      </div>
    </motion.div>
  );
}
