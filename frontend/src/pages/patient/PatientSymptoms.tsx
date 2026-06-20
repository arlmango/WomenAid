import { useState } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, NotebookText, Send } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { apiPost } from "../../lib/api";
import { useApiQuery } from "../../lib/useApiQuery";
import { useLanguage } from "../../i18n/LanguageContext";
import { SkeletonCard } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { toast } from "../../lib/toast";
import type { LogSymptomResponse, SymptomEntry, SymptomsResponse } from "../../types/api";

// GET/POST /monitoring/patients/{id}/symptoms are real, not stubs: red-flag
// detection is a deterministic keyword match (app/models/screening_rules.py
// ::evaluate_symptom) — never an AI guess. A red flag always recommends a
// doctor, and nothing here ever implies "you are healthy" (CLAUDE.md).
export function PatientSymptoms() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const patientId = session?.patientId;
  const { data, loading, refetch } = useApiQuery<SymptomsResponse>(
    `/api/monitoring/patients/${patientId}/symptoms`,
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

  const entries: SymptomEntry[] = data?.symptoms ?? [];

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-xl text-navy">{t("navSymptoms")}</h1>

      <div className="rounded-card border-[1.5px] border-line bg-surface p-5 shadow-soft">
        <label htmlFor="symptom-text" className="mb-1.5 block text-xs font-medium text-ink-soft">
          {t("symptomInputLabel")}
        </label>
        <textarea
          id="symptom-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("symptomInputPlaceholder")}
          rows={3}
          className="mb-3 w-full rounded-input border-[1.5px] border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-3 focus:ring-indigo/15"
        />
        <button
          type="button"
          disabled={submitting || !text.trim()}
          onClick={handleSubmit}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-btn bg-gradient-to-br from-pink to-magenta px-5 font-bold uppercase tracking-wide text-white shadow-btn disabled:from-rose-pale disabled:to-rose-pale disabled:shadow-none"
        >
          <Send size={16} strokeWidth={2.25} />
          {t("symptomSubmit")}
        </button>

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
      </div>

      {loading ? (
        <SkeletonCard />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={NotebookText}
          caption={t("symptomEmptyList")}
          badgeClassName="bg-lavender-bg text-lavender-deep"
        />
      ) : (
        <ul className="space-y-2.5">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-card border-[1.5px] border-line bg-surface p-4 shadow-soft"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs text-ink-muted">
                  {new Date(entry.reported_at).toLocaleDateString()}
                </span>
                {entry.is_red_flag && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-urgent-bg px-2 py-0.5 text-[11px] font-semibold text-urgent">
                    <AlertOctagon size={11} strokeWidth={2.5} />
                    {t("symptomRedFlag")}
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
