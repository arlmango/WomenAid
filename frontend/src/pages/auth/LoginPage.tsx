import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HeartHandshake, Lock, User, UserPlus } from "lucide-react";
import { login, ApiError } from "../../lib/api";
import { useAuth, homePathForRole } from "../../lib/auth";
import { useLanguage } from "../../i18n/LanguageContext";
import { FieldInput } from "../../components/FieldInput";
import { CursorGlow } from "../../components/CursorGlow";
import { SPRING_SOFT } from "../../lib/motion";

export function LoginPage() {
  const { t } = useLanguage();
  const { login: setSession } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { access_token } = await login(username, password);
      const session = setSession(access_token);
      if (!session) throw new Error(t("loginErrorServer"));
      navigate(homePathForRole(session.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setError(t("loginErrorInvalid"));
      else if (err instanceof ApiError && err.status === 0) setError(t("loginErrorNetwork"));
      else setError(t("loginErrorServer"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING_SOFT}>
      <CursorGlow glowColor="var(--color-magenta)" className="glass-card rounded-card p-7 shadow-soft-hover">
      <div className="mb-5 flex flex-col items-center text-center">
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-pink to-magenta text-white shadow-btn">
          <HeartHandshake size={22} strokeWidth={2.25} />
        </span>
        <h2 className="font-serif text-2xl text-navy">{t("loginTitle")}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <FieldInput
          id="username"
          label={t("usernameLabel")}
          icon={User}
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={setUsername}
        />
        <FieldInput
          id="password"
          label={t("passwordLabel")}
          icon={Lock}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={setPassword}
        />
        <button
          type="submit"
          disabled={busy}
          className="flex min-h-11 w-full items-center justify-center rounded-btn bg-gradient-to-br from-pink to-magenta px-5 font-bold uppercase tracking-wide text-white shadow-btn transition-shadow hover:shadow-btn-hover disabled:cursor-not-allowed disabled:from-rose-pale disabled:to-rose-pale disabled:shadow-none"
        >
          {busy ? t("loginButtonBusy") : t("loginButton")}
        </button>
        {error && <p className="text-sm text-urgent">{error}</p>}
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium text-ink-muted">{t("noAccountYet")}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={() => navigate("/auth/register")}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-btn border-2 border-navy bg-transparent text-sm font-semibold text-navy transition-colors hover:bg-surface-2"
      >
        <UserPlus size={17} strokeWidth={2.25} />
        {t("registerLink")}
      </button>
      </CursorGlow>
    </motion.div>
  );
}
