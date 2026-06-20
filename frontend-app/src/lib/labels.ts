import { CalendarCheck, CalendarClock, CalendarDays, CalendarX, type LucideIcon } from "lucide-react";

interface StatusMeta {
  ru: string;
  Icon: LucideIcon;
  iconClassName: string;
  progress: number;
}

// Mirrors backend/app/models/screening_rules.py::SCREENING_STATUSES — purely
// presentational mapping, no clinical logic invented here.
export const SCREENING_META: Record<string, StatusMeta> = {
  UP_TO_DATE: { ru: "Скрининг актуален", Icon: CalendarCheck, iconClassName: "bg-mint-bg text-mint-deep", progress: 0.25 },
  DUE_SOON: { ru: "Скрининг скоро понадобится", Icon: CalendarClock, iconClassName: "bg-gold-bg text-gold-deep", progress: 0.8 },
  OVERDUE: { ru: "Скрининг просрочен", Icon: CalendarX, iconClassName: "bg-urgent text-white", progress: 1 },
  NOT_YET_ELIGIBLE: {
    ru: "Пока не входит в программу по возрасту",
    Icon: CalendarDays,
    iconClassName: "bg-surface-3 text-ink-soft",
    progress: 0,
  },
  OUT_OF_PROGRAM_AGE: {
    ru: "Вне возрастных рамок программы",
    Icon: CalendarDays,
    iconClassName: "bg-surface-3 text-ink-soft",
    progress: 0,
  },
};

export const DEFAULT_SCREENING_META: StatusMeta = {
  ru: "Статус неизвестен",
  Icon: CalendarDays,
  iconClassName: "bg-surface-3 text-ink-soft",
  progress: 0,
};

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU");
}
