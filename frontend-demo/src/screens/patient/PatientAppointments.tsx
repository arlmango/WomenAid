import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, CalendarPlus, Check, Clock, MapPin, Stethoscope } from "lucide-react";
import { mockApi } from "../../lib/mockApi";
import { useAsync } from "../../lib/useAsync";
import { CURRENT_PATIENT_ID } from "../../data/fixtures";
import { formatDateTime } from "../../lib/labels";
import { SkeletonCard } from "../../components/Skeleton";
import { BottomSheet } from "../../components/BottomSheet";
import { Card, PrimaryButton } from "../../components/ui";
import { toast } from "../../lib/toast";
import type { Appointment } from "../../lib/types";

const DAY = 24 * 60 * 60 * 1000;

// Generate a few plausible upcoming slots (next business-ish days at 10:00).
function slots(): { label: string; iso: string }[] {
  const out: { label: string; iso: string }[] = [];
  for (let i = 2; i <= 8; i += 2) {
    const d = new Date(Date.now() + i * DAY);
    d.setHours(10, 0, 0, 0);
    out.push({ label: formatDateTime(d.toISOString()), iso: d.toISOString() });
  }
  return out;
}

export function PatientAppointments() {
  const { data, loading, refetch } = useAsync(() => mockApi.getAppointments(CURRENT_PATIENT_ID));
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Плановый осмотр");
  const [slotIso, setSlotIso] = useState(slots()[0].iso);
  const [busy, setBusy] = useState(false);

  const upcoming = data?.filter((a) => a.status === "upcoming") ?? [];
  const past = data?.filter((a) => a.status !== "upcoming") ?? [];

  async function book() {
    setBusy(true);
    try {
      await mockApi.bookAppointment(CURRENT_PATIENT_ID, { datetime: slotIso, reason });
      setOpen(false);
      refetch();
      toast.success("Вы записаны на приём");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl text-ink">Записи на приём</h1>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-btn bg-gradient-to-br from-rose to-blush px-3 py-2 text-xs font-semibold text-white shadow-btn"
        >
          <CalendarPlus size={15} /> Записаться
        </button>
      </div>

      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Предстоящие
              </h2>
              {upcoming.map((a, i) => (
                <ApptCard key={a.id} appt={a} index={i} accent />
              ))}
            </section>
          )}

          {past.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                История
              </h2>
              {past.map((a, i) => (
                <ApptCard key={a.id} appt={a} index={i} />
              ))}
            </section>
          )}

          {upcoming.length === 0 && past.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-card border border-white/60 bg-white/80 p-8 text-center shadow-soft backdrop-blur-sm">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-mint-bg text-mint-deep">
                <CalendarDays size={26} strokeWidth={2} />
              </span>
              <p className="text-sm text-ink-soft">Приёмов пока нет. Запишитесь на первый.</p>
            </div>
          )}
        </>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Запись на приём">
        <label className="mb-1.5 block text-xs font-medium text-ink-soft">Причина визита</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mb-3 w-full rounded-input border-[1.5px] border-line bg-[#fffafc] px-3.5 py-2.5 text-sm text-ink focus:border-rose focus:outline-none"
        />
        <label className="mb-1.5 block text-xs font-medium text-ink-soft">Время</label>
        <div className="mb-4 space-y-2">
          {slots().map((s) => (
            <button
              key={s.iso}
              type="button"
              onClick={() => setSlotIso(s.iso)}
              className={`flex w-full items-center justify-between rounded-input border px-3.5 py-2.5 text-sm transition-colors ${
                slotIso === s.iso
                  ? "border-rose bg-rose-bg text-rose-deep"
                  : "border-line bg-white/60 text-ink-soft hover:border-rose-pale"
              }`}
            >
              <span className="flex items-center gap-2">
                <Clock size={15} /> {s.label}
              </span>
              {slotIso === s.iso && <Check size={16} />}
            </button>
          ))}
        </div>
        <PrimaryButton className="w-full" disabled={busy} onClick={book}>
          {busy ? "Записываем…" : "Подтвердить запись"}
        </PrimaryButton>
      </BottomSheet>
    </div>
  );
}

function ApptCard({ appt, index, accent = false }: { appt: Appointment; index: number; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
    >
      <Card className={`p-4 ${accent ? "border-rose-pale/70" : ""} ${appt.status !== "upcoming" ? "opacity-75" : ""}`}>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
          <CalendarDays size={16} className="text-rose-deep" />
          {formatDateTime(appt.datetime)}
        </div>
        <p className="mb-1 text-sm text-ink">{appt.reason}</p>
        <p className="flex items-center gap-1.5 text-xs text-ink-soft">
          <Stethoscope size={13} /> {appt.doctorName}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft">
          <MapPin size={13} /> {appt.location}
        </p>
      </Card>
    </motion.div>
  );
}
