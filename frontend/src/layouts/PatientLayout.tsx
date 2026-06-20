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
    <div className="flex min-h-screen flex-col items-center py-0 sm:py-6">
      <GradientBackdrop />

      {/* On real phone widths this fills the screen edge-to-edge; on wider
          viewports it reads as a floating "device" card on the ambient
          gradient backdrop instead of a lost column in empty whitespace.
          Fixed height + flex (not fixed/absolute positioning) keeps the
          header and bottom nav pinned to THIS card's edges, not the raw
          browser viewport — that matters once the card stops being
          full-bleed on desktop. */}
      <div className="relative flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-bg sm:h-[calc(100vh-3rem)] sm:rounded-card sm:border-[1.5px] sm:border-line sm:shadow-soft-hover">
        <header className="z-20 flex flex-none items-center justify-between gap-2 border-b-[1.5px] border-line bg-surface px-4 py-3 shadow-soft">
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

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname} variant="mobile">
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>

        <nav className="z-20 flex-none border-t-[1.5px] border-line bg-surface pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-soft">
          <ul className="grid grid-cols-5">
            {TABS.map((tab) => (
              <li key={tab.to}>
                <NavLink
                  to={tab.to}
                  end={tab.end}
                  className="group relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="patient-tab-indicator"
                          className="absolute top-1 h-7 w-7 rounded-full bg-rose-bg"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        />
                      )}
                      <tab.Icon
                        size={20}
                        strokeWidth={2.25}
                        className={`relative z-10 ${isActive ? "text-rose-deep" : "text-ink-muted"}`}
                      />
                      <span className={`relative z-10 ${isActive ? "text-rose-deep" : "text-ink-muted"}`}>
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
    </div>
  );
}
