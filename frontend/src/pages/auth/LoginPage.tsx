import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HeartHandshake, Lock, User, UserPlus } from "lucide-react";
import { login, ApiError } from "../../lib/api";
import { useAuth, homePathForRole } from "../../lib/auth";
import { useLanguage } from "../../i18n/LanguageContext";
import { FieldInput } from "../../components/FieldInput";
import { Button } from "../../components/ui";
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
      <div className="mb-7">
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-pink to-magenta text-white shadow-btn">
          <HeartHandshake size={22} strokeWidth={2.25} />
        </span>
        <h2 className="font-serif text-3xl text-navy">{t("loginTitle")}</h2>
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
        <Button type="submit" size="lg" loading={busy} className="w-full font-bold uppercase tracking-wide">
          {busy ? t("loginButtonBusy") : t("loginButton")}
        </Button>
        {error && <p className="text-sm text-urgent">{error}</p>}
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-navy/15" />
        <span className="text-xs font-medium text-ink-muted">{t("noAccountYet")}</span>
        <span className="h-px flex-1 bg-navy/15" />
      </div>

      <Button type="button" variant="outline" size="lg" onClick={() => navigate("/auth/register")} className="w-full">
        <UserPlus size={17} strokeWidth={2.25} />
        {t("registerLink")}
      </Button>
    </motion.div>
  );
}
