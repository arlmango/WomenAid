import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../lib/auth";
import { PageTransition } from "../components/PageTransition";
import { ModelStatusBadge } from "../components/ModelStatusBadge";

const TABS = [
  { to: "/patient", icon: "🏠", labelKey: "navHome" as const, end: true },
  { to: "/patient/upload", icon: "📷", labelKey: "navUpload" as const, end: false },
  { to: "/patient/symptoms", icon: "📝", labelKey: "navSymptoms" as const, end: false },
  { to: "/patient/schedule", icon: "📅", labelKey: "navSchedule" as const, end: false },
  { to: "/patient/consent", icon: "🛡️", labelKey: "navConsent" as const, end: false },
];

export function PatientLayout() {
  const { t } = useLanguage();
  const { session, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-bg">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-rose to-blush font-serif text-sm text-white">
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

      <main className="flex-1 overflow-x-hidden px-4 py-4 pb-24">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname} variant="mobile">
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[430px] border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-5">
          {TABS.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                    isActive ? "text-rose-deep" : "text-ink-muted"
                  }`
                }
              >
                <span aria-hidden className="text-base">
                  {tab.icon}
                </span>
                {t(tab.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
