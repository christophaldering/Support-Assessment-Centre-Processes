"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Lang, getLang, setLang as persistLang } from "@/lib/i18n/language";
import { translations } from "@/lib/i18n/translations";

type TranslationKeys = keyof typeof translations.de;

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKeys, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "de",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("de");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLangState(getLang());
    setMounted(true);
  }, []);

  const handleSetLang = useCallback((l: Lang) => {
    persistLang(l);
    setLangState(l);
  }, []);

  const t = useCallback(
    (key: TranslationKeys, vars?: Record<string, string | number>): string => {
      const dict = translations[lang] || translations.de;
      let text = (dict as any)[key] ?? (translations.de as any)[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        });
      }
      return text;
    },
    [lang]
  );

  if (!mounted) {
    const t_de = (key: TranslationKeys) => (translations.de as any)[key] ?? key;
    return (
      <LanguageContext.Provider value={{ lang: "de", setLang: handleSetLang, t: t_de }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
