import { useAuth } from "../../lib/auth";
import { useApiQuery } from "../../lib/useApiQuery";
import { useLanguage } from "../../i18n/LanguageContext";
import { SkeletonCard } from "../../components/Skeleton";
import type { StubResponse } from "../../types/api";

// GET /monitoring/patients/{id}/symptoms is an intentional backend STUB
// (see app/routers/monitoring.py) — render its own detail message rather
// than fabricating symptom data or red-flag logic client-side.
export function PatientSymptoms() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const { data, loading } = useApiQuery<StubResponse>(
    `/api/monitoring/patients/${session?.patientId}/symptoms`,
    [session?.patientId],
  );

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-xl text-ink">{t("navSymptoms")}</h1>
      {loading ? (
        <SkeletonCard />
      ) : (
        <div className="rounded-card border border-line bg-surface p-5 text-center text-ink-soft">
          <p className="mb-1 text-3xl" aria-hidden>
            📝
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t("stubNotice")}
          </p>
          <p className="mt-1 text-sm">{data?.detail ?? "—"}</p>
        </div>
      )}
    </div>
  );
}
