import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { register, ApiError } from "../../lib/api";
import { useAuth, homePathForRole } from "../../lib/auth";
import { useLanguage } from "../../i18n/LanguageContext";

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
      className="rounded-card border border-white/60 bg-white/80 p-6 shadow-soft backdrop-blur-xl"
    >
      <h2 className="mb-4 font-serif text-xl text-ink">{t("registerTitle")}</h2>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="reg-username" className="mb-1.5 block text-xs font-medium text-ink-soft">
            {t("usernameLabel")}
          </label>
          <input
            id="reg-username"
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-input border-[1.5px] border-line bg-[#fffafc] px-3.5 py-2.5 text-base text-ink focus:border-rose focus:outline-none focus:ring-3 focus:ring-rose/10"
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="mb-1.5 block text-xs font-medium text-ink-soft">
            {t("passwordLabel")}
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-input border-[1.5px] border-line bg-[#fffafc] px-3.5 py-2.5 text-base text-ink focus:border-rose focus:outline-none focus:ring-3 focus:ring-rose/10"
          />
        </div>
        <div>
          <label htmlFor="reg-confirm" className="mb-1.5 block text-xs font-medium text-ink-soft">
            {t("confirmPasswordLabel")}
          </label>
          <input
            id="reg-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-input border-[1.5px] border-line bg-[#fffafc] px-3.5 py-2.5 text-base text-ink focus:border-rose focus:outline-none focus:ring-3 focus:ring-rose/10"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex min-h-11 w-full items-center justify-center rounded-btn bg-gradient-to-br from-rose to-blush px-5 font-semibold text-white shadow-btn transition-shadow hover:shadow-btn-hover disabled:cursor-not-allowed disabled:from-rose-pale disabled:to-rose-pale disabled:shadow-none"
        >
          {busy ? t("registerButtonBusy") : t("registerButton")}
        </button>
        {error && <p className="text-sm text-urgent">{error}</p>}
      </form>

      <p className="mt-4 text-center text-sm text-ink-soft">
        {t("haveAccountAlready")}{" "}
        <Link to="/auth" className="font-semibold text-rose-deep hover:underline">
          {t("loginLink")}
        </Link>
      </p>
      <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
        {t("registerNote")}
      </p>
    </motion.div>
  );
}
