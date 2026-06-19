import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Centered, desktop-style modal — used by the clinic cabinet (review,
// raw_score/confidence detail). Patient flows use <BottomSheet/> instead.
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card border border-white/60 bg-white/85 p-6 shadow-soft backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-serif text-xl text-ink">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-2 py-1 text-ink-soft hover:bg-surface-2"
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
