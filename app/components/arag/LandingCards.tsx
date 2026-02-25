"use client";

const CARDS = [
  {
    title: "Strategischer Kontext",
    items: [
      "AI-nativer Angriff auf das Kerngeschäft",
      "Selbst-Disruptionslogik",
      "KPI-basierte Ableitung",
      "Marktpositionierung",
    ],
  },
  {
    title: "Bewertungsarchitektur",
    items: [
      "100 Punkte pro Team",
      "Vollständige Verteilung",
      "Vergleichbarkeit",
      "Strukturierte Aggregation",
    ],
  },
  {
    title: "Governance & Transparenz",
    items: [
      "Identische Bewertungslogik",
      "Standardisierte Kriterien",
      "Einbettung in Development Dialogues",
      "Diagnostische Kontextualisierung",
    ],
  },
];

export default function LandingCards() {
  return (
    <section className="w-full bg-[#F2F2F2]/40" data-testid="section-cards">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
              data-testid={`card-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="h-[2px] bg-[#FFD700]" />
              <div className="p-7 lg:p-8">
                <h3
                  className="text-lg font-bold text-black mb-5"
                  style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
                >
                  {card.title}
                </h3>
                <ul className="space-y-3">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
