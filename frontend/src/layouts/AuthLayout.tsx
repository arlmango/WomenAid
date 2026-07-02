import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { LanguageToggle } from "../components/LanguageToggle";
import { useLanguage } from "../i18n/LanguageContext";
import { SPRING_SOFT } from "../lib/motion";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRING_SOFT },
};

function BrandMark() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-pink to-magenta font-serif text-lg text-white shadow-btn">
        W
      </span>
      <span className="font-serif text-2xl">
        <span className="text-indigo">Women</span>
        <span className="text-magenta">AId</span>
      </span>
    </Link>
  );
}

// Split-screen auth shell. Left: the brand's mission statement on the warm
// cream canvas under the mesh-grain aurora — the "why". Right: a calm white
// panel where the form lives — the "how". On mobile the mission panel
// collapses to a compact brand header above the form.
export function AuthLayout() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[1.15fr_1fr]">
      <aside className="grain relative hidden overflow-hidden bg-bg lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 -left-24 h-[24rem] w-[24rem] rounded-full bg-blob-pink/40 blur-3xl" />
          <div className="absolute top-1/3 -right-28 h-[26rem] w-[26rem] rounded-full bg-blob-lavender/40 blur-3xl" />
          <div className="absolute -bottom-28 left-1/5 h-[22rem] w-[22rem] rounded-full bg-blob-peach/50 blur-3xl" />
        </div>

        <div className="relative">
          <BrandMark />
        </div>

        <motion.div
          className="relative max-w-lg"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.09 } } }}
        >
          <motion.span
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line bg-surface px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-magenta shadow-soft"
          >
            <Sparkles size={13} strokeWidth={2.5} />
            {t("landingTag")}
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="font-display text-4xl font-black uppercase leading-[1.12] tracking-tight text-navy xl:text-5xl"
          >
            {t("landingHeadlineStart")} <span className="text-gradient">{t("landingHeadlineHighlight")}</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">
            {t("landingSubtext")}
          </motion.p>
        </motion.div>

        <p className="relative text-xs text-ink-muted">{t("landingFooterNote")}</p>
      </aside>

      <main className="flex min-h-screen flex-col lg:border-l lg:border-navy/10">
        <div className="flex items-center justify-between px-4 py-4 sm:px-8">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-8">
          <div className="w-full max-w-lg">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
