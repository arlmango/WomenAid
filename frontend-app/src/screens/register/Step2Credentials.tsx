import { Lock, Phone, User } from "lucide-react";
import type { RegisterFormState } from "./types";

export function Step2Credentials({
  form,
  update,
}: {
  form: RegisterFormState;
  update: (patch: Partial<RegisterFormState>) => void;
}) {
  const passwordsMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  return (
    <div className="space-y-3.5">
      <h2 className="mb-1 font-serif text-xl text-navy">Логин и пароль</h2>
      <p className="mb-4 text-sm text-ink-soft">Понадобятся при каждом входе в кабинет.</p>

      <div>
        <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Логин
        </label>
        <div className="relative">
          <User size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            id="username"
            required
            minLength={3}
            autoComplete="username"
            value={form.username}
            onChange={(e) => update({ username: e.target.value })}
            className="w-full rounded-input border-[1.5px] border-line bg-surface-2 py-2.5 pl-10 pr-3.5 text-base text-ink focus:border-indigo focus:outline-none focus:ring-3 focus:ring-indigo/15"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Пароль (минимум 8 символов)
        </label>
        <div className="relative">
          <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => update({ password: e.target.value })}
            className="w-full rounded-input border-[1.5px] border-line bg-surface-2 py-2.5 pl-10 pr-3.5 text-base text-ink focus:border-indigo focus:outline-none focus:ring-3 focus:ring-indigo/15"
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Повторите пароль
        </label>
        <div className="relative">
          <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            id="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => update({ confirmPassword: e.target.value })}
            className={`w-full rounded-input border-[1.5px] bg-surface-2 py-2.5 pl-10 pr-3.5 text-base text-ink focus:outline-none focus:ring-3 ${
              passwordsMismatch
                ? "border-urgent focus:border-urgent focus:ring-urgent/15"
                : "border-line focus:border-indigo focus:ring-indigo/15"
            }`}
          />
        </div>
        {passwordsMismatch && <p className="mt-1.5 text-xs text-urgent">Пароли не совпадают.</p>}
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Телефон (необязательно)
        </label>
        <div className="relative">
          <Phone size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="+7 700 000 00 00"
            className="w-full rounded-input border-[1.5px] border-line bg-surface-2 py-2.5 pl-10 pr-3.5 text-base text-ink focus:border-indigo focus:outline-none focus:ring-3 focus:ring-indigo/15"
          />
        </div>
      </div>
    </div>
  );
}

export function step2Valid(form: RegisterFormState): boolean {
  return (
    form.username.trim().length >= 3 &&
    form.password.length >= 8 &&
    form.password === form.confirmPassword
  );
}
