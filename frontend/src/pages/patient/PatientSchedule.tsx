import { CalendarDays } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useApiQuery } from "../../lib/useApiQuery";
import { useLanguage } from "../../i18n/LanguageContext";
import { SkeletonCard } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
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
        <EmptyState
          icon={CalendarDays}
          caption={t("stubNotice")}
          detail={typeof data?.detail === "string" ? data.detail : "—"}
          badgeClassName="bg-peach-bg text-[#8b4a2a]"
        />
      )}
    </div>
  );
}
