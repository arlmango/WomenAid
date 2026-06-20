import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { KeyRound, Lock, LogIn, User, UserPlus } from "lucide-react";
import { register, ApiError } from "../../lib/api";
import { useAuth, homePathForRole } from "../../lib/auth";
import { useLanguage } from "../../i18n/LanguageContext";
import { FieldInput } from "../../components/FieldInput";

// Always creates a `patient` account (see backend/app/routers/auth.py —
// /auth/register never accepts a role). There is no role picker here on
// purpose: clinician/admin accounts are provisioned out-of-band.
export function RegisterPage() {
  const { t } = useLanguage();
  const { login: setSession } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("registerErrorMismatch"));
      return;
    }

    setBusy(true);
    try {
      const { access_token } = await register(username, password);
      const session = setSession(access_token);
      if (!session) throw new Error(t("registerErrorServer"));
      navigate(homePathForRole(session.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setError(t("registerErrorTaken"));
      else if (err instanceof ApiError && err.status === 422) setError(t("registerErrorWeak"));
      else if (err instanceof ApiError && err.status === 0) setError(t("registerErrorNetwork"));
      else setError(t("registerErrorServer"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-card border-[1.5px] border-line bg-surface p-7 shadow-soft-hover"
    >
      <div className="mb-5 flex flex-col items-center text-center">
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-pink to-magenta text-white shadow-btn">
          <UserPlus size={22} strokeWidth={2.25} />
        </span>
        <h2 className="font-serif text-2xl text-navy">{t("registerTitle")}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <FieldInput
          id="reg-username"
          label={t("usernameLabel")}
          icon={User}
          type="text"
          autoComplete="username"
          required
          minLength={3}
          value={username}
          onChange={setUsername}
        />
        <FieldInput
          id="reg-password"
          label={t("passwordLabel")}
          icon={Lock}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={setPassword}
        />
        <FieldInput
          id="reg-confirm"
          label={t("confirmPasswordLabel")}
          icon={KeyRound}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        <button
          type="submit"
          disabled={busy}
          className="flex min-h-11 w-full items-center justify-center rounded-btn bg-gradient-to-br from-pink to-magenta px-5 font-bold uppercase tracking-wide text-white shadow-btn transition-shadow hover:shadow-btn-hover disabled:cursor-not-allowed disabled:from-rose-pale disabled:to-rose-pale disabled:shadow-none"
        >
          {busy ? t("registerButtonBusy") : t("registerButton")}
        </button>
        {error && <p className="text-sm text-urgent">{error}</p>}
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium text-ink-muted">{t("haveAccountAlready")}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={() => navigate("/auth")}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-btn border-2 border-navy bg-transparent text-sm font-semibold text-navy transition-colors hover:bg-surface-2"
      >
        <LogIn size={17} strokeWidth={2.25} />
        {t("loginLink")}
      </button>

      <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
        {t("registerNote")}
      </p>
    </motion.div>
  );
}
