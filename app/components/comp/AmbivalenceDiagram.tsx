"use client";

import { useLanguage } from "@/app/providers/LanguageProvider";

export default function AmbivalenceDiagram() {
  const { t } = useLanguage();
  const selParts = t("ambSelectionDecision").split("\n");
  const diagParts = t("ambDiagnosticObservation").split("\n");
  const transParts = t("ambStructuredTransparency").split("\n");

  return (
    <section className="w-full bg-white" data-testid="section-ambivalence">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-16 lg:pb-24">
        <div className="max-w-2xl mx-auto">
          <svg
            viewBox="0 0 600 280"
            className="w-full h-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="220" cy="140" rx="160" ry="110" stroke="black" strokeWidth="1.5" fill="none" />
            <ellipse cx="380" cy="140" rx="160" ry="110" stroke="black" strokeWidth="1.5" fill="none" />

            <clipPath id="clipLeft">
              <ellipse cx="220" cy="140" rx="160" ry="110" />
            </clipPath>
            <clipPath id="clipRight">
              <ellipse cx="380" cy="140" rx="160" ry="110" />
            </clipPath>
            <ellipse
              cx="380" cy="140" rx="160" ry="110"
              fill="#FFD700" fillOpacity="0.15"
              clipPath="url(#clipLeft)"
            />

            <text x="140" y="136" textAnchor="middle" className="text-[13px] font-medium" fill="#000">
              {selParts[0]}
            </text>
            <text x="140" y="154" textAnchor="middle" className="text-[13px] font-medium" fill="#000">
              {selParts[1]}
            </text>

            <text x="460" y="136" textAnchor="middle" className="text-[13px] font-medium" fill="#000">
              {diagParts[0]}
            </text>
            <text x="460" y="154" textAnchor="middle" className="text-[13px] font-medium" fill="#000">
              {diagParts[1]}
            </text>

            <text x="300" y="132" textAnchor="middle" className="text-[12px] font-semibold" fill="#000">
              {transParts[0]}
            </text>
            <text x="300" y="150" textAnchor="middle" className="text-[12px] font-semibold" fill="#000">
              {transParts[1]}
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
