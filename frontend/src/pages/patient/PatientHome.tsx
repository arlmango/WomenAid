import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, CalendarDays, ChevronRight, NotebookText, ShieldCheck, type LucideIcon } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../lib/auth";
import { ModelStatusBadge } from "../../components/ModelStatusBadge";
import type { TranslationKey } from "../../i18n/translations";

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
    badge: "bg-lavender-bg text-[#6a3d8a]",
  },
  {
    to: "/patient/schedule",
    Icon: CalendarDays,
    titleKey: "navSchedule",
    descKey: "navScheduleDesc",
    badge: "bg-peach-bg text-[#8b4a2a]",
  },
  {
    to: "/patient/consent",
    Icon: ShieldCheck,
    titleKey: "navConsent",
    descKey: "navConsentDesc",
    badge: "bg-mint-bg text-[#2a7055]",
  },
];

export function PatientHome() {
  const { t } = useLanguage();
  const { session } = useAuth();

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-white/60 bg-white/80 p-5 shadow-soft backdrop-blur-sm">
        <p className="text-xs font-medium text-ink-muted">
          {t("homeGreeting")}, <span className="text-rose-deep">{session?.username}</span>
        </p>
        <p className="mt-1.5 text-sm text-ink-soft">
          AI-триаж снимков шейки матки — инструмент поддержки принятия решений для медперсонала.
          Не постановка диагноза. Демо.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CARDS.map((card, i) => (
          <motion.div
            key={card.to}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
          >
            <Link
              to={card.to}
              className="flex h-full flex-col gap-2.5 rounded-card border border-white/60 bg-white/80 p-4 shadow-soft backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-rose-pale hover:shadow-soft-hover"
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

      <p className="border-t border-line pt-4 text-xs leading-relaxed text-ink-soft">
        {t("disclaimerFooter")}
      </p>
    </div>
  );
}
