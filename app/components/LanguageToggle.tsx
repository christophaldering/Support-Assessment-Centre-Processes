"use client";

import { useLanguage } from "@/app/providers/LanguageProvider";

interface Props {
  variant?: "light" | "dark";
}

export default function LanguageToggle({ variant = "light" }: Props) {
  const { lang, setLang } = useLanguage();

  const base = variant === "dark"
    ? "border-white/20"
    : "border-black/15";

  const activeStyle = variant === "dark"
    ? "bg-white text-black"
    : "bg-black text-white";

  const inactiveStyle = variant === "dark"
    ? "text-white/60 hover:text-white/90"
    : "text-black/50 hover:text-black/80";

  return (
    <div
      data-testid="lang-toggle"
      aria-label="Language"
      className={`inline-flex items-center border rounded-lg overflow-hidden text-xs font-medium ${base}`}
    >
      <button
        type="button"
        onClick={() => setLang("de")}
        className={`px-2.5 py-1 transition-all duration-150 ${lang === "de" ? activeStyle : inactiveStyle}`}
      >
        DE
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 transition-all duration-150 ${lang === "en" ? activeStyle : inactiveStyle}`}
      >
        EN
      </button>
    </div>
  );
}
