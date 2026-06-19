import { useState } from "react";
import { Inbox, RefreshCw } from "lucide-react";
import { useApiQuery } from "../../lib/useApiQuery";
import { apiPost, fetchPdfObjectUrl } from "../../lib/api";
import { useLanguage } from "../../i18n/LanguageContext";
import { Modal } from "../../components/Modal";
import { SkeletonRow } from "../../components/Skeleton";
import { toast } from "../../lib/toast";
import type { QueueItem, QueueResponse, ReviewRequest, ReviewResponse } from "../../types/api";

const COLUMNS = [
  "queueColId",
  "queueColPatient",
  "queueColLabel",
  "queueColScore",
  "queueColConfidence",
  "queueColStatus",
  "queueColCreated",
] as const;

export function ClinicQueue() {
  const { t } = useLanguage();
  const { data, loading, refetch } = useApiQuery<QueueResponse>("/api/risk-assessment/clinic/queue");
  const [selected, setSelected] = useState<QueueItem | null>(null);

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-ink">{t("queueTitle")}</h1>
        <button
          type="button"
          onClick={refetch}
          className="flex items-center gap-2 rounded-btn border border-rose-pale px-3.5 py-2 text-sm font-semibold text-rose-deep hover:bg-rose-bg"
        >
          <RefreshCw size={15} strokeWidth={2.25} />
          {t("queueRefresh")}
        </button>
      </div>

      <div className="overflow-x-auto rounded-card border border-white/60 bg-white/80 shadow-soft backdrop-blur-sm">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2/70 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
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
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-lavender-bg text-[#6a3d8a]">
                      <Inbox size={26} strokeWidth={2} />
                    </span>
                    <div>
                      <p className="font-medium text-ink">{t("queueEmpty")}</p>
                      {data?.detail && <p className="mt-1 text-xs text-ink-muted">{data.detail}</p>}
                    </div>
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
                    <span className="rounded-full bg-rose-bg px-2 py-0.5 text-xs font-semibold text-rose-deep">
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

          <button
            type="button"
            onClick={openPdf}
            className="min-h-10 w-full rounded-btn border border-rose-pale text-sm font-semibold text-rose-deep hover:bg-rose-bg"
          >
            {t("reviewOpenPdf")}
          </button>

          <div className="border-t border-line pt-4">
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">
              {t("reviewDecisionLabel")}
            </label>
            <input
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="mb-3 w-full rounded-input border-[1.5px] border-line bg-[#fffafc] px-3 py-2 text-sm focus:border-rose focus:outline-none"
            />
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">{t("reviewNoteLabel")}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mb-3 w-full rounded-input border-[1.5px] border-line bg-[#fffafc] px-3 py-2 text-sm focus:border-rose focus:outline-none"
            />
            <button
              type="button"
              disabled={busy || !decision}
              onClick={submitReview}
              className="min-h-10 w-full rounded-btn bg-gradient-to-br from-rose to-blush text-sm font-semibold text-white shadow-btn disabled:from-rose-pale disabled:to-rose-pale disabled:shadow-none"
            >
              {t("reviewSubmit")}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
