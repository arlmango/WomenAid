import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, Siren, Users } from "lucide-react";
import { mockApi } from "../../lib/mockApi";
import { useAsync } from "../../lib/useAsync";
import { TRIAGE_META, formatDateTime } from "../../lib/labels";
import { SkeletonCard, SkeletonRow } from "../../components/Skeleton";
import { Card } from "../../components/ui";

const COLUMNS = ["ID", "Пациентка", "Триаж-категория", "raw_score", "confidence", "Статус модели", "Создано"];

export function ClinicQueue() {
  const navigate = useNavigate();
  const { data: queue, loading } = useAsync(() => mockApi.getQueue());
  const { data: overview, loading: ovLoading } = useAsync(() => mockApi.getClinicOverview());

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl text-ink">Очередь триажа</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Снимки, поступившие от пациенток. Клик по строке — карточка пациентки и отчёт.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ovLoading || !overview ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <Stat Icon={Users} label="Всего пациенток" value={overview.totalPatients} badge="bg-mint-bg text-mint-deep" />
            <Stat Icon={Clock} label="Ждут ревью" value={overview.pendingReview} badge="bg-peach-bg text-peach-deep" />
            <Stat Icon={Siren} label="Срочных" value={overview.urgent} badge="bg-urgent-bg text-urgent" />
            <Stat Icon={AlertTriangle} label="Red-flag симптомов" value={overview.redFlags} badge="bg-lavender-bg text-lavender-deep" />
          </>
        )}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2/70 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {COLUMNS.map((c) => (
                <th key={c} className="whitespace-nowrap px-4 py-3">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={COLUMNS.length} />)}

            {!loading &&
              queue?.map((a) => {
                const meta = TRIAGE_META[a.triageLabel];
                return (
                  <tr
                    key={a.id}
                    onClick={() => navigate(`/clinic/patients/${a.patientId}`)}
                    className="cursor-pointer border-t border-line transition-colors hover:bg-surface-3"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{a.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{a.patientName}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badge}`}>
                        <meta.Icon size={12} strokeWidth={2.5} />
                        {meta.short}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink">{a.rawScore ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink">{a.confidence ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-soft">{a.modelStatus}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(a.createdAt)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </Card>

      <p className="text-center text-[11px] leading-relaxed text-ink-muted">
        raw_score / confidence видны только медперсоналу и никогда не показываются пациентке.
        Данные пациенток — синтетические, для демонстрации.
      </p>
    </div>
  );
}

function Stat({
  Icon,
  label,
  value,
  badge,
}: {
  Icon: typeof Users;
  label: string;
  value: number;
  badge: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={`grid h-10 w-10 flex-none place-items-center rounded-full ${badge}`}>
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <div>
        <p className="text-xl font-semibold text-ink">{value}</p>
        <p className="text-xs text-ink-soft">{label}</p>
      </div>
    </Card>
  );
}
