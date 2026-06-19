import type { LucideIcon } from "lucide-react";

// Shared "nothing here yet" card — used by the patient stub pages
// (symptoms/schedule, both real backend STUB endpoints) and the clinic
// queue when it's empty. Renders an icon + caption + the backend's own
// detail string, never fabricated content.
export function EmptyState({
  icon: Icon,
  caption,
  detail,
  badgeClassName = "bg-lavender-bg text-[#6a3d8a]",
}: {
  icon: LucideIcon;
  caption: string;
  detail?: string | null;
  badgeClassName?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-white/60 bg-white/80 p-8 text-center shadow-soft backdrop-blur-sm">
      <span className={`grid h-14 w-14 place-items-center rounded-full ${badgeClassName}`}>
        <Icon size={26} strokeWidth={2} />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{caption}</p>
        {detail && <p className="mt-1.5 text-sm text-ink-soft">{detail}</p>}
      </div>
    </div>
  );
}
