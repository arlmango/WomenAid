import type { ChangeEvent, InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

interface FieldInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  icon: LucideIcon;
  onChange: (value: string) => void;
}

// Labeled input with a leading icon — shared by the login/register forms
// (5 near-identical fields between the two) so the icon+focus-ring treatment
// stays in one place.
export function FieldInput({ label, icon: Icon, id, onChange, ...inputProps }: FieldInputProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <Icon size={17} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          id={id}
          onChange={handleChange}
          className="w-full rounded-input border-[1.5px] border-line bg-[#fffafc] py-2.5 pl-10 pr-3.5 text-base text-ink focus:border-rose focus:outline-none focus:ring-3 focus:ring-rose/10"
          {...inputProps}
        />
      </div>
    </div>
  );
}
