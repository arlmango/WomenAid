import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home, LogOut, NotebookText } from "lucide-react";
import { useAuthStore } from "../../lib/authStore";

const TABS = [
  { to: "/patient", Icon: Home, label: "Главная", end: true },
  { to: "/patient/symptoms", Icon: NotebookText, label: "Симптомы", end: false },
];

const pageVariants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

export function PatientLayout() {
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center py-0 sm:py-6">
      <div className="relative flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-bg sm:h-[calc(100vh-3rem)] sm:rounded-card sm:border sm:border-line sm:shadow-soft-hover">
        <header className="z-20 flex flex-none items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3 shadow-soft">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-teal font-serif text-sm text-white">
              W
            </span>
            <div className="leading-tight">
              <p className="text-xs text-ink-soft">Кабинет пациентки</p>
              <p className="text-sm font-semibold text-ink">{username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Выйти"
            className="grid h-8 w-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2"
          >
            <LogOut size={16} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className="z-20 flex-none border-t border-line bg-surface pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-soft">
          <ul className="grid grid-cols-2">
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
                          className="absolute top-1 h-8 w-12 rounded-full bg-teal-bg"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        />
                      )}
                      <tab.Icon
                        size={20}
                        strokeWidth={2.25}
                        className={`relative z-10 ${isActive ? "text-teal-deep" : "text-ink-muted"}`}
                      />
                      <span className={`relative z-10 ${isActive ? "text-teal-deep" : "text-ink-muted"}`}>
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
  );
}
