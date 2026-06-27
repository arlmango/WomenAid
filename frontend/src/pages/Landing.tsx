import { lazy, Suspense, useRef } from "react";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Brain, CalendarClock, Check, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { GradientBackdrop } from "../components/GradientBackdrop";
import { CursorGlow } from "../components/CursorGlow";
import { LanguageToggle } from "../components/LanguageToggle";
import { ModelStatusBadge } from "../components/ModelStatusBadge";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { useLanguage } from "../i18n/LanguageContext";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";
import { SPRING_SOFT } from "../lib/motion";
import type { TranslationKey } from "../i18n/translations";

// three.js is ~600KB — lazy-load it so only this public marketing route
// pays for it; /auth, /patient/*, /clinic/* never touch this chunk.
const HeroScene = lazy(() => import("../components/three/HeroScene"));

const FEATURES = [
  { icon: Brain, titleKey: "landingFeature1Title", descKey: "landingFeature1Desc" } as const,
  { icon: CalendarClock, titleKey: "landingFeature2Title", descKey: "landingFeature2Desc" } as const,
  { icon: ShieldCheck, titleKey: "landingFeature3Title", descKey: "landingFeature3Desc" } as const,
];

// Honest roadmap, not a feature list — the first two steps are genuinely
// shipped (see README "Путь к пилоту"), the rest are real, unfinished
// work. Nothing here claims a capability (e.g. real clinical accuracy)
// that doesn't exist yet.
const ROADMAP = [
  { titleKey: "landingRoadmapStep1Title", descKey: "landingRoadmapStep1Desc", status: "done" } as const,
  { titleKey: "landingRoadmapStep2Title", descKey: "landingRoadmapStep2Desc", status: "done" } as const,
  { titleKey: "landingRoadmapStep3Title", descKey: "landingRoadmapStep3Desc", status: "current" } as const,
  { titleKey: "landingRoadmapStep4Title", descKey: "landingRoadmapStep4Desc", status: "upcoming" } as const,
  { titleKey: "landingRoadmapStep5Title", descKey: "landingRoadmapStep5Desc", status: "upcoming" } as const,
];
const CURRENT_STEP = ROADMAP.findIndex((s) => s.status === "current") + 1;

function Hero() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Fraunces' opsz axis redraws the serifs themselves as it grows — not
  // just "bolder" but genuinely more elegant — so animating wght and opsz
  // together as the hero scrolls reads as the text "coming alive". Axis
  // tags must be double-quoted and comma-separated per the CSS spec, or
  // the browser silently drops the whole value.
  const weight = useTransform(scrollYProgress, [0, 1], [400, 600]);
  const opticalSize = useTransform(scrollYProgress, [0, 1], [9, 72]);
  const fontVariationSettings = useMotionTemplate`"wght" ${weight}, "opsz" ${opticalSize}`;

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={SPRING_SOFT}>
      <CursorGlow alwaysOn glowColor="var(--color-magenta)" className="rounded-card">
        <div className="px-2 py-2 text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-line bg-surface px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-magenta shadow-soft">
            <Sparkles size={13} strokeWidth={2.5} />
            {t("landingTag")}
          </span>

          <motion.h2 className="font-serif text-4xl leading-tight sm:text-6xl" style={{ fontVariationSettings }}>
            <span className="text-navy">{t("landingHeadlineStart")} </span>
            <span className="bg-gradient-to-br from-pink via-magenta to-indigo bg-clip-text text-transparent">
              {t("landingHeadlineHighlight")}
            </span>
          </motion.h2>

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
        </div>
      </CursorGlow>
    </motion.div>
  );
}

function FeatureCard({
  icon: Icon,
  titleKey,
  descKey,
}: {
  icon: typeof Brain;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}) {
  const { t } = useLanguage();
  return (
    <CursorGlow glowColor="var(--color-violet)" className="rounded-card">
      <motion.div
        whileHover={{ y: -4 }}
        transition={SPRING_SOFT}
        className="glass-card h-full rounded-card p-5"
      >
        <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-lavender-bg text-lavender-deep">
          <Icon size={19} strokeWidth={2.25} />
        </span>
        <h3 className="mb-1.5 font-serif text-base text-navy">{t(titleKey)}</h3>
        <p className="text-sm leading-relaxed text-ink-soft">{t(descKey)}</p>
      </motion.div>
    </CursorGlow>
  );
}

function RoadmapStep({
  step,
  index,
}: {
  step: (typeof ROADMAP)[number];
  index: number;
}) {
  const { t } = useLanguage();
  const statusLabel =
    step.status === "done"
      ? t("landingRoadmapStatusDone")
      : step.status === "current"
        ? t("landingRoadmapStatusCurrent")
        : t("landingRoadmapStatusUpcoming");
  const statusClass =
    step.status === "done"
      ? "bg-mint-bg text-mint-deep"
      : step.status === "current"
        ? "bg-gradient-to-br from-pink to-magenta text-white"
        : "bg-surface-3 text-ink-muted";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ ...SPRING_SOFT, delay: index * 0.06 }}
      className="glass-card flex items-start gap-3.5 rounded-card p-4"
    >
      <span
        className={`grid h-8 w-8 flex-none place-items-center rounded-full text-xs font-bold ${
          step.status === "done" ? "bg-mint text-mint-deep" : "bg-surface-3 text-ink-soft"
        }`}
      >
        {step.status === "done" ? <Check size={15} strokeWidth={3} /> : index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold text-ink">{t(step.titleKey)}</h4>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{t(step.descKey)}</p>
      </div>
    </motion.div>
  );
}

export function Landing() {
  const { t } = useLanguage();
  const reducedMotion = usePrefersReducedMotion();
  const heroWrapRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative min-h-screen">
      <GradientBackdrop />

      {!reducedMotion && (
        <div ref={heroWrapRef} className="pointer-events-none fixed inset-0 -z-10 h-screen">
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
        </div>
      )}

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
        <Hero />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={SPRING_SOFT}
          className="mt-16 grid gap-4 sm:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.titleKey} {...f} />
          ))}
        </motion.div>

        <div className="mt-12">
          <ModelStatusBadge />
        </div>

        <section className="mt-16">
          <div className="mb-2 flex items-baseline gap-2.5">
            <h3 className="font-serif text-2xl text-navy">{t("landingRoadmapTitle")}</h3>
            <span className="text-sm font-semibold text-ink-muted">
              {t("landingRoadmapStepLabel")} <AnimatedNumber value={CURRENT_STEP} /> {t("landingRoadmapOf")}{" "}
              {ROADMAP.length}
            </span>
          </div>
          <p className="mb-5 text-sm text-ink-soft">{t("landingRoadmapSubtext")}</p>
          <div className="space-y-3">
            {ROADMAP.map((step, i) => (
              <RoadmapStep key={step.titleKey} step={step} index={i} />
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 text-center text-xs text-ink-muted">
        {t("landingFooterNote")}
      </footer>
    </div>
  );
}
