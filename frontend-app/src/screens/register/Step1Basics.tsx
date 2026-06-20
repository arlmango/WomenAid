import { User, CalendarDays, MapPin } from "lucide-react";
import type { RegisterFormState } from "./types";

export function Step1Basics({
  form,
  update,
}: {
  form: RegisterFormState;
  update: (patch: Partial<RegisterFormState>) => void;
}) {
  return (
    <div className="space-y-3.5">
      <h2 className="mb-1 font-serif text-xl text-navy">Расскажите о себе</h2>
      <p className="mb-4 text-sm text-ink-soft">Эти данные видны только вам и вашему врачу.</p>

      <div>
        <label htmlFor="displayName" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Имя (как к вам обращаться)
        </label>
        <div className="relative">
          <User size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            id="displayName"
            required
            value={form.displayName}
            onChange={(e) => update({ displayName: e.target.value })}
            className="w-full rounded-input border border-line bg-surface-2 py-2.5 pl-10 pr-3.5 text-base text-ink focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/15"
          />
        </div>
      </div>

      <div>
        <label htmlFor="birthDate" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Дата рождения
        </label>
        <div className="relative">
          <CalendarDays size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            id="birthDate"
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            value={form.birthDate}
            onChange={(e) => update({ birthDate: e.target.value })}
            className="w-full rounded-input border border-line bg-surface-2 py-2.5 pl-10 pr-3.5 text-base text-ink focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/15"
          />
        </div>
      </div>

      <div>
        <label htmlFor="region" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Регион (необязательно)
        </label>
        <div className="relative">
          <MapPin size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            id="region"
            value={form.region}
            onChange={(e) => update({ region: e.target.value })}
            placeholder="например, Алматы"
            className="w-full rounded-input border border-line bg-surface-2 py-2.5 pl-10 pr-3.5 text-base text-ink focus:border-teal focus:outline-none focus:ring-3 focus:ring-teal/15"
          />
        </div>
      </div>
    </div>
  );
}

export function step1Valid(form: RegisterFormState): boolean {
  if (!form.displayName.trim()) return false;
  if (!form.birthDate) return false;
  return new Date(form.birthDate) <= new Date();
}
