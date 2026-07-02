import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  Inbox,
  Maximize,
  RefreshCw,
  Siren,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useApiQuery } from "../../lib/useApiQuery";
import { apiPost, fetchPdfObjectUrl } from "../../lib/api";
import { useLanguage } from "../../i18n/LanguageContext";
import { Modal } from "../../components/Modal";
import { SkeletonRow, SkeletonCard } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { Button } from "../../components/ui";
import { SPRING_SOFT } from "../../lib/motion";
import { toast } from "../../lib/toast";
import type {
  ClinicOverviewResponse,
  QueueItem,
  QueueResponse,
  ReviewRequest,
  ReviewResponse,
} from "../../types/api";

const COLUMNS = [
  "queueColId",
  "queueColPatient",
  "queueColLabel",
  "queueColScore",
  "queueColConfidence",
  "queueColStatus",
  "queueColCreated",
] as const;

const TRIAGE_BADGE: Record<string, string> = {
  URGENT_REVIEW: "bg-gradient-to-br from-urgent to-rose-deep text-white font-bold",
  PRIORITY_REVIEW: "bg-lavender text-white",
  PENDING_REVIEW: "bg-gold text-navy",
  ROUTINE_FOLLOWUP: "bg-rose-bg text-rose-deep",
  INSUFFICIENT_QUALITY: "bg-surface-3 text-ink-soft",
};
const DEFAULT_TRIAGE_BADGE = "bg-surface-3 text-ink-soft";

// Mandatory on every AI triage view (CLAUDE.md + brand brief). Safety wording
// is deliberately NOT in the i18n toggle: it is always visible, bilingual,
// and never machine-translated. Bold warning color, top of the view.
function TriageDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-2.5 rounded-md border-2 border-gold-deep/60 bg-gold-bg ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <AlertTriangle size={compact ? 15 : 18} strokeWidth={2.5} className="mt-0.5 flex-none text-gold-deep" />
      <div className="text-xs leading-relaxed">
        <p className="font-display font-extrabold uppercase tracking-wide text-gold-deep">
          ⚠️ AI Decision Support Only — Clinical Validation Required. Not a diagnosis.
        </p>
        {!compact && (
          <p className="mt-0.5 font-semibold text-gold-deep/90">
            ИИ — только поддержка принятия решений. Требуется клиническая валидация. Не является диагнозом.
            Итоговое решение принимает врач.
          </p>
        )}
      </div>
    </div>
  );
}

// Stat tiles sit on flat cream, not the gradient — plain solid surface, not
// glass (glass only earns its cost over the backdrop). No leading number:
// these are parallel metrics, not an ordered sequence.
function StatCard({
  icon: Icon,
  label,
  value,
  badgeClassName,
  index = 0,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  badgeClassName: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SOFT, delay: index * 0.06 }}
      className="flex items-center gap-3 rounded-md border border-navy/20 bg-surface p-4 shadow-soft"
    >
      <span className={`grid h-10 w-10 flex-none place-items-center rounded-full ${badgeClassName}`}>
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <div>
        <p className="font-display text-xl font-extrabold text-ink">
          <AnimatedNumber value={value} />
        </p>
        <p className="text-xs text-ink-soft">{label}</p>
      </div>
    </motion.div>
  );
}

