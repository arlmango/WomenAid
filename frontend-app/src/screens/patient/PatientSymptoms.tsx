import { useState } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, NotebookText, Send } from "lucide-react";
import { apiGet, apiPost } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";
import { useAsync } from "../../lib/useAsync";
import { formatDate } from "../../lib/labels";
import { Card, PrimaryButton } from "../../components/ui";
import { toast } from "../../lib/toast";
import type { LogSymptomResponse, SymptomsResponse } from "../../lib/types";

// GET/POST /monitoring/patients/{id}/symptoms are real backend endpoints —
// red-flag detection is a deterministic keyword match server-side, never an
// AI guess, and a red flag always recommends a doctor (CLAUDE.md).
export function PatientSymptoms() {
  const patientId = useAuthStore((s) => s.patientId);
  const { data, loading, refetch } = useAsync(
    () => apiGet<SymptomsResponse>(`/api/monitoring/patients/${patientId}/symptoms`),
    [patientId],
  );

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastVerdict, setLastVerdict] = useState<LogSymptomResponse | null>(null);

  async function handleSubmit() {
    if (!text.trim() || !patientId) return;
    setSubmitting(true);
    try {
      const entry = await apiPost<LogSymptomResponse>(
        `/api/monitoring/patients/${patientId}/symptoms`,
        { symptom_text: text.trim() },
      );
      setLastVerdict(entry);
      setText("");
      refetch();
      if (entry.is_red_flag) toast.error(entry.recommendation);
      else toast.success(entry.recommendation);
    } catch {
      // apiPost already toasted the error.
    } finally {
      setSubmitting(false);
    }
  }

  const entries = data?.symptoms ?? [];

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-xl text-navy">Дневник симптомов</h1>

      <Card className="p-5">
        <label htmlFor="symptom-text" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Что вас беспокоит?
        </label>
        <textarea
          id="symptom-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Опишите симптом своими словами…"
          rows={3}
          className="mb-3 w-full rounded-input border-[1.5px] border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-3 focus:ring-indigo/15"
        />
        <PrimaryButton disabled={submitting || !text.trim()} onClick={handleSubmit} className="w-full">
          <Send size={16} strokeWidth={2.25} /> Записать
        </PrimaryButton>

        {lastVerdict && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 flex items-start gap-2.5 rounded-input border-[1.5px] border-line p-3 text-sm ${
              lastVerdict.is_red_flag ? "bg-urgent-bg text-urgent" : "bg-mint-bg text-mint-deep"
            }`}
          >
            {lastVerdict.is_red_flag && <AlertOctagon size={18} className="mt-0.5 flex-none" />}
            <span>{lastVerdict.recommendation}</span>
          </motion.div>
        )}
      </Card>

      {loading ? (
        <Card className="p-5">
          <div className="h-3 w-1/3 animate-pulse rounded-full bg-surface-3" />
        </Card>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border-[1.5px] border-line bg-surface p-8 text-center shadow-soft">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-lavender-bg text-lavender-deep">
            <NotebookText size={26} strokeWidth={2} />
          </span>
          <p className="text-sm text-ink-soft">Записей пока нет.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={`rounded-card border-[1.5px] bg-surface p-4 shadow-soft ${
                entry.is_red_flag ? "border-urgent/50" : "border-line"
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs text-ink-muted">{formatDate(entry.reported_at)}</span>
                {entry.is_red_flag && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-urgent-bg px-2 py-0.5 text-[11px] font-semibold text-urgent">
                    <AlertOctagon size={11} strokeWidth={2.5} /> Red-flag
                  </span>
                )}
              </div>
              <p className="text-sm text-ink">{entry.symptom_text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
