import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { HeartHandshake, Lock, Stethoscope, User } from "lucide-react";
import { login as loginRequest, ApiError } from "../lib/api";
import { useAuthStore } from "../lib/authStore";
import { PrimaryButton } from "../components/ui";

// Where clinician/admin accounts go — a separate Vite app/build (frontend/),
// not duplicated here. Configurable since the two apps run on different
// ports/origins in dev and possibly different hosts in production.
const CLINIC_APP_URL = import.meta.env.VITE_CLINIC_APP_URL ?? "http://localhost:5173/auth";

export function Login() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const shakeControls = useAnimation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinicRedirect, setClinicRedirect] = useState(false);

  async function shake() {
    await shakeControls.start({
      x: [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.45 },
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setClinicRedirect(false);
    setBusy(true);
    try {
      const { access_token } = await loginRequest(username, password);
      setToken(access_token);
      const role = useAuthStore.getState().role;
      if (role === "patient") {
        navigate("/patient", { replace: true });
      } else if (role === "clinician" || role === "admin") {
        setClinicRedirect(true);
      } else {
        setError("Не удалось определить роль аккаунта.");
        await shake();
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Неверный логин или пароль.");
      } else if (err instanceof ApiError && err.status === 0) {
        setError("Не удалось подключиться к серверу. Проверьте, что backend запущен.");
      } else {
        setError("Сервер вернул ошибку входа.");
      }
      await shake();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-6 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-teal text-white shadow-btn">
          <HeartHandshake size={18} strokeWidth={2.25} />
        </span>
        <span className="font-serif text-2xl text-ink">WomenAId</span>
      </Link>

      <motion.div
        animate={shakeControls}
        className="w-full max-w-sm rounded-card border border-line bg-surface p-7 shadow-soft-hover"
      >
        {!clinicRedirect ? (
          <>
            <h2 className="mb-5 text-center font-serif text-2xl text-navy">Вход</h2>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Field id="username" label="Логин" icon={User} value={username} onChange={setUsername} autoComplete="username" />
              <Field
                id="password"
                label="Пароль"
                icon={Lock}
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
              <PrimaryButton type="submit" disabled={busy} className="w-full">
                {busy ? "Вход…" : "Войти"}
              </PrimaryButton>
              {error && <p className="text-sm text-urgent">{error}</p>}
            </form>
            <p className="mt-4 text-center text-sm text-ink-soft">
              Ещё нет аккаунта?{" "}
              <Link to="/register" className="font-semibold text-teal-deep hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </>
        ) : (
          <div className="text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-indigo-bg text-indigo-deep">
              <Stethoscope size={22} strokeWidth={2.25} />
            </span>
            <h2 className="font-serif text-xl text-navy">Это кабинет врача</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Аккаунты врача/администратора входят через отдельный кабинет клиники.
            </p>
            <a href={CLINIC_APP_URL} className="mt-4 inline-block">
              <PrimaryButton type="button">Перейти в кабинет врача</PrimaryButton>
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  icon: typeof User;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <Icon size={17} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          id={id}
          type={type}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-input border border-line bg-surface-2 py-2.5 pl-10 pr-3.5 text-base text-ink focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/15"
        />
      </div>
    </div>
  );
}
