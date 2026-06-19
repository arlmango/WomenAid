import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../lib/auth";
import { PageTransition } from "../components/PageTransition";
import { ModelStatusBadge } from "../components/ModelStatusBadge";
import { LanguageToggle } from "../components/LanguageToggle";
import { GradientBackdrop } from "../components/GradientBackdrop";

// Single nav item today (the clinic cabinet is scoped to the triage queue —
// see the plan this app was built from); structured as a list so adding a
// second section later is a one-line change, not a layout rewrite.
const NAV = [{ to: "/clinic", Icon: ClipboardList, labelKey: "queueTitle" as const, end: true }];

export function ClinicLayout() {
  const { t } = useLanguage();
  const { session, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      <GradientBackdrop />

      <aside className="sticky top-0 flex h-screen w-60 flex-none flex-col border-r border-white/60 bg-white/70 px-4 py-5 shadow-soft backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-2.5 px-1">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-rose to-blush font-serif text-lg text-white shadow-btn">
            W
          </span>
          <div className="leading-tight">
            <p className="font-serif text-base text-ink">WomenAId</p>
            <p className="text-xs text-ink-soft">кабинет врача</p>
          </div>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.to} className="relative">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className="relative flex items-center gap-2.5 rounded-btn px-3 py-2.5 text-sm font-medium"
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="clinic-nav-indicator"
                          className="absolute inset-0 rounded-btn bg-rose-bg shadow-soft"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        />
                      )}
                      <item.Icon
                        size={18}
                        strokeWidth={2.25}
                        className={`relative z-10 ${isActive ? "text-rose-deep" : "text-ink-soft"}`}
                      />
                      <span className={`relative z-10 ${isActive ? "text-rose-deep" : "text-ink-soft"}`}>
                        {t(item.labelKey)}
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-line pt-4">
          <ModelStatusBadge compact />
          <div className="leading-tight">
            <p className="text-xs text-ink-soft">{t("welcomeLabel")}</p>
            <p className="truncate text-sm font-semibold text-ink">
              {session?.username} <span className="text-ink-muted">({session?.role})</span>
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <LanguageToggle />
            <button
              type="button"
              onClick={logout}
              className="rounded-btn border border-rose-pale px-2.5 py-1.5 text-xs font-semibold text-rose-deep hover:bg-rose-bg"
            >
              {t("logoutButton")}
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-auto px-8 py-7">
        <div className="mx-auto max-w-6xl">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname} variant="desktop">
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
