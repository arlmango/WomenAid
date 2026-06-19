import { useState } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, NotebookText, Send } from "lucide-react";
import { mockApi } from "../../lib/mockApi";
import { useAsync } from "../../lib/useAsync";
import { CURRENT_PATIENT_ID } from "../../data/fixtures";
import { formatDate } from "../../lib/labels";
import { SkeletonCard } from "../../components/Skeleton";
import { Card, PrimaryButton } from "../../components/ui";
import { toast } from "../../lib/toast";
import type { LucideIcon } from "lucide-react";

// Quick-add chips — one is intentionally a red-flag phrase so the demo can
// show the "always see a doctor" rule live.
const CHIPS = [
  "тянущие боли внизу живота",
  "общая слабость",
  "кровотечение после полового акта",
];

export function PatientSymptoms() {
  const { data: symptoms, loading, refetch } = useAsync(() =>
    mockApi.getSymptoms(CURRENT_PATIENT_ID),
  );
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const entry = await mockApi.addSymptom(CURRENT_PATIENT_ID, trimmed);
      setText("");
      refetch();
      if (entry.isRedFlag) toast.error(`Тревожный симптом: ${entry.recommendation}`);
      else toast.success(`Записано: ${entry.recommendation}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-xl text-ink">Дневник симптомов</h1>

      <Card className="p-5">
        <label htmlFor="symptom" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Что вас беспокоит?
        </label>
        <textarea
          id="symptom"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Опишите симптом своими словами…"
          className="mb-3 w-full rounded-input border-[1.5px] border-line bg-[#fffafc] px-3.5 py-2.5 text-sm text-ink focus:border-rose focus:outline-none focus:ring-3 focus:ring-rose/10"
        />
        <div className="mb-3 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setText(c)}
              className="rounded-full border border-line bg-white/60 px-3 py-1 text-xs text-ink-soft transition-colors hover:border-rose-pale hover:text-rose-deep"
            >
              {c}
            </button>
          ))}
        </div>
        <PrimaryButton className="w-full" disabled={busy || !text.trim()} onClick={() => submit(text)}>
          <Send size={16} /> Записать
        </PrimaryButton>
      </Card>

      {loading ? (
        <SkeletonCard />
      ) : !symptoms || symptoms.length === 0 ? (
        <EmptyDiary />
      ) : (
        <ul className="space-y-2.5">
          {symptoms.map((s, i) => (
            <motion.li
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className={`rounded-card border bg-white/80 p-4 shadow-soft backdrop-blur-sm ${
                s.isRedFlag ? "border-urgent/40" : "border-white/60"
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs text-ink-muted">{formatDate(s.reportedAt)}</span>
                {s.isRedFlag && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-urgent-bg px-2 py-0.5 text-[11px] font-semibold text-urgent">
                    <AlertOctagon size={11} strokeWidth={2.5} /> Red-flag
                  </span>
                )}
              </div>
              <p className="text-sm text-ink">{s.text}</p>
              <p
                className={`mt-1.5 text-xs font-medium ${
                  s.isRedFlag ? "text-urgent" : "text-mint-deep"
                }`}
              >
                {s.recommendation}
              </p>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyDiary() {
  const Icon: LucideIcon = NotebookText;
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-white/60 bg-white/80 p-8 text-center shadow-soft backdrop-blur-sm">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-lavender-bg text-lavender-deep">
        <Icon size={26} strokeWidth={2} />
      </span>
      <p className="text-sm text-ink-soft">Записей пока нет. Добавьте первую выше.</p>
    </div>
  );
}
