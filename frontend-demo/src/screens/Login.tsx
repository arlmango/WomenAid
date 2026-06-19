import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HeartHandshake, Stethoscope } from "lucide-react";
import { useSession } from "../lib/session";
import type { Role } from "../lib/types";
import { PageTransition } from "../components/PageTransition";
import { PrimaryButton, SyntheticDataNote } from "../components/ui";

export function Login() {
  const navigate = useNavigate();
  const { login } = useSession();
  const [params] = useSearchParams();
  const initial: Role = params.get("role") === "clinician" ? "clinician" : "patient";

  const [role, setRole] = useState<Role>(initial);
  const [busy, setBusy] = useState(false);

  async function handleEnter() {
    setBusy(true);
    await login(role);
    navigate(role === "patient" ? "/patient" : "/clinic", { replace: true });
  }

  return (
    <PageTransition variant="desktop">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <Link to="/" className="mb-6 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-rose to-blush text-white shadow-btn">
            <HeartHandshake size={18} strokeWidth={2.25} />
          </span>
          <span className="font-serif text-2xl text-ink">WomenAId</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm rounded-card border border-white/60 bg-white/80 p-7 shadow-soft-hover backdrop-blur-xl"
        >
          <h2 className="mb-1 text-center font-serif text-2xl text-ink">Вход в демо</h2>
          <p className="mb-5 text-center text-sm text-ink-soft">Выберите кабинет для просмотра</p>

          <div className="mb-5 grid grid-cols-2 gap-2.5">
            <RoleCard
              active={role === "patient"}
              onClick={() => setRole("patient")}
              Icon={HeartHandshake}
              title="Я пациентка"
              sub="Мобильный кабинет"
            />
            <RoleCard
              active={role === "clinician"}
              onClick={() => setRole("clinician")}
              Icon={Stethoscope}
              title="Я врач"
              sub="Дашборд клиники"
            />
          </div>

          <PrimaryButton className="w-full" disabled={busy} onClick={handleEnter}>
            {busy ? "Входим…" : "Войти"}
          </PrimaryButton>

          <p className="mt-3 text-center text-xs text-ink-muted">
            Демо-вход без пароля — это мок-аутентификация для показа.
          </p>
        </motion.div>

        <div className="mt-6 w-full max-w-sm">
          <SyntheticDataNote />
        </div>
      </div>
    </PageTransition>
  );
}

function RoleCard({
  active,
  onClick,
  Icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof HeartHandshake;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-card border-2 p-4 text-center transition-all ${
        active
          ? "border-rose bg-rose-bg shadow-soft"
          : "border-line bg-white/50 hover:border-rose-pale"
      }`}
    >
      <span
        className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${
          active ? "bg-gradient-to-br from-rose to-blush text-white" : "bg-surface-2 text-ink-soft"
        }`}
      >
        <Icon size={20} strokeWidth={2.25} />
      </span>
      <span className="text-sm font-semibold text-ink">{title}</span>
      <span className="text-[11px] text-ink-muted">{sub}</span>
    </button>
  );
}
