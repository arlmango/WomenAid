import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

// Centered, desktop-style modal — used by the clinic cabinet (review,
// raw_score/confidence detail). Patient flows use <BottomSheet/> instead.
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Wider layout for the triage detail split view. */
  wide?: boolean;
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
            className={`max-h-[90vh] w-full overflow-y-auto rounded-card border border-navy/20 bg-surface p-6 shadow-soft ${
              wide ? "max-w-4xl" : "max-w-lg"
            }`}
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
                className="grid h-8 w-8 flex-none place-items-center rounded-full text-ink-soft hover:bg-surface-2"
                aria-label="Закрыть"
              >
                <X size={18} strokeWidth={2.25} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
