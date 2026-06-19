import type { ReactNode } from "react";
import { FlaskConical, ShieldAlert } from "lucide-react";

// Glassmorphism card — the base surface used everywhere.
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-white/60 bg-white/80 shadow-soft backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

// CLAUDE.md invariant, kept first-class & visible (NOT hidden in fine print):
// the model has not passed clinical validation. Shown on every AI surface.
export function ModelStatusBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Badge className="bg-lavender-bg text-lavender-deep">
        <FlaskConical size={11} strokeWidth={2.5} />
        DEMO · NOT_CLINICALLY_VALIDATED
      </Badge>
    );
  }
  return (
    <div className="flex gap-3 rounded-card border border-lavender/40 bg-lavender-bg/70 p-4 backdrop-blur-sm">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-lavender-bg text-lavender-deep">
        <FlaskConical size={17} strokeWidth={2.25} />
      </span>
      <div>
        <Badge className="mb-1 bg-white/70 text-lavender-deep">DEMO · NOT_CLINICALLY_VALIDATED</Badge>
        <p className="text-sm text-ink-soft">
          Демо-модель обучена на синтетических данных и не прошла клиническую
          валидацию. Используется только для демонстрации продукта.
        </p>
      </div>
    </div>
  );
}

// Shown on every AI result: this is decision-support, not a diagnosis.
export function Disclaimer({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-input border-l-3 border-rose-pale bg-surface-2 p-3 text-xs leading-relaxed text-ink-soft">
      <ShieldAlert size={15} className="mt-0.5 flex-none text-rose-deep" />
      <span>{text}</span>
    </div>
  );
}

// Footer note: the patient data is synthetic/demonstrative.
export function SyntheticDataNote() {
  return (
    <p className="text-center text-[11px] leading-relaxed text-ink-muted">
      Данные пациенток в этой демонстрации — синтетические, для показа продукта.
      Реальные персональные или клинические данные не используются.
    </p>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-btn bg-gradient-to-br from-rose to-blush px-5 font-semibold text-white shadow-btn transition-all hover:shadow-btn-hover active:translate-y-px disabled:cursor-not-allowed disabled:from-rose-pale disabled:to-rose-pale disabled:shadow-none ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-btn border-[1.5px] border-rose-pale bg-white/60 px-5 text-sm font-semibold text-rose-deep transition-colors hover:bg-rose-bg ${className}`}
    >
      {children}
    </button>
  );
}
