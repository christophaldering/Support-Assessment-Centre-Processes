"use client";

import { useLanguage } from "@/app/providers/LanguageProvider";
import LandingHero from "@/app/components/comp/LandingHero";
import LandingCards from "@/app/components/comp/LandingCards";
import LandingCharts from "@/app/components/comp/LandingCharts";
import JourneyTimeline from "@/app/components/comp/JourneyTimeline";
import StrategicStoryboard from "@/app/components/comp/StrategicStoryboard";
import AmbivalenceDiagram from "@/app/components/comp/AmbivalenceDiagram";
import FrameworkVisual from "@/app/components/comp/FrameworkVisual";

interface Props {
  onSelectEnv: (env: "live" | "demo") => void;
  envLockedNote: boolean;
}

export default function StandardLanding({ onSelectEnv, envLockedNote }: Props) {
  const { t } = useLanguage();
  return (
    <>
      <LandingHero />
      <StrategicStoryboard />
      <AmbivalenceDiagram />
      <FrameworkVisual />
      <LandingCards />
      <LandingCharts />
      <JourneyTimeline />

      <section className="w-full bg-black" data-testid="section-env-select">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[#FFD700] mb-3">
              {t("accessLabel")}
            </p>
            <h2
              className="text-2xl md:text-3xl font-bold text-white mb-4"
              style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
            >
              {t("selectEnvironment")}
            </h2>
            <p className="text-gray-400 text-sm mb-10">
              {t("selectEnvironmentHint")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              <button
                data-testid="comp-lobby-live"
                disabled
                className="group relative px-8 py-5 border-2 border-gray-700 rounded-xl text-center opacity-40 cursor-not-allowed"
              >
                <span className="block font-bold text-white text-lg mb-1">{t("live")}</span>
                <span className="block text-xs text-gray-500">{t("notAvailable")}</span>
              </button>
              <button
                data-testid="comp-lobby-demo"
                onClick={() => onSelectEnv("demo")}
                className="group relative px-8 py-5 border-2 border-[#FFD700] rounded-xl text-center transition-all hover:bg-[#FFD700]"
              >
                <span className="block font-bold text-white text-lg mb-1 group-hover:text-black transition-colors">{t("demo")}</span>
                <span className="block text-xs text-gray-400 group-hover:text-black/60 transition-colors">{t("startTestEnv")}</span>
              </button>
            </div>

            {envLockedNote && (
              <p className="text-sm text-amber-400 mt-6" data-testid="comp-env-locked-note">
                {t("inDemoEnv")}
              </p>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-black border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {t("poweredBy")} <span className="font-semibold text-[#A6473B]">aestimamus</span>
          </p>
          <p className="text-xs text-gray-600">COMP SE</p>
        </div>
      </footer>
    </>
  );
}
