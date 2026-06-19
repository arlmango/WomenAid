import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Camera, Home, LogOut, NotebookText } from "lucide-react";
import { useSession } from "../../lib/session";
import { patients, CURRENT_PATIENT_ID } from "../../data/fixtures";
import { PageTransition } from "../../components/PageTransition";
import { ModelStatusBadge } from "../../components/ui";

const TABS = [
  { to: "/patient", Icon: Home, label: "Главная", end: true },
  { to: "/patient/symptoms", Icon: NotebookText, label: "Симптомы", end: false },
  { to: "/patient/upload", Icon: Camera, label: "Снимок", end: false },
  { to: "/patient/appointments", Icon: CalendarDays, label: "Приёмы", end: false },
];

export function PatientLayout() {
  const { logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const me = patients.find((p) => p.id === CURRENT_PATIENT_ID)!;

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <PageTransition variant="desktop">
      <div className="flex min-h-screen flex-col items-center py-0 sm:py-6">
        {/* Phone-frame card: full-bleed on real phones, floating device on desktop. */}
        <div className="relative flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-bg sm:h-[calc(100vh-3rem)] sm:rounded-card sm:border sm:border-white/60 sm:shadow-soft-hover">
          <header className="z-20 flex flex-none items-center justify-between gap-2 border-b border-white/60 bg-white/70 px-4 py-3 shadow-soft backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-rose to-blush font-serif text-sm text-white">
                {me.fullName.charAt(0)}
              </span>
              <div className="leading-tight">
                <p className="text-[11px] text-ink-soft">Кабинет пациентки</p>
                <p className="text-sm font-semibold text-ink">{me.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <ModelStatusBadge compact />
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Выйти"
                className="grid h-8 w-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2"
              >
                <LogOut size={16} />
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

          <nav className="z-20 flex-none border-t border-white/60 bg-white/75 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-soft backdrop-blur-xl">
            <ul className="grid grid-cols-4">
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
                            layoutId="patient-tab"
                            className="absolute top-1 h-8 w-12 rounded-full bg-rose-bg"
                            transition={{ type: "spring", stiffness: 420, damping: 32 }}
                          />
                        )}
                        <tab.Icon
                          size={20}
                          strokeWidth={2.25}
                          className={`relative z-10 ${isActive ? "text-rose-deep" : "text-ink-muted"}`}
                        />
                        <span className={`relative z-10 ${isActive ? "text-rose-deep" : "text-ink-muted"}`}>
                          {tab.label}
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
    </PageTransition>
  );
}
