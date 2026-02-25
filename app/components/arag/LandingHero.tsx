"use client";

import HeroStrategicPanel from "@/app/components/arag/HeroStrategicPanel";

export default function LandingHero() {
  return (
    <section className="w-full bg-[#FFFBF0]" data-testid="section-hero">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[#FFD700]">
                ARAG SE
              </p>
              <h1
                className="text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.15] font-bold text-black"
                style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
              >
                Executive Potential
                <br />
                Journey
              </h1>
            </div>
            <h2
              className="text-2xl md:text-3xl text-black/80 font-medium"
              style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
            >
              Business Development Pitch
            </h2>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-lg">
              Strategische Entscheidungssimulation mit strukturierter
              Potenzialbeobachtung.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-[2px] bg-[#FFD700]" />
              <span className="text-xs tracking-widest uppercase text-gray-400 font-medium">
                Board-Level Assessment
              </span>
            </div>
          </div>

          <HeroStrategicPanel />
        </div>
      </div>
    </section>
  );
}
