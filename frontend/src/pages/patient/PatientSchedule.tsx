import { CalendarCheck, CalendarClock, CalendarDays, CalendarX } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useApiQuery } from "../../lib/useApiQuery";
import { useLanguage } from "../../i18n/LanguageContext";
import { SkeletonCard } from "../../components/Skeleton";
import type { ScheduleResponse } from "../../types/api";
import type { TranslationKey } from "../../i18n/translations";

// GET /monitoring/patients/{id}/schedule is real: screening status comes from
// app/models/screening_rules.py::get_screening_status (age + last screening
// date) — deterministic, explicitly PLACEHOLDER thresholds (not clinically
// validated), never an AI guess.
const STATUS_VISUALS: Record<string, { Icon: typeof CalendarDays; className: string }> = {
  UP_TO_DATE: { Icon: CalendarCheck, className: "bg-mint text-mint-deep" },
  DUE_SOON: { Icon: CalendarClock, className: "bg-gold text-navy" },
  OVERDUE: { Icon: CalendarX, className: "bg-urgent text-white" },
  NOT_YET_ELIGIBLE: { Icon: CalendarDays, className: "bg-surface-3 text-ink-soft" },
  OUT_OF_PROGRAM_AGE: { Icon: CalendarDays, className: "bg-surface-3 text-ink-soft" },
};
const DEFAULT_STATUS_VISUAL = { Icon: CalendarDays, className: "bg-surface-3 text-ink-soft" };

export function PatientSchedule() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const { data, loading } = useApiQuery<ScheduleResponse>(
    `/api/monitoring/patients/${session?.patientId}/schedule`,
    [session?.patientId],
  );

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-xl text-navy">{t("navSchedule")}</h1>
      {loading || !data ? (
        <SkeletonCard />
      ) : (
        (() => {
          const visual = STATUS_VISUALS[data.screening_status] ?? DEFAULT_STATUS_VISUAL;
          const statusKey = `scheduleStatus_${data.screening_status}` as TranslationKey;
          return (
            <div className="rounded-card border-[1.5px] border-line bg-surface p-5 shadow-soft">
              <div className="mb-4 flex items-center gap-3">
                <span className={`grid h-12 w-12 flex-none place-items-center rounded-full ${visual.className}`}>
                  <visual.Icon size={22} strokeWidth={2.25} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{t(statusKey)}</p>
                  <p className="text-xs text-ink-muted">{data.screening_status}</p>
                </div>
              </div>

              <dl className="space-y-2 border-t-[1.5px] border-line pt-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">{t("scheduleLastDone")}</dt>
                  <dd className="font-medium text-ink">
                    {data.last_screening_date
                      ? new Date(data.last_screening_date).toLocaleDateString()
                      : t("scheduleNoLastDone")}
                  </dd>
                </div>
                {data.next_due_date && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">{t("scheduleNextDue")}</dt>
                    <dd className="font-medium text-ink">
                      {new Date(data.next_due_date).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          );
        })()
      )}
    </div>
  );
}
