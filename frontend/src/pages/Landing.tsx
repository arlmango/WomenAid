import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Brain, CalendarClock, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { GradientBackdrop } from "../components/GradientBackdrop";
import { LanguageToggle } from "../components/LanguageToggle";
import { ModelStatusBadge } from "../components/ModelStatusBadge";
import { useLanguage } from "../i18n/LanguageContext";

const FEATURES = [
  { icon: Brain, titleKey: "landingFeature1Title", descKey: "landingFeature1Desc" } as const,
  { icon: CalendarClock, titleKey: "landingFeature2Title", descKey: "landingFeature2Desc" } as const,
  { icon: ShieldCheck, titleKey: "landingFeature3Title", descKey: "landingFeature3Desc" } as const,
];

export function Landing() {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen">
      <GradientBackdrop />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 pt-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-pink to-magenta font-serif text-lg text-white shadow-btn">
            W
          </span>
          <h1 className="font-serif text-xl">
            <span className="text-indigo">Women</span>
            <span className="text-magenta">AId</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            to="/auth"
            className="hidden min-h-9 items-center rounded-btn border-2 border-navy px-4 text-sm font-semibold text-navy transition-colors hover:bg-surface-2 sm:flex"
          >
            {t("landingCtaLogin")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line bg-surface px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-magenta shadow-soft">
            <Sparkles size={13} strokeWidth={2.5} />
            {t("landingTag")}
          </span>

          <h2 className="font-serif text-4xl leading-tight sm:text-6xl">
            <span className="text-navy">{t("landingHeadlineStart")} </span>
            <span className="bg-gradient-to-br from-pink via-magenta to-indigo bg-clip-text text-transparent">
              {t("landingHeadlineHighlight")}
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base text-ink-soft sm:text-lg">{t("landingSubtext")}</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth/register"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-btn bg-gradient-to-br from-pink to-magenta px-7 font-bold uppercase tracking-wide text-white shadow-btn transition-shadow hover:shadow-btn-hover sm:w-auto"
            >
              <UserPlus size={18} strokeWidth={2.25} />
              {t("landingCtaRegister")}
            </Link>
            <Link
              to="/auth"
              className="flex min-h-12 w-full items-center justify-center rounded-btn border-2 border-navy px-7 text-sm font-semibold text-navy transition-colors hover:bg-surface-2 sm:hidden"
            >
              {t("landingCtaLogin")}
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-16 grid gap-4 sm:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="rounded-card border-[1.5px] border-line bg-surface p-5 shadow-soft transition-shadow hover:shadow-soft-hover"
            >
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-lavender-bg text-lavender-deep">
                <Icon size={19} strokeWidth={2.25} />
              </span>
              <h3 className="mb-1.5 font-serif text-base text-navy">{t(titleKey)}</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{t(descKey)}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-10"
        >
          <ModelStatusBadge />
        </motion.div>
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 text-center text-xs text-ink-muted">
        {t("landingFooterNote")}
      </footer>
    </div>
  );
}
