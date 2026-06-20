import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { apiGet } from "../../lib/api";
import type { ConsentTextResponse } from "../../lib/types";
import type { RegisterFormState } from "./types";

export function Step3Consent({
  form,
  update,
}: {
  form: RegisterFormState;
  update: (patch: Partial<RegisterFormState>) => void;
}) {
  const [consentText, setConsentText] = useState<ConsentTextResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<ConsentTextResponse>("/api/auth/consent-text", { silent: true })
      .then(setConsentText)
      .catch(() => setConsentText(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="mb-1 font-serif text-xl text-navy">Согласие на участие</h2>
      <p className="text-sm text-ink-soft">
        Пожалуйста, прочитайте текст согласия полностью перед тем, как продолжить.
      </p>

      {/* Full text, always visible (not hidden behind a small link) — CLAUDE.md
          treats this as a technical/safety requirement, not a formality. */}
      <div className="max-h-56 overflow-y-auto rounded-card border-[1.5px] border-line bg-surface-2 p-4 text-sm leading-relaxed text-ink">
        {loading ? (
          <span className="text-ink-muted">Загрузка текста согласия…</span>
        ) : consentText ? (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Версия {consentText.version}
            </p>
            {consentText.text}
          </>
        ) : (
          <span className="text-urgent">
            Не удалось загрузить текст согласия. Проверьте соединение и вернитесь на этот шаг.
          </span>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-card border-[1.5px] border-line bg-surface p-4">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => update({ consent: e.target.checked })}
          disabled={!consentText}
          className="mt-0.5 h-5 w-5 flex-none accent-magenta"
        />
        <span className="text-sm text-ink">
          <span className="mb-0.5 flex items-center gap-1.5 font-semibold text-navy">
            <ShieldCheck size={15} /> Я прочитала и согласна
          </span>
          Я подтверждаю, что прочитала текст согласия выше и соглашаюсь на обработку
          моих данных, как описано.
        </span>
      </label>
    </div>
  );
}

export function step3Valid(form: RegisterFormState): boolean {
  return form.consent === true;
}
