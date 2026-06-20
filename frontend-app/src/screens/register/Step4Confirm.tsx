import { CalendarDays, MapPin, Phone, ShieldCheck, User } from "lucide-react";
import type { RegisterFormState } from "./types";

export function Step4Confirm({ form }: { form: RegisterFormState }) {
  return (
    <div className="space-y-4">
      <h2 className="mb-1 font-serif text-xl text-navy">Проверьте данные</h2>
      <p className="mb-4 text-sm text-ink-soft">Всё верно? Нажмите «Создать аккаунт» ниже.</p>

      <dl className="space-y-3 rounded-card border border-line bg-surface-2 p-4 text-sm">
        <Row icon={User} label="Имя" value={form.displayName} />
        <Row icon={CalendarDays} label="Дата рождения" value={form.birthDate} />
        {form.region && <Row icon={MapPin} label="Регион" value={form.region} />}
        {form.phone && <Row icon={Phone} label="Телефон" value={form.phone} />}
        <Row icon={User} label="Логин" value={form.username} />
      </dl>

      <div className="flex items-center gap-2 rounded-card border border-line bg-mint-bg p-3 text-sm text-mint-deep">
        <ShieldCheck size={18} className="flex-none" />
        Согласие на участие подтверждено.
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-ink-muted">
        <Icon size={14} /> {label}
      </dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
