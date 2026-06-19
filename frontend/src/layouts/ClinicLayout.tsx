import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../lib/auth";
import { PageTransition } from "../components/PageTransition";
import { ModelStatusBadge } from "../components/ModelStatusBadge";
import { LanguageToggle } from "../components/LanguageToggle";

export function ClinicLayout() {
  const { t } = useLanguage();
  const { session, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-surface px-6 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-rose to-blush font-serif text-lg text-white shadow-btn">
            W
          </span>
          <h1 className="font-serif text-xl text-ink">WomenAId — кабинет врача</h1>
          <ModelStatusBadge compact />
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <span className="text-sm text-ink-soft">
            {t("welcomeLabel")} <strong className="text-ink">{session?.username}</strong> ({session?.role})
          </span>
          <button
            type="button"
            onClick={logout}
            className="rounded-btn border border-rose-pale px-3 py-1.5 text-sm font-semibold text-rose-deep hover:bg-rose-bg"
          >
            {t("logoutButton")}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname} variant="desktop">
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
    </div>
  );
}
