import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertOctagon,
  ArrowLeft,
  CalendarDays,
  FileText,
  Stethoscope,
  User,
} from "lucide-react";
import { mockApi } from "../../lib/mockApi";
import { useAsync } from "../../lib/useAsync";
import { SCREENING_META, TRIAGE_META, formatDate, formatDateTime } from "../../lib/labels";
import { SkeletonCard } from "../../components/Skeleton";
import { Card } from "../../components/ui";
import { ReportModal } from "./ReportModal";
import type { RiskAssessment } from "../../lib/types";

export function ClinicPatient() {
  const { id } = useParams();
  const patientId = Number(id);

  const { data: patient, loading } = useAsync(() => mockApi.getPatient(patientId), [patientId]);
  const { data: symptoms } = useAsync(() => mockApi.getSymptoms(patientId), [patientId]);
  const { data: queue, refetch } = useAsync(() => mockApi.getQueue(), [patientId]);

  const assessments = (queue ?? []).filter((a) => a.patientId === patientId);
  const [report, setReport] = useState<RiskAssessment | null>(null);

  return (
    <div className="space-y-5">
      <Link
        to="/clinic"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-rose-deep"
      >
        <ArrowLeft size={16} /> К очереди
      </Link>

      {loading || !patient ? (
        <SkeletonCard />
      ) : (
        (() => {
          const meta = SCREENING_META[patient.screeningStatus];
          return (
            <Card className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-gradient-to-br from-rose to-blush font-serif text-2xl text-white shadow-btn">
                    {patient.fullName.charAt(0)}
                  </span>
                  <div>
                    <h1 className="font-serif text-2xl text-ink">{patient.fullName}</h1>
                    <p className="mt-0.5 flex items-center gap-3 text-sm text-ink-soft">
                      <span className="flex items-center gap-1">
                        <User size={14} /> {patient.age} лет · ID {patient.id}
                      </span>
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${meta.badge}`}>
                  <meta.Icon size={15} strokeWidth={2.25} />
                  {meta.short}
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm sm:grid-cols-3">
                <Field label="Статус скрининга" value={meta.ru} />
                <Field label="Последний скрининг" value={formatDate(patient.lastScreeningDate)} />
                <Field label="Следующий срок" value={formatDate(patient.nextDueDate)} />
                <Field
                  label="Согласие на AI-анализ"
                  value={patient.consentGiven ? "Активно" : "Не получено"}
                  accent={patient.consentGiven ? "text-mint-deep" : "text-urgent"}
                />
              </dl>
            </Card>
          );
        })()
      )}

      {/* Assessments */}
      <section>
        <h2 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Снимки и триаж
        </h2>
        {assessments.length === 0 ? (
          <Card className="p-5 text-sm text-ink-soft">Снимков пока нет.</Card>
        ) : (
          <div className="space-y-2.5">
            {assessments.map((a, i) => {
              const meta = TRIAGE_META[a.triageLabel];
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                >
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-10 w-10 flex-none place-items-center rounded-full ${meta.badge}`}>
                        <meta.Icon size={18} strokeWidth={2.25} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{meta.ru}</p>
                        <p className="text-xs text-ink-soft">
                          {formatDateTime(a.createdAt)} · raw_score {a.rawScore ?? "—"} · confidence{" "}
                          {a.confidence ?? "—"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReport(a)}
                      className="flex items-center gap-1.5 rounded-btn border border-rose-pale px-3 py-2 text-xs font-semibold text-rose-deep hover:bg-rose-bg"
                    >
                      <FileText size={14} /> Отчёт
                    </button>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Symptoms */}
      <section>
        <h2 className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Дневник симптомов
        </h2>
        {!symptoms || symptoms.length === 0 ? (
          <Card className="p-5 text-sm text-ink-soft">Записей нет.</Card>
        ) : (
          <div className="space-y-2.5">
            {symptoms.map((s) => (
              <Card key={s.id} className={`p-4 ${s.isRedFlag ? "border-urgent/40" : ""}`}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <CalendarDays size={13} /> {formatDate(s.reportedAt)}
                  </span>
                  {s.isRedFlag && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-urgent-bg px-2 py-0.5 text-[11px] font-semibold text-urgent">
                      <AlertOctagon size={11} strokeWidth={2.5} /> Red-flag
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink">{s.text}</p>
                <p className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${s.isRedFlag ? "text-urgent" : "text-mint-deep"}`}>
                  <Stethoscope size={13} /> {s.recommendation}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ReportModal
        assessment={report}
        patientName={patient?.fullName ?? ""}
        patientAge={patient?.age ?? null}
        onClose={() => setReport(null)}
        onReviewed={() => {
          refetch();
        }}
      />
    </div>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className={`mt-0.5 font-medium ${accent ?? "text-ink"}`}>{value}</dd>
    </div>
  );
}
