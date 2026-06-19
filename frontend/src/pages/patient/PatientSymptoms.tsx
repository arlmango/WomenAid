import { NotebookText } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useApiQuery } from "../../lib/useApiQuery";
import { useLanguage } from "../../i18n/LanguageContext";
import { SkeletonCard } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
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
        <EmptyState
          icon={NotebookText}
          caption={t("stubNotice")}
          detail={typeof data?.detail === "string" ? data.detail : "—"}
          badgeClassName="bg-lavender-bg text-[#6a3d8a]"
        />
      )}
    </div>
  );
}
