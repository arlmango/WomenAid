import { useAuth } from "../../lib/auth";
import { useApiQuery } from "../../lib/useApiQuery";
import { useLanguage } from "../../i18n/LanguageContext";
import { SkeletonCard } from "../../components/Skeleton";
import type { StubResponse } from "../../types/api";

// GET /monitoring/patients/{id}/schedule is an intentional backend STUB —
// same rendering rule as PatientSymptoms (show the backend's own message,
// never invent a screening date client-side).
export function PatientSchedule() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const { data, loading } = useApiQuery<StubResponse>(
    `/api/monitoring/patients/${session?.patientId}/schedule`,
    [session?.patientId],
  );

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-xl text-ink">{t("navSchedule")}</h1>
      {loading ? (
        <SkeletonCard />
      ) : (
        <div className="rounded-card border border-line bg-surface p-5 text-center text-ink-soft">
          <p className="mb-1 text-3xl" aria-hidden>
            📅
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
