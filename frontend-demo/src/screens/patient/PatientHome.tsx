import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, ChevronRight, NotebookText, CalendarDays } from "lucide-react";
import { mockApi } from "../../lib/mockApi";
import { useAsync } from "../../lib/useAsync";
import { CURRENT_PATIENT_ID } from "../../data/fixtures";
import { SCREENING_META, formatDate } from "../../lib/labels";
import { ScreeningRing } from "../../components/ScreeningRing";
import { SkeletonRing, SkeletonCard } from "../../components/Skeleton";
import { Card, SyntheticDataNote } from "../../components/ui";

const DAY = 24 * 60 * 60 * 1000;

export function PatientHome() {
  const { data: patient, loading } = useAsync(() => mockApi.getPatient(CURRENT_PATIENT_ID));
  const { data: appts } = useAsync(() => mockApi.getAppointments(CURRENT_PATIENT_ID));
  const { data: symptoms } = useAsync(() => mockApi.getSymptoms(CURRENT_PATIENT_ID));

  const nextAppt = appts?.find((a) => a.status === "upcoming");
  const lastSymptom = symptoms?.[0];

  return (
    <div className="space-y-4">
      <Card className="flex flex-col items-center p-5">
        {loading || !patient ? (
          <SkeletonRing />
        ) : (
          (() => {
            const meta = SCREENING_META[patient.screeningStatus];
            let sub = "Плановый скрининг";
            if (patient.nextDueDate) {
              const days = Math.round((new Date(patient.nextDueDate).getTime() - Date.now()) / DAY);
              sub =
                days < 0
                  ? `Просрочено на ${Math.abs(days)} дн.`
                  : `Осталось ~${days} дн. до ${formatDate(patient.nextDueDate)}`;
            }
            return (
              <>
                <ScreeningRing
                  progress={meta.progress}
                  accent={meta.accent}
                  Icon={meta.Icon}
                  statusLabel={meta.short}
                  headline={meta.short}
                  sub={sub}
                />
                <p className="mt-3 text-center text-sm text-ink-soft">{meta.ru}</p>
              </>
            );
          })()
        )}
      </Card>

      <div className="grid grid-cols-1 gap-3">
        <QuickRow
          to="/patient/upload"
          Icon={Camera}
          badge="bg-rose-bg text-rose-deep"
          title="Загрузить снимок"
          sub="Отправить на AI-триаж"
        />
        <QuickRow
          to="/patient/symptoms"
          Icon={NotebookText}
          badge="bg-lavender-bg text-lavender-deep"
          title="Дневник симптомов"
          sub={
            lastSymptom
              ? `Последняя запись: ${formatDate(lastSymptom.reportedAt)}`
              : "Записей пока нет"
          }
        />
        <QuickRow
          to="/patient/appointments"
          Icon={CalendarDays}
          badge="bg-mint-bg text-mint-deep"
          title="Записи на приём"
          sub={
            nextAppt ? `Ближайший: ${formatDate(nextAppt.datetime)}` : "Нет предстоящих приёмов"
          }
        />
      </div>

      {!symptoms ? <SkeletonCard /> : null}

      <SyntheticDataNote />
    </div>
  );
}

function QuickRow({
  to,
  Icon,
  badge,
  title,
  sub,
}: {
  to: string;
  Icon: typeof Camera;
  badge: string;
  title: string;
  sub: string;
}) {
  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link
        to={to}
        className="flex items-center gap-3 rounded-card border border-white/60 bg-white/80 p-4 shadow-soft backdrop-blur-sm transition-all hover:border-rose-pale hover:shadow-soft-hover"
      >
        <span className={`grid h-11 w-11 flex-none place-items-center rounded-full ${badge}`}>
          <Icon size={19} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="truncate text-xs text-ink-soft">{sub}</p>
        </div>
        <ChevronRight size={18} className="flex-none text-ink-muted" />
      </Link>
    </motion.div>
  );
}
