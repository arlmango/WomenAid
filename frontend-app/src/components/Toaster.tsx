import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { toast, type ToastMessage } from "../lib/toast";

const KIND = {
  success: { cls: "bg-mint-bg text-mint-deep", Icon: CheckCircle2 },
  error: { cls: "bg-urgent-bg text-urgent", Icon: XCircle },
  info: { cls: "bg-lavender-bg text-lavender-deep", Icon: Info },
} as const;

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  useEffect(() => toast.subscribe(setToasts), []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:items-end sm:px-5">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { cls, Icon } = KIND[t.kind];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              onClick={() => toast.dismiss(t.id)}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-card border-[1.5px] border-line px-4 py-3 text-sm font-medium shadow-soft ${cls}`}
            >
              <Icon size={18} className="mt-0.5 flex-none" />
              <span>{t.text}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
