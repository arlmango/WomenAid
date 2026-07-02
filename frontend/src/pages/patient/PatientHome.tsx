import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, CalendarDays, ChevronRight, NotebookText, ShieldCheck, type LucideIcon } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../lib/auth";
import { useApiQuery } from "../../lib/useApiQuery";
import { ModelStatusBadge } from "../../components/ModelStatusBadge";
import { SPRING_SOFT } from "../../lib/motion";
import type { ScheduleResponse } from "../../types/api";
import type { TranslationKey } from "../../i18n/translations";

// Four independent destinations, not an ordered sequence — so no numbered
// markers (they'd imply a process that isn't there).
const CARDS: {
  to: string;
  Icon: LucideIcon;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  badge: string;
}[] = [
  {
    to: "/patient/upload",
    Icon: Camera,
    titleKey: "navUpload",
    descKey: "navUploadDesc",
    badge: "bg-rose-bg text-rose-deep",
  },
  {
    to: "/patient/symptoms",
    Icon: NotebookText,
    titleKey: "navSymptoms",
    descKey: "navSymptomsDesc",
    badge: "bg-lavender-bg text-lavender-deep",
  },
  {
    to: "/patient/schedule",
    Icon: CalendarDays,
    titleKey: "navSchedule",
    descKey: "navScheduleDesc",
    badge: "bg-peach-bg text-peach-deep",
  },
  {
    to: "/patient/consent",
    Icon: ShieldCheck,
    titleKey: "navConsent",
    descKey: "navConsentDesc",
    badge: "bg-mint-bg text-mint-deep",
  },
];

// Same status→gradient semantics as PatientSchedule: calm indigo only when
// nothing demands attention; DUE_SOON warms up; OVERDUE is unambiguously red.
// The reassuring pastel never mutes a "see a doctor" signal.
const HERO_TONES: Record<string, string> = {
  DUE_SOON: "bg-gradient-to-br from-pink to-gold",
  OVERDUE: "bg-gradient-to-br from-urgent to-rose-deep",
};
const HERO_TONE_DEFAULT = "bg-gradient-to-br from-indigo to-violet";

export function PatientHome() {
  const { t } = useLanguage();
  const { session } = useAuth();
  // Same endpoint /schedule already uses — surfacing the next screening date
  // on the home hero (soft FemTech card) without new backend surface.
  const { data: schedule } = useApiQuery<ScheduleResponse>(
    `/api/monitoring/patients/${session?.patientId}/schedule`,
    [session?.patientId],
  );

  return (
    <div className="space-y-5">
      {/* Hero: the "next screening" moment in the soft FemTech style —
          reassuring gradient, generous radius, grain. Data is a reminder
          from deterministic screening rules, never an AI verdict. */}
      <div
        className={`grain relative overflow-hidden rounded-3xl p-5 text-white shadow-soft ${
          (schedule && HERO_TONES[schedule.screening_status]) || HERO_TONE_DEFAULT
        }`}
      >
        <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 right-16 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />

        <p className="relative text-xs font-medium text-white/75">
          {t("homeGreeting")}, <span className="font-semibold text-white">{session?.username}</span>
        </p>

        {schedule?.next_due_date ? (
          <div className="relative mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">{t("scheduleNextDue")}</p>
            <p className="mt-1 font-display text-3xl font-black tracking-tight">
              {new Date(schedule.next_due_date).toLocaleDateString()}
            </p>
          </div>
        ) : schedule ? (
          <p className="relative mt-4 font-display text-xl font-extrabold">
            {t(`scheduleStatus_${schedule.screening_status}` as TranslationKey)}
          </p>
        ) : null}

        <Link
          to="/patient/schedule"
          className="relative mt-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/25"
        >
          {t("navSchedule")}
          <ChevronRight size={14} strokeWidth={2.5} />
        </Link>
      </div>

      <p className="text-xs leading-relaxed text-ink-soft">
        AI-триаж снимков шейки матки — инструмент поддержки принятия решений для медперсонала.
        Не постановка диагноза. Демо.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {CARDS.map((card, i) => (
          <motion.div
            key={card.to}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_SOFT, delay: i * 0.05 }}
            className="h-full"
          >
            <Link
              to={card.to}
              className="flex h-full flex-col gap-2.5 rounded-card border border-navy/15 bg-surface p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-soft-hover"
            >
              <div className="flex items-center justify-between">
                <span className={`grid h-9 w-9 place-items-center rounded-full ${card.badge}`}>
                  <card.Icon size={18} strokeWidth={2.25} />
                </span>
                <ChevronRight size={16} className="text-ink-muted" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{t(card.titleKey)}</p>
                <p className="mt-0.5 text-xs leading-snug text-ink-soft">{t(card.descKey)}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <ModelStatusBadge />

      <p className="border-t border-navy/10 pt-4 text-xs leading-relaxed text-ink-soft">
        {t("disclaimerFooter")}
      </p>
    </div>
  );
}