export function ClinicQueue() {
  const { t } = useLanguage();
  const { data, loading, refetch } = useApiQuery<QueueResponse>("/api/risk-assessment/clinic/queue");
  const { data: overview, loading: overviewLoading } = useApiQuery<ClinicOverviewResponse>(
    "/api/monitoring/clinic/overview",
  );
  const [selected, setSelected] = useState<QueueItem | null>(null);

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <TriageDisclaimer />

      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl uppercase tracking-tight text-navy">{t("queueTitle")}</h1>
        <Button type="button" variant="outline" size="sm" onClick={refetch}>
          <RefreshCw size={15} strokeWidth={2.25} />
          {t("queueRefresh")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-1 sm:grid-cols-4">
        {overviewLoading || !overview ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              icon={Users}
              label={t("statTotalPatients")}
              value={overview.total_patients}
              badgeClassName="bg-mint text-mint-deep"
              index={0}
            />
            <StatCard
              icon={Clock}
              label={t("statPendingReview")}
              value={overview.by_triage_label.PENDING_REVIEW ?? 0}
              badgeClassName="bg-gold text-navy"
              index={1}
            />
            <StatCard
              icon={Siren}
              label={t("statUrgent")}
              value={overview.by_triage_label.URGENT_REVIEW ?? 0}
              badgeClassName="bg-urgent text-white"
              index={2}
            />
            <StatCard
              icon={AlertTriangle}
              label={t("statRedFlags")}
              value={overview.active_red_flag_symptoms}
              badgeClassName="bg-lavender text-white"
              index={3}
            />
          </>
        )}
      </div>

      {!loading && items.length === 0 ? (
        <EmptyState icon={Inbox} caption={t("queueEmpty")} />
      ) : (
      <div className="overflow-x-auto rounded-md border border-navy/20 bg-surface shadow-soft">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-navy/20 bg-surface-2 text-left font-display text-[11px] font-extrabold uppercase tracking-wider text-ink-soft">
              {COLUMNS.map((col) => (
                <th key={col} className="whitespace-nowrap px-4 py-2.5">
                  {t(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} columns={COLUMNS.length} />)}

            {!loading &&
              items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="cursor-pointer border-t border-navy/10 hover:bg-surface-2"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-ink-soft">{item.id}</td>
                  <td className="whitespace-nowrap px-4 py-3">{item.patient_name ?? `#${item.patient_id}`}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-xs font-medium ${
                        TRIAGE_BADGE[item.triage_label] ?? DEFAULT_TRIAGE_BADGE
                      }`}
                    >
                      {item.triage_label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono">{item.raw_score ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono">{item.confidence ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-ink-soft">{item.model_status}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      )}

      <TriageDetailModal item={selected} onClose={() => setSelected(null)} onReviewed={refetch} />
    </div>
  );
}

const ZOOM_STEPS = [1, 1.5, 2, 3];

// Original-snapshot viewer with zoom. The image comes decrypted from the new
// clinician-only endpoint; when it can't load (retention purge, no file) the
// pane says so honestly instead of pretending.
function ImageViewer({ assessmentId }: { assessmentId: number }) {
  const { t } = useLanguage();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [zoomIdx, setZoomIdx] = useState(0);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;
    setUrl(null);
    setError(false);
    setZoomIdx(0);
    fetchPdfObjectUrl(`/api/risk-assessment/clinic/${assessmentId}/image`)
      .then((objectUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        revoked = objectUrl;
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [assessmentId]);

  const zoom = ZOOM_STEPS[zoomIdx];

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-[11px] font-extrabold uppercase tracking-wider text-ink-soft">
          {t("triageImageTitle")}
        </p>
        <div className="flex items-center gap-1">
          <span className="mr-1 font-mono text-xs text-ink-muted">{Math.round(zoom * 100)}%</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label={t("zoomOut")}
            title={t("zoomOut")}
            disabled={zoomIdx === 0 || !url}
            onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
          >
            <ZoomOut size={15} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label={t("zoomIn")}
            title={t("zoomIn")}
            disabled={zoomIdx === ZOOM_STEPS.length - 1 || !url}
            onClick={() => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
          >
            <ZoomIn size={15} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label={t("zoomReset")}
            title={t("zoomReset")}
            disabled={zoomIdx === 0 || !url}
            onClick={() => setZoomIdx(0)}
          >
            <Maximize size={15} />
          </Button>
        </div>
      </div>

      <div className="relative min-h-64 flex-1 overflow-auto rounded-md border border-navy/20 bg-navy">
        {url && (
          <div className="grid min-h-full w-full place-items-center p-2">
            <img
              src={url}
              alt={t("triageImageTitle")}
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              className="max-h-96 max-w-full object-contain transition-transform"
            />
          </div>
        )}
        {!url && !error && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-xs text-white/60">…</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <p className="text-xs leading-relaxed text-white/70">{t("triageImageLoadError")}</p>
          </div>
        )}
      </div>

      {/* Honesty note, not a limitation to hide: the current model is a
          RandomForest on classical image features — it produces no region
          heatmap, so no "AI-highlighted" overlay exists to show. */}
      <p className="text-[11px] leading-relaxed text-ink-muted">
        Модель не выделяет зоны внимания на снимке (RandomForest на классических признаках, не CNN) —
        визуализация областей недоступна.
      </p>
    </div>
  );
}

function TriageDetailModal({
  item,
  onClose,
  onReviewed,
}: {
  item: QueueItem | null;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const { t } = useLanguage();
  const [decision, setDecision] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitReview() {
    if (!item) return;
    setBusy(true);
    try {
      const payload: ReviewRequest = { decision, patient_id: item.patient_id, note };
      await apiPost<ReviewResponse>(`/api/risk-assessment/clinic/review/${item.id}`, payload);
      toast.success(t("reviewSubmit"));
      setDecision("");
      setNote("");
      onReviewed();
      onClose();
    } catch {
      // apiPost already toasted the error.
    } finally {
      setBusy(false);
    }
  }

  async function openPdf() {
    if (!item) return;
    try {
      const url = await fetchPdfObjectUrl(`/api/risk-assessment/clinic/${item.id}/report.pdf`);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // fetchPdfObjectUrl already toasted the error.
    }
  }

  return (
    <Modal wide open={item !== null} onClose={onClose} title={t("reviewTitle")}>
      {item && (
        <div className="space-y-4">
          <TriageDisclaimer compact />

          <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
            <ImageViewer assessmentId={item.id} />

            <div className="space-y-4">
              <span
                className={`inline-flex rounded-full px-3 py-1 font-mono text-sm font-medium ${
                  TRIAGE_BADGE[item.triage_label] ?? DEFAULT_TRIAGE_BADGE
                }`}
              >
                {item.triage_label}
              </span>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-ink-muted">{t("queueColPatient")}</dt>
                  <dd className="font-medium text-ink">{item.patient_name ?? `#${item.patient_id}`}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">{t("queueColCreated")}</dt>
                  <dd className="font-medium text-ink">{new Date(item.created_at).toLocaleString()}</dd>
                </div>
                {/* Clinician-only fields — never rendered on any /patient/* page. */}
                <div>
                  <dt className="text-ink-muted">{t("queueColScore")}</dt>
                  <dd className="font-mono font-medium text-ink">{item.raw_score ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">{t("queueColConfidence")}</dt>
                  <dd className="font-mono font-medium text-ink">{item.confidence ?? "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-ink-muted">{t("queueColStatus")}</dt>
                  <dd className="font-mono font-medium text-ink">{item.model_status}</dd>
                </div>
              </dl>

              {item.clinician_decision && (
                <div className="rounded-md border border-navy/20 bg-mint-bg p-3 text-sm text-ink">
                  <p className="mb-0.5 font-display text-xs font-extrabold uppercase tracking-wide text-mint-deep">
                    {t("reviewExistingDecision")}
                  </p>
                  {item.clinician_decision}
                </div>
              )}

              <Button type="button" variant="outline" onClick={openPdf} className="w-full">
                {t("reviewOpenPdf")}
              </Button>

              <div className="border-t border-navy/15 pt-4">
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">
                  {t("reviewDecisionLabel")}
                </label>
                <input
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="mb-3 w-full rounded-input border border-navy/20 bg-surface-2 px-3 py-2 text-sm focus:border-indigo focus:outline-none"
                />
                <label className="mb-1.5 block text-xs font-medium text-ink-soft">{t("reviewNoteLabel")}</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mb-3 w-full rounded-input border border-navy/20 bg-surface-2 px-3 py-2 text-sm focus:border-indigo focus:outline-none"
                />
                <Button
                  type="button"
                  variant="navy"
                  loading={busy}
                  disabled={busy || !decision}
                  onClick={submitReview}
                  className="w-full font-bold uppercase tracking-wide"
                >
                  {t("reviewSubmit")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
