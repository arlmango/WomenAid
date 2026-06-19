import { useRef, useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, FileImage, RotateCcw, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { mockApi } from "../../lib/mockApi";
import { CURRENT_PATIENT_ID } from "../../data/fixtures";
import { TRIAGE_META } from "../../lib/labels";
import { Card, Disclaimer, ModelStatusBadge, PrimaryButton } from "../../components/ui";
import type { UploadResult } from "../../lib/types";

type Phase = "idle" | "picked" | "analyzing" | "done";

export function PatientUpload() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileName(f ? f.name : "cervix-demo.jpg");
    setPhase("picked");
  }

  function useSample() {
    setFileName("cervix-demo.jpg");
    setPhase("picked");
  }

  async function analyze() {
    setPhase("analyzing");
    const res = await mockApi.uploadImage(CURRENT_PATIENT_ID, fileName || "cervix-demo.jpg");
    setResult(res);
    setPhase("done");
  }

  function reset() {
    setResult(null);
    setFileName("");
    setPhase("idle");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-xl text-ink">Загрузка снимка</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-mint-bg px-2.5 py-0.5 text-[11px] font-semibold text-mint-deep">
          <ShieldCheck size={11} strokeWidth={2.5} /> Согласие активно
        </span>
      </div>

      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />

      <Card className="overflow-hidden p-5">
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2.5 rounded-card border-2 border-dashed border-rose-pale bg-rose-bg/40 px-5 py-8 text-center transition-colors hover:bg-rose-bg/70"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-rose to-blush text-white shadow-btn">
                  <Camera size={22} strokeWidth={2.25} />
                </span>
                <span className="font-semibold text-rose-deep">Выбрать снимок</span>
                <span className="text-xs text-ink-muted">JPEG или PNG с камеры/галереи</span>
              </button>
              <button
                type="button"
                onClick={useSample}
                className="w-full text-center text-xs font-medium text-ink-soft underline-offset-2 hover:underline"
              >
                Использовать демо-снимок
              </button>
            </motion.div>
          )}

          {phase === "picked" && (
            <motion.div
              key="picked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2.5 rounded-input bg-surface-2 px-3.5 py-2.5">
                <FileImage size={18} className="flex-none text-rose-deep" />
                <p className="truncate text-sm text-ink-soft">{fileName}</p>
              </div>
              <PrimaryButton className="w-full" onClick={analyze}>
                <Sparkles size={16} /> Отправить на анализ
              </PrimaryButton>
            </motion.div>
          )}

          {phase === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <div className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-card bg-surface-2">
                <ScanLine size={40} className="text-rose-pale" />
                <motion.div
                  className="absolute inset-x-0 h-0.5 bg-rose shadow-[0_0_12px_2px_var(--color-rose)]"
                  initial={{ top: "8%" }}
                  animate={{ top: ["8%", "92%", "8%"] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <p className="text-sm font-medium text-ink-soft">AI анализирует снимок…</p>
            </motion.div>
          )}

          {phase === "done" && result && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {(() => {
                const meta = TRIAGE_META[result.triageLabel];
                return (
                  <div className="flex items-center gap-3">
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 16 }}
                      className={`grid h-12 w-12 flex-none place-items-center rounded-full ${meta.badge}`}
                    >
                      <meta.Icon size={22} strokeWidth={2.25} />
                    </motion.span>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                        Результат триажа
                      </p>
                      <p className="font-serif text-lg text-ink">{meta.ru}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="rounded-input border-l-3 border-rose-pale bg-surface-2 p-3 text-sm text-ink">
                {result.patientFacingMessage}
              </div>

              <Disclaimer text={result.disclaimer} />
              <ModelStatusBadge compact />

              <button
                type="button"
                onClick={reset}
                className="flex w-full items-center justify-center gap-2 rounded-btn border-[1.5px] border-rose-pale bg-white/60 py-2.5 text-sm font-semibold text-rose-deep transition-colors hover:bg-rose-bg"
              >
                <RotateCcw size={15} /> Загрузить другой снимок
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {phase !== "done" && (
        <div className="space-y-2">
          <Disclaimer text="Результат AI — вспомогательная маршрутизация, не диагноз. Финальное решение принимает врач." />
        </div>
      )}
    </div>
  );
}
