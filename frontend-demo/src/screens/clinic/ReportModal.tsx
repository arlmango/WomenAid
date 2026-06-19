import { useEffect, useState } from "react";
import { CheckCircle2, FlaskConical, HeartHandshake, ShieldAlert } from "lucide-react";
import { mockApi } from "../../lib/mockApi";
import { DISCLAIMER } from "../../data/fixtures";
import { TRIAGE_META, formatDateTime } from "../../lib/labels";
import { Modal } from "../../components/Modal";
import { PrimaryButton } from "../../components/ui";
import { toast } from "../../lib/toast";
import type { RiskAssessment } from "../../lib/types";

export function ReportModal({
  assessment,
  patientName,
  patientAge,
  onClose,
  onReviewed,
}: {
  assessment: RiskAssessment | null;
  patientName: string;
  patientAge: number | null;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [decision, setDecision] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedDecision, setSavedDecision] = useState<string | null>(null);

  useEffect(() => {
    setDecision("");
    setNote("");
    setSavedDecision(assessment?.clinicianDecision ?? null);
  }, [assessment]);

  async function submit() {
    if (!assessment || !decision) return;
    setBusy(true);
    try {
      const updated = await mockApi.submitReview(assessment.id, decision, note);
      setSavedDecision(updated.clinicianDecision);
      setDecision("");
      setNote("");
      onReviewed();
      toast.success("Решение врача сохранено");
    } finally {
      setBusy(false);
    }
  }

  const meta = assessment ? TRIAGE_META[assessment.triageLabel] : null;

  return (
    <Modal open={assessment !== null} onClose={onClose} title="Отчёт по триажу" wide>
      {assessment && meta && (
        <div className="space-y-5">
          {/* Report header — styled like a document */}
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-rose to-blush text-white">
                <HeartHandshake size={17} strokeWidth={2.25} />
              </span>
              <div>
                <p className="font-serif text-lg leading-tight text-ink">WomenAId</p>
                <p className="text-xs text-ink-soft">Отчёт по AI-триажу · №{assessment.id}</p>
              </div>
            </div>
            <p className="text-right text-xs text-ink-soft">{formatDateTime(assessment.createdAt)}</p>
          </div>

          {/* Prominent model-status banner — never softened */}
          <div className="flex items-start gap-2.5 rounded-card border border-lavender/50 bg-lavender-bg/70 p-3">
            <FlaskConical size={18} className="mt-0.5 flex-none text-lavender-deep" />
            <div>
              <p className="text-sm font-semibold text-lavender-deep">
                Статус модели: {assessment.modelStatus}
              </p>
              <p className="text-xs text-ink-soft">
                Демо-модель ({assessment.modelVersion}), обучена на синтетических данных
                ({assessment.datasetStatus}). Не прошла клиническую валидацию.
              </p>
            </div>
          </div>

          {/* Patient + result grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Пациентка" value={patientName} />
            <Field label="Возраст" value={patientAge ? `${patientAge} лет` : "—"} />
            <Field label="Файл снимка" value={assessment.imageName} />
            <Field label="Дата снимка" value={formatDateTime(assessment.createdAt)} />
          </div>

          <div className="rounded-card bg-surface-2/70 p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className={`grid h-10 w-10 place-items-center rounded-full ${meta.badge}`}>
                <meta.Icon size={18} strokeWidth={2.25} />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-muted">Триаж-категория</p>
                <p className="font-serif text-lg text-ink">{meta.ru}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-line pt-3 text-sm">
              <Field label="raw_score" value={assessment.rawScore != null ? String(assessment.rawScore) : "—"} />
              <Field label="confidence" value={assessment.confidence != null ? String(assessment.confidence) : "—"} />
            </div>
          </div>

          {/* Existing clinician decision */}
          {savedDecision && (
            <div className="flex items-start gap-2.5 rounded-input bg-mint-bg/70 p-3 text-sm text-ink">
              <CheckCircle2 size={16} className="mt-0.5 flex-none text-mint-deep" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-mint-deep">
                  Решение врача
                </p>
                {savedDecision}
              </div>
            </div>
          )}

          {/* Review form */}
          <div className="border-t border-line pt-4">
            <p className="mb-2 text-sm font-semibold text-ink">Внести решение врача</p>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Решение</label>
            <input
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="например: направить на кольпоскопию"
              className="mb-3 w-full rounded-input border-[1.5px] border-line bg-[#fffafc] px-3 py-2 text-sm focus:border-rose focus:outline-none"
            />
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Комментарий</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mb-3 w-full rounded-input border-[1.5px] border-line bg-[#fffafc] px-3 py-2 text-sm focus:border-rose focus:outline-none"
            />
            <PrimaryButton className="w-full" disabled={busy || !decision} onClick={submit}>
              {busy ? "Сохраняем…" : "Сохранить решение"}
            </PrimaryButton>
          </div>

          {/* Disclaimer footer */}
          <div className="flex items-start gap-2 border-t border-line pt-4 text-xs leading-relaxed text-ink-soft">
            <ShieldAlert size={15} className="mt-0.5 flex-none text-rose-deep" />
            <span>{DISCLAIMER}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-medium break-words text-ink">{value}</dd>
    </div>
  );
}
