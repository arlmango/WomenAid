import { Link } from "react-router-dom";
import { ChevronRight, NotebookText } from "lucide-react";
import { apiGet } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";
import { useAsync } from "../../lib/useAsync";
import { SCREENING_META, DEFAULT_SCREENING_META, formatDate } from "../../lib/labels";
import { ScreeningRing } from "../../components/ScreeningRing";
import { Card, Disclaimer } from "../../components/ui";
import type { ScheduleResponse } from "../../lib/types";

export function PatientHome() {
  const patientId = useAuthStore((s) => s.patientId);
  const username = useAuthStore((s) => s.username);
  const { data, loading } = useAsync(
    () => apiGet<ScheduleResponse>(`/api/monitoring/patients/${patientId}/schedule`),
    [patientId],
  );

  const meta = data ? SCREENING_META[data.screening_status] ?? DEFAULT_SCREENING_META : DEFAULT_SCREENING_META;
  const sub = data?.next_due_date
    ? `Следующий срок: ${formatDate(data.next_due_date)}`
    : data?.last_screening_date
      ? `Последний: ${formatDate(data.last_screening_date)}`
      : "Нет записей о скрининге";

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium text-ink-muted">
        Здравствуйте, <span className="text-magenta">{username}</span>
      </p>

      <Card className="flex flex-col items-center p-5">
        {loading ? (
          <div className="flex h-[220px] w-[220px] animate-pulse items-center justify-center rounded-full bg-surface-3" />
        ) : (
          <ScreeningRing
            progress={meta.progress}
            Icon={meta.Icon}
            iconClassName={meta.iconClassName}
            headline={data?.screening_status ?? "—"}
            statusLabel={meta.ru}
            sub={sub}
          />
        )}
      </Card>

      <Link to="/patient/symptoms">
        <Card className="flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft-hover">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-lavender-bg text-lavender-deep">
            <NotebookText size={19} strokeWidth={2.25} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Дневник симптомов</p>
            <p className="text-xs text-ink-soft">Записать или посмотреть симптомы</p>
          </div>
          <ChevronRight size={18} className="text-ink-muted" />
        </Card>
      </Link>

      <Disclaimer text="Статус скрининга считается по возрасту и дате последнего обследования — это не AI-прогноз, а детерминированный расчёт по плановому графику." />
    </div>
  );
}
