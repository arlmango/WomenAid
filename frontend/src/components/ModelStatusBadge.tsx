import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FlaskConical } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { SPRING_SOFT } from "../lib/motion";

// Always-visible reminder that the model has not passed clinical validation
// (CLAUDE.md: must be shown to both patients and clinicians, everywhere —
// the badge/status text itself never changes here, only its presentation).
export function ModelStatusBadge({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-line bg-lavender-bg px-2.5 py-0.5 text-[11px] font-mono font-medium tracking-wide text-lavender-deep">
        <FlaskConical size={11} strokeWidth={2.5} />
        {t("modelStatusBadge")}
      </span>
    );
  }

  return (
    <div className="gradient-border-wrap">
      <div
        className="glass-card flex cursor-default flex-col gap-3 rounded-card p-4"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white text-lavender-deep shadow-soft">
            <FlaskConical size={17} strokeWidth={2.25} />
          </span>
          <div>
            <span className="mb-1.5 inline-flex items-center rounded-full border-[1.5px] border-line bg-white px-2.5 py-0.5 text-[11px] font-mono font-medium tracking-wide text-lavender-deep">
              {t("modelStatusBadge")}
            </span>
            <p className="text-sm text-ink-soft">{t("modelStatusText")}</p>
          </div>
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPRING_SOFT}
              className="overflow-hidden border-t border-line/40 pt-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet">
                {t("modelStatusWhyLabel")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{t("modelStatusWhyText")}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
