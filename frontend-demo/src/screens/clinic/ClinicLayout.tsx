import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, HeartHandshake, LogOut } from "lucide-react";
import { useSession } from "../../lib/session";
import { PageTransition } from "../../components/PageTransition";
import { ModelStatusBadge } from "../../components/ui";

const NAV = [{ to: "/clinic", Icon: ClipboardList, label: "Очередь триажа", end: true }];

export function ClinicLayout() {
  const { logout } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <PageTransition variant="desktop">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-60 flex-none flex-col border-r border-white/60 bg-white/70 px-4 py-5 shadow-soft backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-2.5 px-1">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-rose to-blush text-white shadow-btn">
              <HeartHandshake size={18} strokeWidth={2.25} />
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
                            layoutId="clinic-nav"
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
                          {item.label}
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
              <p className="text-xs text-ink-soft">Вы вошли как</p>
              <p className="text-sm font-semibold text-ink">Демо-врач (clinician)</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-btn border border-rose-pale px-3 py-2 text-xs font-semibold text-rose-deep hover:bg-rose-bg"
            >
              <LogOut size={14} /> Выйти
            </button>
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
    </PageTransition>
  );
}
