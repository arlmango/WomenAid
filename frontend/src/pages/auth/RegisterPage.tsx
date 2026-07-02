import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Lock, LogIn, MapPin, Phone, ShieldCheck, User, UserPlus } from "lucide-react";
import { register, getConsentText, ApiError, type ConsentTextResponse } from "../../lib/api";
import { useAuth, homePathForRole } from "../../lib/auth";
import { useLanguage } from "../../i18n/LanguageContext";
import { FieldInput } from "../../components/FieldInput";
import { Button, Card } from "../../components/ui";
import { SPRING_SOFT } from "../../lib/motion";

// Real self-registration: one plain form, no multi-step/motion choreography.
// consent is a hard technical gate on the backend (CLAUDE.md) — the submit
// button stays disabled until the checkbox is checked, not just validated
// after a failed click.
export function RegisterPage() {
  const { t } = useLanguage();
  const { login: setSession } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [region, setRegion] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [consentText, setConsentText] = useState<ConsentTextResponse | null>(null);
  const [consentLoading, setConsentLoading] = useState(true);

  useEffect(() => {
    getConsentText()
      .then(setConsentText)
      .catch(() => setConsentText(null))
      .finally(() => setConsentLoading(false));
  }, []);

  const canSubmit =
    displayName.trim().length > 0 &&
    birthDate.length > 0 &&
    username.trim().length >= 3 &&
    password.length >= 8 &&
    password === confirmPassword &&
    consent &&
    !consentLoading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("registerErrorMismatch"));
      return;
    }
    if (!consent) {
      setError(t("registerErrorConsent"));
      return;
    }

    setBusy(true);
    try {
      const { access_token } = await register({
        display_name: displayName.trim(),
        birth_date: birthDate,
        phone: phone.trim() || undefined,
        region: region.trim() || undefined,
        username: username.trim(),
        password,
        consent,
      });
      const session = setSession(access_token);
      if (!session) throw new Error(t("registerErrorServer"));
      navigate(homePathForRole(session.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setError(err.message || t("registerErrorTaken"));
      else if (err instanceof ApiError && err.status === 422) setError(t("registerErrorValidation"));
      else if (err instanceof ApiError && err.status === 0) setError(t("registerErrorNetwork"));
      else setError(t("registerErrorServer"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING_SOFT}>
      <div className="mb-7">
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-pink to-magenta text-white shadow-btn">
          <UserPlus size={22} strokeWidth={2.25} />
        </span>
        <h2 className="font-serif text-3xl text-navy">{t("registerTitle")}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <FieldInput
            id="reg-display-name"
            label={t("displayNameLabel")}
            icon={User}
            type="text"
            required
            value={displayName}
            onChange={setDisplayName}
          />
          <FieldInput
            id="reg-birth-date"
            label={t("birthDateLabel")}
            icon={CalendarDays}
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            value={birthDate}
            onChange={setBirthDate}
          />
          <FieldInput
            id="reg-region"
            label={t("regionLabel")}
            icon={MapPin}
            type="text"
            value={region}
            onChange={setRegion}
          />
          <FieldInput
            id="reg-phone"
            label={t("phoneLabel")}
            icon={Phone}
            type="tel"
            placeholder="+7 700 000 00 00"
            value={phone}
            onChange={setPhone}
          />
        </div>
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
        <div className="grid gap-3.5 sm:grid-cols-2">
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
            icon={Lock}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        </div>

        {/* Medical consent in the strict med-card style (thin deep-blue
            border) — this is a legal/medical document, not marketing. Full
            text always visible, not hidden behind a link (CLAUDE.md treats
            this as a safety requirement). */}
        <Card variant="med" className="shadow-none">
          <div className="flex items-center gap-2 border-b border-navy/15 px-4 py-2.5">
            <ShieldCheck size={15} className="flex-none text-magenta-deep" />
            <span className="font-display text-xs font-extrabold uppercase tracking-wider text-navy">
              {t("consentSectionTitle")}
            </span>
          </div>
          <div className="max-h-40 overflow-y-auto px-4 py-3 text-xs leading-relaxed text-ink">
            {consentLoading ? (
              <span className="text-ink-muted">{t("consentLoadingText")}</span>
            ) : consentText ? (
              consentText.text
            ) : (
              <span className="text-urgent">{t("consentLoadErrorText")}</span>
            )}
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 border-t border-navy/15 px-4 py-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={!consentText}
              className="mt-0.5 h-4.5 w-4.5 flex-none accent-magenta-deep"
            />
            <span className="text-sm text-ink">{t("consentCheckboxLabel")}</span>
          </label>
        </Card>

        <Button
          type="submit"
          size="lg"
          loading={busy}
          disabled={busy || !canSubmit}
          className="w-full font-bold uppercase tracking-wide"
        >
          {busy ? t("registerButtonBusy") : t("registerButton")}
        </Button>
        {error && <p className="text-sm text-urgent">{error}</p>}
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-navy/15" />
        <span className="text-xs font-medium text-ink-muted">{t("haveAccountAlready")}</span>
        <span className="h-px flex-1 bg-navy/15" />
      </div>

      <Button type="button" variant="outline" size="lg" onClick={() => navigate("/auth")} className="w-full">
        <LogIn size={17} strokeWidth={2.25} />
        {t("loginLink")}
      </Button>
    </motion.div>
  );
}
