import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Home, CalendarDays, NotebookText, ShieldCheck } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../lib/auth";
import { PageTransition } from "../components/PageTransition";
import { ModelStatusBadge } from "../components/ModelStatusBadge";
import { GradientBackdrop } from "../components/GradientBackdrop";

const TABS = [
  { to: "/patient", Icon: Home, labelKey: "navHome" as const, end: true },
  { to: "/patient/upload", Icon: Camera, labelKey: "navUpload" as const, end: false },
  { to: "/patient/symptoms", Icon: NotebookText, labelKey: "navSymptoms" as const, end: false },
  { to: "/patient/schedule", Icon: CalendarDays, labelKey: "navSchedule" as const, end: false },
  { to: "/patient/consent", Icon: ShieldCheck, labelKey: "navConsent" as const, end: false },
];

export function PatientLayout() {
  const { t } = useLanguage();
  const { session, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <GradientBackdrop />

      {/* Full-width on every viewport. Mobile gets a floating glass dock
          (below); desktop gets a sidebar (mirrors ClinicLayout's nav pattern
          for consistency between the two cabinets). */}
      <header className="sticky top-0 z-20 flex flex-none items-center justify-between gap-2 border-b border-navy/10 bg-surface px-4 py-3 shadow-soft sm:px-8">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-pink to-magenta font-serif text-sm text-white">
            W
          </span>
          <div className="leading-tight">
            <p className="text-xs text-ink-soft">{t("welcomeLabel")}</p>
            <p className="text-sm font-semibold text-ink">{session?.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModelStatusBadge compact />
          <button
            type="button"
            onClick={logout}
            className="rounded-btn border border-rose-pale px-2.5 py-1.5 text-xs font-semibold text-rose-deep hover:bg-rose-bg"
          >
            {t("logoutButton")}
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden flex-none flex-col gap-1 border-r border-navy/10 bg-surface px-3 py-5 sm:flex sm:w-56">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className="relative flex items-center gap-2.5 rounded-btn px-3 py-2.5 text-sm font-medium"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="patient-nav-indicator"
                      className="absolute inset-0 rounded-btn bg-rose-bg shadow-soft"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <tab.Icon
                    size={18}
                    strokeWidth={2.25}
                    className={`relative z-10 ${isActive ? "text-rose-deep" : "text-ink-soft"}`}
                  />
                  <span className={`relative z-10 ${isActive ? "text-rose-deep" : "text-ink-soft"}`}>
                    {t(tab.labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0 flex-1 px-4 py-4 pb-28 sm:px-8 sm:py-7 sm:pb-7">
          <div className="mx-auto w-full max-w-3xl">
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={location.pathname} variant="mobile">
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Floating glass dock — the mobile-app signature of the patient
          cabinet. Active tab gets the brand gradient pill behind its icon. */}
      <nav className="fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 sm:hidden">
        <ul className="glass-card grid grid-cols-5 rounded-full px-1.5 py-1.5">
          {TABS.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className="group relative flex flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-semibold"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="patient-tab-indicator"
                        className="absolute inset-x-1 top-0.5 h-8 rounded-full bg-gradient-to-br from-pink to-magenta shadow-btn"
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      />
                    )}
                    <tab.Icon
                      size={18}
                      strokeWidth={2.25}
                      className={`relative z-10 ${isActive ? "text-white" : "text-ink-soft"}`}
                    />
                    <span className={`relative z-10 ${isActive ? "text-magenta-deep" : "text-ink-muted"}`}>
                      {t(tab.labelKey)}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
