import { useLanguage } from "../i18n/LanguageContext";

// Always-visible reminder that the model has not passed clinical validation
// (CLAUDE.md: must be shown to both patients and clinicians, everywhere).
export function ModelStatusBadge({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();

  if (compact) {
    return (
      <span className="inline-flex items-center rounded-full bg-lavender-bg px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#6a3d8a]">
        {t("modelStatusBadge")}
      </span>
    );
  }

  return (
    <div className="rounded-card border border-lavender-bg bg-[#f7f2ff] p-4">
      <span className="mb-2 inline-flex items-center rounded-full bg-lavender-bg px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#6a3d8a]">
        {t("modelStatusBadge")}
      </span>
      <p className="text-sm text-ink-soft">{t("modelStatusText")}</p>
    </div>
  );
}
