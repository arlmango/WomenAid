import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { login, ApiError } from "../../lib/api";
import { useAuth, homePathForRole } from "../../lib/auth";
import { useLanguage } from "../../i18n/LanguageContext";

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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-card border border-line bg-surface p-6 shadow-card-hover"
    >
      <h2 className="mb-4 font-serif text-xl text-ink">{t("loginTitle")}</h2>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-ink-soft">
            {t("usernameLabel")}
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-input border-[1.5px] border-line bg-[#fffafc] px-3.5 py-2.5 text-base text-ink focus:border-rose focus:outline-none focus:ring-3 focus:ring-rose/10"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-soft">
            {t("passwordLabel")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-input border-[1.5px] border-line bg-[#fffafc] px-3.5 py-2.5 text-base text-ink focus:border-rose focus:outline-none focus:ring-3 focus:ring-rose/10"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="flex min-h-11 w-full items-center justify-center rounded-btn bg-gradient-to-br from-rose to-blush px-5 font-semibold text-white shadow-btn transition-shadow hover:shadow-btn-hover disabled:cursor-not-allowed disabled:from-rose-pale disabled:to-rose-pale disabled:shadow-none"
        >
          {busy ? t("loginButtonBusy") : t("loginButton")}
        </button>
        {error && <p className="text-sm text-urgent">{error}</p>}
      </form>
    </motion.div>
  );
}
