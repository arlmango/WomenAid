import { FlaskConical } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

// Always-visible reminder that the model has not passed clinical validation
// (CLAUDE.md: must be shown to both patients and clinicians, everywhere).
export function ModelStatusBadge({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-line bg-lavender-bg px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-lavender-deep">
        <FlaskConical size={11} strokeWidth={2.5} />
        {t("modelStatusBadge")}
      </span>
    );
  }

  return (
    <div className="flex gap-3 rounded-card border-[1.5px] border-line bg-lavender-bg p-4 shadow-soft">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white text-lavender-deep">
        <FlaskConical size={17} strokeWidth={2.25} />
      </span>
      <div>
        <span className="mb-1.5 inline-flex items-center rounded-full border-[1.5px] border-line bg-white px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-lavender-deep">
          {t("modelStatusBadge")}
        </span>
        <p className="text-sm text-ink-soft">{t("modelStatusText")}</p>
      </div>
    </div>
  );
}
