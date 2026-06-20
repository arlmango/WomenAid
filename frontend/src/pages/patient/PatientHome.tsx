import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, CalendarDays, ChevronRight, NotebookText, ShieldCheck, type LucideIcon } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../lib/auth";
import { ModelStatusBadge } from "../../components/ModelStatusBadge";
import type { TranslationKey } from "../../i18n/translations";

// Numbered badge gradients alternate gold->pink / pink->magenta per card,
// matching the deck's "stat/feature card" number-badge treatment.
const CARDS: {
  to: string;
  Icon: LucideIcon;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  badge: string;
  numberGradient: string;
}[] = [
  {
    to: "/patient/upload",
    Icon: Camera,
    titleKey: "navUpload",
    descKey: "navUploadDesc",
    badge: "bg-rose-bg text-rose-deep",
    numberGradient: "from-gold to-pink",
  },
  {
    to: "/patient/symptoms",
    Icon: NotebookText,
    titleKey: "navSymptoms",
    descKey: "navSymptomsDesc",
    badge: "bg-lavender-bg text-lavender-deep",
    numberGradient: "from-pink to-magenta",
  },
  {
    to: "/patient/schedule",
    Icon: CalendarDays,
    titleKey: "navSchedule",
    descKey: "navScheduleDesc",
    badge: "bg-peach-bg text-peach-deep",
    numberGradient: "from-gold to-pink",
  },
  {
    to: "/patient/consent",
    Icon: ShieldCheck,
    titleKey: "navConsent",
    descKey: "navConsentDesc",
    badge: "bg-mint-bg text-mint-deep",
    numberGradient: "from-pink to-magenta",
  },
];

export function PatientHome() {
  const { t } = useLanguage();
  const { session } = useAuth();

  return (
    <div className="space-y-5">
      <div className="rounded-card border-[1.5px] border-line bg-surface p-5 shadow-soft">
        <p className="text-xs font-medium text-ink-muted">
          {t("homeGreeting")}, <span className="text-magenta">{session?.username}</span>
        </p>
        <p className="mt-1.5 text-sm text-ink-soft">
          AI-триаж снимков шейки матки — инструмент поддержки принятия решений для медперсонала.
          Не постановка диагноза. Демо.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6">
        {CARDS.map((card, i) => (
          <motion.div
            key={card.to}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            className="relative"
          >
            <span
              className={`absolute -top-3 left-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${card.numberGradient} text-xs font-bold text-white shadow-btn`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <Link
              to={card.to}
              className="flex h-full flex-col gap-2.5 rounded-card-sharp border-[1.5px] border-line bg-surface p-4 pt-6 transition-all hover:-translate-y-0.5 hover:shadow-soft-hover"
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

      <p className="border-t-[1.5px] border-line pt-4 text-xs leading-relaxed text-ink-soft">
        {t("disclaimerFooter")}
      </p>
    </div>
  );
}
