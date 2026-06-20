import { useLanguage } from "../i18n/LanguageContext";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="inline-flex gap-1 rounded-full border-[1.5px] border-line bg-surface-2 p-[3px]"
      role="group"
      aria-label="Язык интерфейса / Интерфейс тілі"
    >
      {(["ru", "kz"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`min-h-[30px] rounded-full px-3 text-xs font-semibold uppercase transition-colors ${
            lang === code
              ? "bg-gradient-to-br from-pink to-magenta text-white shadow-btn"
              : "text-ink-soft hover:bg-surface-3"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
