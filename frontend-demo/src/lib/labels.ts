import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarX,
  Clock,
  ImageOff,
  Info,
  Siren,
  type LucideIcon,
} from "lucide-react";
import type { ScreeningStatus, TriageLabel } from "./types";

export interface Meta {
  ru: string;
  short: string;
  Icon: LucideIcon;
  // Tailwind classes for a soft tinted badge.
  badge: string;
  // Solid accent for rings / bars.
  accent: string;
}

export const TRIAGE_META: Record<TriageLabel, Meta> = {
  URGENT_REVIEW: {
    ru: "Срочный просмотр",
    short: "Срочно",
    Icon: Siren,
    badge: "bg-urgent-bg text-urgent",
    accent: "var(--color-urgent)",
  },
  PRIORITY_REVIEW: {
    ru: "Приоритетный просмотр",
    short: "Приоритет",
    Icon: AlertTriangle,
    badge: "bg-lavender-bg text-lavender-deep",
    accent: "var(--color-lavender)",
  },
  PENDING_REVIEW: {
    ru: "Ожидает ревью врача",
    short: "Ждёт ревью",
    Icon: Clock,
    badge: "bg-peach-bg text-peach-deep",
    accent: "var(--color-peach)",
  },
  ROUTINE_FOLLOWUP: {
    ru: "Плановое наблюдение",
    short: "Плановое",
    Icon: Info,
    badge: "bg-rose-bg text-rose-deep",
    accent: "var(--color-rose)",
  },
  INSUFFICIENT_QUALITY: {
    ru: "Недостаточное качество снимка",
    short: "Качество",
    Icon: ImageOff,
    badge: "bg-surface-3 text-ink-soft",
    accent: "var(--color-ink-muted)",
  },
};

export const SCREENING_META: Record<ScreeningStatus, Meta & { progress: number }> = {
  UP_TO_DATE: {
    ru: "Скрининг актуален",
    short: "По графику",
    Icon: CalendarCheck,
    badge: "bg-mint-bg text-mint-deep",
    accent: "var(--color-mint)",
    progress: 0.25,
  },
  DUE_SOON: {
    ru: "Скрининг скоро понадобится",
    short: "Скоро",
    Icon: CalendarClock,
    badge: "bg-peach-bg text-peach-deep",
    accent: "var(--color-peach)",
    progress: 0.8,
  },
  OVERDUE: {
    ru: "Скрининг просрочен",
    short: "Просрочен",
    Icon: CalendarX,
    badge: "bg-urgent-bg text-urgent",
    accent: "var(--color-urgent)",
    progress: 1,
  },
  NOT_YET_ELIGIBLE: {
    ru: "Пока не входит в программу по возрасту",
    short: "Не по возрасту",
    Icon: CalendarDays,
    badge: "bg-surface-3 text-ink-soft",
    accent: "var(--color-ink-muted)",
    progress: 0,
  },
  OUT_OF_PROGRAM_AGE: {
    ru: "Вне возрастных рамок программы",
    short: "Вне программы",
    Icon: CalendarDays,
    badge: "bg-surface-3 text-ink-soft",
    accent: "var(--color-ink-muted)",
    progress: 0,
  },
};

const MONTHS = [
  "янв", "фев", "мар", "апр", "мая", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(iso)}, ${hh}:${mm}`;
}
