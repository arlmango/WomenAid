import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ExternalLink, LogIn, UserPlus } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

// Patient self-registration now lives in frontend-app/ (the primary site —
// see README "Три фронтенда"). It collects display_name/birth_date/consent
// and calls the real POST /auth/register contract; duplicating that form
// here would mean keeping two implementations of the same backend contract
// in sync by hand (exactly the kind of drift that broke this page once
// already — see backend/app/schemas/auth.py::RegisterRequest history).
const PATIENT_APP_URL = import.meta.env.VITE_PATIENT_APP_URL ?? "http://localhost:5174/register";

export function RegisterPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

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
        <p className="mt-2 text-sm text-ink-soft">{t("registerRedirectText")}</p>
      </div>

      <a href={PATIENT_APP_URL} className="block">
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-btn bg-gradient-to-br from-pink to-magenta px-5 font-bold uppercase tracking-wide text-white shadow-btn transition-shadow hover:shadow-btn-hover"
        >
          <ExternalLink size={17} strokeWidth={2.25} />
          {t("registerRedirectButton")}
        </button>
      </a>

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
    </motion.div>
  );
}
