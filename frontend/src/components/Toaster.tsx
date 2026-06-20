import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast, type ToastMessage } from "../lib/toast";

const KIND_STYLES: Record<ToastMessage["kind"], string> = {
  success: "border-line bg-mint-bg text-ink",
  error: "border-line bg-urgent-bg text-urgent",
  info: "border-line bg-rose-bg text-ink",
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => toast.subscribe(setToasts), []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:items-end sm:px-5">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={`pointer-events-auto w-full max-w-sm rounded-card border-[1.5px] px-4 py-3 text-sm font-medium shadow-soft ${KIND_STYLES[t.kind]}`}
            onClick={() => toast.dismiss(t.id)}
            role="status"
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
