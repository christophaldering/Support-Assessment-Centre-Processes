"use client";

import { useLanguage } from "@/app/providers/LanguageProvider";
import HeroStrategicPanel from "@/app/components/arag/HeroStrategicPanel";

interface Props {
  onSelectEnv: (env: "live" | "demo") => void;
  envLockedNote: boolean;
}

const DIMENSIONS = [
  { label: "Strategic Relevance", pct: 88 },
  { label: "Innovation", pct: 76 },
  { label: "KPI Logic", pct: 82 },
  { label: "Go-to-Market", pct: 70 },
  { label: "Defense & Q&A", pct: 65 },
  { label: "Leadership Alignment", pct: 90 },
];

export default function AppleLanding({ onSelectEnv, envLockedNote }: Props) {
  const { t } = useLanguage();

  const JOURNEY = [
    { title: "WHU Learning", sub: t("appleJourney1Sub") },
    { title: "Business Development Pitch", sub: t("appleJourney2Sub") },
    { title: "Board Evaluation", sub: t("appleJourney3Sub") },
    { title: "Development Dialogue", sub: t("appleJourney4Sub") },
    { title: "Development Path", sub: t("appleJourney5Sub") },
  ];

  const CARDS = [
    { num: "01", title: t("storyboard01Title"), items: [t("storyboard01Item1"), t("storyboard01Item2"), t("storyboard01Item3")] },
    { num: "02", title: t("storyboard02Title"), items: [t("storyboard02Item1"), t("storyboard02Item2"), t("storyboard02Item3")] },
    { num: "03", title: t("storyboard03Title"), items: [t("storyboard03Item1"), t("storyboard03Item2"), t("storyboard03Item3")] },
  ];

  return (
    <>
      <section className="relative min-h-[90vh] flex items-center bg-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "48px 48px" }} />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-24 md:py-32 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <p className="text-[#FFD700] text-base md:text-lg font-medium tracking-[0.3em] uppercase mb-10">
                ARAG SE
              </p>
              <h1
                className="text-[42px] md:text-[72px] lg:text-[88px] font-semibold tracking-[-0.02em] leading-[1.05] mb-10"
                style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
              >
                Executive
                <br />
                <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                  Potential Journey
                </span>
              </h1>
              <p className="text-[18px] md:text-[24px] lg:text-[28px] text-white/70 font-light max-w-[800px] leading-relaxed">
                {t("appleHeroDesc1")}
                <br className="hidden md:block" />
                {t("appleHeroDesc2")}
              </p>
            </div>
            <HeroStrategicPanel />
          </div>
        </div>
      </section>

      <section className="bg-black text-white py-20 md:py-32">
        <div className="max-w-[900px] mx-auto px-6">
          <p className="text-[#FFD700] text-base font-medium tracking-[0.3em] uppercase mb-6 text-center">
            Business Development Pitch
          </p>
          <h2
            className="text-[30px] md:text-[48px] lg:text-[56px] font-semibold text-center mb-16 md:mb-20 tracking-tight leading-tight"
            style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
          >
            {t("cardsTitle")}.
            <br />
            <span className="text-white/40">{t("frameworkLabel")}.</span>
          </h2>
        </div>

        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden">
            {CARDS.map((card) => (
              <div key={card.num} className="bg-[#111] p-8 lg:p-12">
                <span className="text-[#FFD700] text-base font-mono tracking-wider">{card.num}</span>
                <h3
                  className="text-2xl md:text-[28px] font-semibold mt-4 mb-8"
                  style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
                >
                  {card.title}
                </h3>
                <ul className="space-y-4">
                  {card.items.map((item) => (
                    <li key={item} className="text-[16px] md:text-[18px] text-white/90 leading-[1.6] flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mt-2.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black text-white py-20 md:py-32">
        <div className="max-w-[900px] mx-auto px-6">
          <p className="text-[#FFD700] text-base font-medium tracking-[0.3em] uppercase mb-6 text-center">
            {t("chartsStructure")}
          </p>
          <h2
            className="text-[30px] md:text-[48px] lg:text-[56px] font-semibold text-center mb-16 tracking-tight leading-tight"
            style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
          >
            {t("chartsDimensions")}
          </h2>
          <div className="space-y-8">
            {DIMENSIONS.map((dim) => (
              <div key={dim.label}>
                <div className="flex justify-between mb-3">
                  <span className="text-[16px] md:text-[18px] text-white/90">{dim.label}</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500]"
                    style={{ width: `${dim.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-base text-white/30 mt-10 text-center italic">
            {t("chartHint")}
          </p>
        </div>
      </section>

      <section className="bg-black text-white py-20 md:py-32">
        <div className="max-w-[900px] mx-auto px-6">
          <p className="text-[#FFD700] text-base font-medium tracking-[0.3em] uppercase mb-6 text-center">
            {t("journeyLabel")}
          </p>
          <h2
            className="text-[30px] md:text-[48px] lg:text-[56px] font-semibold text-center mb-16 md:mb-20 tracking-tight leading-tight"
            style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
          >
            {t("journeyTitle")}
          </h2>
          <div className="flex flex-col md:flex-row items-start gap-8 md:gap-2">
            {JOURNEY.map((step, i) => (
              <div key={step.title} className="flex-1 flex flex-col items-center text-center relative">
                <div className="w-14 h-14 rounded-full border-2 border-[#FFD700] flex items-center justify-center text-[#FFD700] text-lg font-bold mb-6">
                  {i + 1}
                </div>
                <h4
                  className="text-[18px] md:text-[20px] font-semibold mb-2 leading-tight"
                  style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
                >
                  {step.title}
                </h4>
                <p className="text-[16px] text-white/70 leading-relaxed">{step.sub}</p>
                {i < JOURNEY.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+32px)] w-[calc(100%-64px)] h-px bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black text-white py-20 md:py-32 border-t border-white/5" data-testid="section-env-select">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <h2
            className="text-[30px] md:text-[48px] lg:text-[56px] font-semibold mb-6 tracking-tight leading-tight"
            style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
          >
            {t("ready")}
          </h2>
          <p className="text-white/70 text-[18px] md:text-[20px] mb-14 leading-relaxed">
            {t("startRatingEnv")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <button
              data-testid="arag-lobby-live"
              disabled
              className="px-10 py-4 border border-white/10 rounded-2xl text-center opacity-30 cursor-not-allowed"
            >
              <span className="block font-bold text-white text-[18px] mb-1">{t("live")}</span>
              <span className="block text-base text-white/30">{t("notAvailable")}</span>
            </button>
            <button
              data-testid="arag-lobby-demo"
              onClick={() => onSelectEnv("demo")}
              className="group px-10 py-4 border border-[#FFD700] rounded-2xl text-center transition-all hover:bg-[#FFD700]"
            >
              <span className="block font-bold text-white text-[18px] mb-1 group-hover:text-black transition-colors">{t("demo")}</span>
              <span className="block text-base text-white/40 group-hover:text-black/60 transition-colors">{t("startTestEnv")}</span>
            </button>
          </div>

          {envLockedNote && (
            <p className="text-base text-amber-400 mt-8" data-testid="arag-env-locked-note">
              {t("inDemoEnv")}
            </p>
          )}
        </div>
      </section>

      <footer className="bg-black border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <p className="text-base text-white/20">
            {t("poweredBy")} <span className="font-semibold text-[#A6473B]">aestimamus</span>
          </p>
          <p className="text-base text-white/15">ARAG SE</p>
        </div>
      </footer>
    </>
  );
}
