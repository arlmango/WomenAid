import { useState } from "react";
import { AlertTriangle, Clock, Inbox, RefreshCw, Siren, Users } from "lucide-react";
import { useApiQuery } from "../../lib/useApiQuery";
import { apiPost, fetchPdfObjectUrl } from "../../lib/api";
import { useLanguage } from "../../i18n/LanguageContext";
import { Modal } from "../../components/Modal";
import { SkeletonRow, SkeletonCard } from "../../components/Skeleton";
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

const STAT_NUMBER_GRADIENTS = ["from-gold to-pink", "from-pink to-magenta"];

function StatCard({
  icon: Icon,
  label,
  value,
  badgeClassName,
  index,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  badgeClassName: string;
  index: number;
}) {
  return (
    <div className="relative">
      <span
        className={`absolute -top-3 left-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br ${STAT_NUMBER_GRADIENTS[index % 2]} text-[11px] font-bold text-white shadow-btn`}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex items-center gap-3 rounded-card-sharp border-[1.5px] border-line bg-surface p-4 pt-5">
        <span className={`grid h-10 w-10 flex-none place-items-center rounded-full ${badgeClassName}`}>
          <Icon size={18} strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-xl font-semibold text-ink">{value}</p>
          <p className="text-xs text-ink-soft">{label}</p>
        </div>
      </div>
    </div>
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">{t("queueTitle")}</h1>
        <button
          type="button"
          onClick={refetch}
          className="flex items-center gap-2 rounded-btn border-2 border-navy px-3.5 py-2 text-sm font-semibold text-navy hover:bg-surface-2"
        >
          <RefreshCw size={15} strokeWidth={2.25} />
          {t("queueRefresh")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-3 sm:grid-cols-4">
        {overviewLoading || !overview ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              index={0}
              icon={Users}
              label={t("statTotalPatients")}
              value={overview.total_patients}
              badgeClassName="bg-mint text-mint-deep"
            />
            <StatCard
              index={1}
              icon={Clock}
              label={t("statPendingReview")}
              value={overview.by_triage_label.PENDING_REVIEW ?? 0}
              badgeClassName="bg-gold text-navy"
            />
            <StatCard
              index={2}
              icon={Siren}
              label={t("statUrgent")}
              value={overview.by_triage_label.URGENT_REVIEW ?? 0}
              badgeClassName="bg-urgent text-white"
            />
            <StatCard
              index={3}
              icon={AlertTriangle}
              label={t("statRedFlags")}
              value={overview.active_red_flag_symptoms}
              badgeClassName="bg-lavender text-white"
            />
          </>
        )}
      </div>

      <div className="overflow-x-auto rounded-card border-[1.5px] border-line bg-surface shadow-soft">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b-[1.5px] border-line bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
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

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-lavender-bg text-lavender-deep">
                      <Inbox size={26} strokeWidth={2} />
                    </span>
                    <p className="font-medium text-ink">{t("queueEmpty")}</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="cursor-pointer border-t border-line hover:bg-surface-3"
                >
                  <td className="whitespace-nowrap px-4 py-3">{item.id}</td>
                  <td className="whitespace-nowrap px-4 py-3">{item.patient_name ?? `#${item.patient_id}`}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        TRIAGE_BADGE[item.triage_label] ?? DEFAULT_TRIAGE_BADGE
                      }`}
                    >
                      {item.triage_label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{item.raw_score ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3">{item.confidence ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{item.model_status}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <ReviewModal item={selected} onClose={() => setSelected(null)} onReviewed={refetch} />
    </div>
  );
}

function ReviewModal({
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
    <Modal open={item !== null} onClose={onClose} title={t("reviewTitle")}>
      {item && (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-ink-muted">{t("queueColLabel")}</dt>
              <dd className="font-semibold text-ink">{item.triage_label}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{t("queueColStatus")}</dt>
              <dd className="font-semibold text-ink">{item.model_status}</dd>
            </div>
            {/* Clinician-only fields — never rendered on any /patient/* page. */}
            <div>
              <dt className="text-ink-muted">{t("queueColScore")}</dt>
              <dd className="font-semibold text-ink">{item.raw_score ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{t("queueColConfidence")}</dt>
              <dd className="font-semibold text-ink">{item.confidence ?? "—"}</dd>
            </div>
          </dl>

          {item.clinician_decision && (
            <div className="rounded-input border-[1.5px] border-line bg-mint-bg p-3 text-sm text-ink">
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-mint-deep">
                {t("reviewExistingDecision")}
              </p>
              {item.clinician_decision}
            </div>
          )}

          <button
            type="button"
            onClick={openPdf}
            className="min-h-10 w-full rounded-btn border-2 border-navy text-sm font-semibold text-navy hover:bg-surface-2"
          >
            {t("reviewOpenPdf")}
          </button>

          <div className="border-t-[1.5px] border-line pt-4">
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              {t("reviewDecisionLabel")}
            </label>
            <input
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="mb-3 w-full rounded-input border-[1.5px] border-line bg-surface-2 px-3 py-2 text-sm focus:border-indigo focus:outline-none"
            />
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">{t("reviewNoteLabel")}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mb-3 w-full rounded-input border-[1.5px] border-line bg-surface-2 px-3 py-2 text-sm focus:border-indigo focus:outline-none"
            />
            <button
              type="button"
              disabled={busy || !decision}
              onClick={submitReview}
              className="min-h-10 w-full rounded-btn bg-gradient-to-br from-pink to-magenta text-sm font-bold uppercase tracking-wide text-white shadow-btn disabled:from-rose-pale disabled:to-rose-pale disabled:shadow-none"
            >
              {t("reviewSubmit")}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
