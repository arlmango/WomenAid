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
//
// Card gradient is a status semantic, not decoration: calm indigo for "all
// good / not applicable", warm pink→gold for "due soon", unambiguous red for
// OVERDUE — softening an overdue screening into brand pastel would bury the
// one signal this screen exists to deliver.
const STATUS_VISUALS: Record<string, { Icon: typeof CalendarDays; card: string }> = {
  UP_TO_DATE: { Icon: CalendarCheck, card: "bg-gradient-to-br from-indigo to-violet" },
  DUE_SOON: { Icon: CalendarClock, card: "bg-gradient-to-br from-pink to-gold" },
  OVERDUE: { Icon: CalendarX, card: "bg-gradient-to-br from-urgent to-rose-deep" },
  NOT_YET_ELIGIBLE: { Icon: CalendarDays, card: "bg-gradient-to-br from-indigo to-violet" },
  OUT_OF_PROGRAM_AGE: { Icon: CalendarDays, card: "bg-gradient-to-br from-indigo to-violet" },
};
const DEFAULT_STATUS_VISUAL = { Icon: CalendarDays, card: "bg-gradient-to-br from-indigo to-violet" };

export function PatientSchedule() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const { data, loading } = useApiQuery<ScheduleResponse>(
    `/api/monitoring/patients/${session?.patientId}/schedule`,
    [session?.patientId],
  );

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl text-navy">{t("navSchedule")}</h1>
      {loading || !data ? (
        <SkeletonCard />
      ) : (
        (() => {
          const visual = STATUS_VISUALS[data.screening_status] ?? DEFAULT_STATUS_VISUAL;
          const statusKey = `scheduleStatus_${data.screening_status}` as TranslationKey;
          return (
            <div className={`grain relative overflow-hidden rounded-3xl p-5 text-white shadow-soft ${visual.card}`}>
              <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10" aria-hidden="true" />

              <div className="relative mb-4 flex items-center gap-3">
                <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-white/20 text-white">
                  <visual.Icon size={22} strokeWidth={2.25} />
                </span>
                <div>
                  <p className="font-display text-lg font-extrabold leading-tight">{t(statusKey)}</p>
                  <p className="font-mono text-xs text-white/70">{data.screening_status}</p>
                </div>
              </div>

              <dl className="relative grid grid-cols-2 gap-3 border-t border-white/20 pt-4">
                <div className={`rounded-input bg-white/15 p-3 ${data.next_due_date ? "" : "col-span-2"}`}>
                  <dt className="text-xs text-white/75">{t("scheduleLastDone")}</dt>
                  <dd className="mt-0.5 text-sm font-semibold">
                    {data.last_screening_date
                      ? new Date(data.last_screening_date).toLocaleDateString()
                      : t("scheduleNoLastDone")}
                  </dd>
                </div>
                {data.next_due_date && (
                  <div className="rounded-input bg-white/15 p-3">
                    <dt className="text-xs text-white/75">{t("scheduleNextDue")}</dt>
                    <dd className="mt-0.5 font-display text-sm font-extrabold">
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
