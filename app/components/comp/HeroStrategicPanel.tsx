"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/providers/LanguageProvider";

const JOURNEY_STEPS_EN = ["Context", "Pitch", "Defense", "Evaluation", "Development Dialogue"];
const JOURNEY_STEPS_DE = ["Kontext", "Pitch", "Verteidigung", "Bewertung", "Development Dialogue"];

export default function HeroStrategicPanel() {
  const { t, lang } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [journeyVisible, setJourneyVisible] = useState(false);

  const CONTEXT_LINES = [
    t("heroContextLine1"),
    t("heroContextLine2"),
    t("heroContextLine3"),
    t("heroContextLine4"),
  ];

  const JOURNEY_STEPS = lang === "en" ? JOURNEY_STEPS_EN : JOURNEY_STEPS_DE;

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100);
    const t2 = setTimeout(() => setJourneyVisible(true), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className={`rounded-[20px] shadow-lg overflow-hidden transition-opacity duration-[600ms] ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1626 100%)",
      }}
    >
      <div className="p-8 md:p-10 lg:p-12 space-y-8">
        <div className="space-y-5">
          <p className="text-xs tracking-[0.25em] uppercase text-white/40 font-medium">
            {t("strategicContext")}
          </p>
          <div className="space-y-3">
            {CONTEXT_LINES.map((line) => (
              <div key={line} className="flex items-start gap-3">
                <span className="w-1 h-1 rounded-full bg-white/25 mt-[10px] shrink-0" />
                <p className="text-base md:text-lg text-white/85 leading-relaxed">
                  {line}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="space-y-5">
          <h3
            className="text-lg md:text-xl font-semibold text-white/90"
            style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
          >
            {t("fromSimToDev")}
          </h3>

          <div
            className={`flex flex-wrap items-center gap-x-2 gap-y-1 transition-all duration-500 ease-out ${
              journeyVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            }`}
          >
            {JOURNEY_STEPS.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="text-sm md:text-base text-white/70 whitespace-nowrap">{step}</span>
                {i < JOURNEY_STEPS.length - 1 && (
                  <span className="text-white/30 text-sm">→</span>
                )}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/40 leading-relaxed pt-2">
          {t("structuredObservation")}
        </p>
      </div>
    </div>
  );
}
