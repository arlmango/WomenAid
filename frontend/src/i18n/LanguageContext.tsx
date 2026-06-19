import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { translations, type Lang, type TranslationKey } from "./translations";

const STORAGE_KEY = "womenaid_lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "kz" ? "kz" : "ru";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = (next: Lang) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (key: TranslationKey) => translations[lang][key] ?? translations.ru[key] ?? key,
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within <LanguageProvider>");
  return ctx;
}
