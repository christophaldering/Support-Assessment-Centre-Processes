"use client";

const STEPS = [
  "Realitätsnahe Entscheidungssimulation",
  "Strukturierte Bewertung",
  "Development Dialogue",
];

export default function FrameworkVisual() {
  return (
    <section className="w-full bg-[#FFFBF0]" data-testid="section-framework">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-xl mx-auto">
          {STEPS.map((step, i) => (
            <div key={step} className="flex flex-col items-center">
              <div className="w-full border border-gray-200 bg-white px-8 py-5 text-center">
                <span
                  className="text-base md:text-lg font-bold text-black"
                  style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
                >
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex flex-col items-center py-3">
                  <div className="w-px h-6 bg-gray-300" />
                  <svg className="w-4 h-4 text-gray-400 -mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
