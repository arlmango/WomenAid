import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { ModelStatusBadge } from "../../components/ModelStatusBadge";

const CARDS = [
  { to: "/patient/upload", icon: "📷", titleKey: "navUpload" as const },
  { to: "/patient/symptoms", icon: "📝", titleKey: "navSymptoms" as const },
  { to: "/patient/schedule", icon: "📅", titleKey: "navSchedule" as const },
  { to: "/patient/consent", icon: "🛡️", titleKey: "navConsent" as const },
];

export function PatientHome() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-white/60 bg-white/80 p-5 shadow-soft backdrop-blur-sm">
        <p className="text-sm text-ink-soft">
          AI-триаж снимков шейки матки — инструмент поддержки принятия решений для медперсонала.
          Не постановка диагноза. Демо.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="flex flex-col items-center gap-2 rounded-card border border-white/60 bg-white/80 p-5 text-center shadow-soft backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-rose-pale hover:shadow-soft-hover"
          >
            <span className="text-2xl" aria-hidden>
              {card.icon}
            </span>
            <span className="text-sm font-semibold text-ink">{t(card.titleKey)}</span>
          </Link>
        ))}
      </div>

      <ModelStatusBadge />

      <p className="border-t border-line pt-4 text-xs leading-relaxed text-ink-soft">
        {t("disclaimerFooter")}
      </p>
    </div>
  );
}
