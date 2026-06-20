import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { ChevronLeft, ChevronRight, HeartHandshake } from "lucide-react";
import { register as registerRequest, ApiError } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";
import { PrimaryButton, GhostButton } from "../../components/ui";
import { Step1Basics, step1Valid } from "./Step1Basics";
import { Step2Credentials, step2Valid } from "./Step2Credentials";
import { Step3Consent, step3Valid } from "./Step3Consent";
import { Step4Confirm } from "./Step4Confirm";
import { initialRegisterForm, type RegisterFormState } from "./types";

const STEP_LABELS = ["Анкета", "Доступ", "Согласие", "Готово"];
const TOTAL_STEPS = STEP_LABELS.length;

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
};

export function RegisterFlow() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const shakeControls = useAnimation();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<RegisterFormState>(initialRegisterForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(patch: Partial<RegisterFormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function go(next: number) {
    setError(null);
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  async function shake() {
    await shakeControls.start({ x: [0, -10, 10, -8, 8, -4, 4, 0], transition: { duration: 0.45 } });
  }

  const canAdvance =
    step === 1 ? step1Valid(form) : step === 2 ? step2Valid(form) : step === 3 ? step3Valid(form) : true;

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const { access_token } = await registerRequest({
        display_name: form.displayName.trim(),
        birth_date: form.birthDate,
        phone: form.phone.trim() || undefined,
        region: form.region.trim() || undefined,
        username: form.username.trim(),
        password: form.password,
        consent: form.consent,
      });
      setToken(access_token);
      navigate("/patient", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError(err.message || "Этот логин уже занят.");
      } else if (err instanceof ApiError && err.status === 422) {
        setError("Проверьте данные формы — что-то не прошло проверку.");
      } else if (err instanceof ApiError && err.status === 0) {
        setError("Не удалось подключиться к серверу. Проверьте, что backend запущен.");
      } else {
        setError("Сервер вернул ошибку регистрации.");
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

      {/* Progress dots */}
      <div className="mb-5 flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`grid h-7 w-7 place-items-center rounded-full border text-xs font-bold ${
                  active
                    ? "border-teal-deep bg-teal text-white"
                    : done
                      ? "border-teal bg-teal-bg text-teal-deep"
                      : "border-line bg-surface text-ink-muted"
                }`}
              >
                {n}
              </div>
              {n < TOTAL_STEPS && <div className="h-0.5 w-5 bg-line" />}
            </div>
          );
        })}
      </div>

      <motion.div
        animate={shakeControls}
        className="w-full max-w-sm overflow-hidden rounded-card border border-line bg-surface p-7 shadow-soft-hover"
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {step === 1 && <Step1Basics form={form} update={update} />}
            {step === 2 && <Step2Credentials form={form} update={update} />}
            {step === 3 && <Step3Consent form={form} update={update} />}
            {step === 4 && <Step4Confirm form={form} />}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-3 text-sm text-urgent">{error}</p>}

        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 1 ? (
            <GhostButton type="button" onClick={() => go(step - 1)} className="px-4">
              <ChevronLeft size={16} /> Назад
            </GhostButton>
          ) : (
            <span />
          )}

          {step < TOTAL_STEPS ? (
            <PrimaryButton type="button" disabled={!canAdvance} onClick={() => go(step + 1)} className="px-5">
              Далее <ChevronRight size={16} />
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" disabled={busy} onClick={handleSubmit} className="px-5">
              {busy ? "Создаём аккаунт…" : "Создать аккаунт"}
            </PrimaryButton>
          )}
        </div>
      </motion.div>

      <p className="mt-4 text-sm text-ink-soft">
        Уже есть аккаунт?{" "}
        <Link to="/login" className="font-semibold text-teal-deep hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
