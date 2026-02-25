"use client";

import { useLanguage } from "@/app/providers/LanguageProvider";
import HeroStrategicPanel from "@/app/components/arag/HeroStrategicPanel";

export default function LandingHero() {
  const { t } = useLanguage();
  return (
    <section className="w-full bg-[#FFFBF0]" data-testid="section-hero">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[#FFD700]">
                {t("heroLabel")}
              </p>
              <h1
                className="text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.15] font-bold text-black whitespace-pre-line"
                style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
              >
                {t("heroTitle")}
              </h1>
            </div>
            <h2
              className="text-2xl md:text-3xl text-black/80 font-medium"
              style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
            >
              {t("heroSubtitle")}
            </h2>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-lg">
              {t("heroDescription")}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-[2px] bg-[#FFD700]" />
              <span className="text-xs tracking-widest uppercase text-gray-400 font-medium">
                {t("heroTag")}
              </span>
            </div>
          </div>

          <HeroStrategicPanel />
        </div>
      </div>
    </section>
  );
}
