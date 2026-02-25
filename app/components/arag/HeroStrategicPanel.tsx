"use client";

import { useEffect, useState } from "react";

const CONTEXT_LINES = [
  "AI-native transformation of the core business",
  "Self-disruption instead of incremental optimization",
  "Capital allocation under uncertainty",
  "Leadership readiness for complexity",
];

const JOURNEY_STEPS = ["Context", "Pitch", "Defense", "Evaluation", "Development Dialogue"];

export default function HeroStrategicPanel() {
  const [visible, setVisible] = useState(false);
  const [journeyVisible, setJourneyVisible] = useState(false);

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
            Strategic Context
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
            From Simulation to Development
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
          Structured potential observation under governance conditions
        </p>
      </div>
    </div>
  );
}
