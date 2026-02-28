"use client";

import { useLanguage } from "@/app/providers/LanguageProvider";

const DIMENSIONS = [
  { label: "Strategic Relevance", width: 88 },
  { label: "Innovation", width: 76 },
  { label: "KPI Logic", width: 82 },
  { label: "Go-to-Market", width: 70 },
  { label: "Defense & Q&A", width: 65 },
  { label: "Leadership Alignment", width: 90 },
];

export default function LandingCharts() {
  const { t } = useLanguage();
  return (
    <section className="w-full bg-[#FFFBF0]" data-testid="section-charts">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[#FFD700] mb-3">
            {t("chartsStructure")}
          </p>
          <h2
            className="text-2xl md:text-3xl font-bold text-black mb-10"
            style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
          >
            {t("chartsDimensions")}
          </h2>

          <div className="space-y-5">
            {DIMENSIONS.map((dim) => (
              <div key={dim.label} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">{dim.label}</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-black to-gray-800 transition-all duration-700"
                    style={{ width: `${dim.width}%` }}
                  />
                  <div
                    className="absolute top-0 left-0 h-full rounded-lg bg-[#FFD700]/10"
                    style={{ width: `${dim.width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-6 italic">
            {t("chartHint")}
          </p>
        </div>
      </div>
    </section>
  );
}
