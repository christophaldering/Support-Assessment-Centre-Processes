"use client";

const BOXES = [
  {
    num: "01",
    title: "Vorstandsmotivation",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
    items: [
      "Zukunftsfähigkeit sichtbar machen",
      "Strategisches Denken unter Realbedingungen",
      "Potenziale differenzieren",
    ],
  },
  {
    num: "02",
    title: "Spannung im Format",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
      </svg>
    ),
    items: [
      "Teamkonstellation beeinflusst Vergleichbarkeit",
      "Wettbewerbsrealität bleibt gewollt",
      "Auswahl & Diagnose stehen nebeneinander",
    ],
  },
  {
    num: "03",
    title: "Unser Lösungsansatz",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
      </svg>
    ),
    items: [
      "Standardisierte Bewertungsarchitektur",
      "100-Punkte-System",
      "Einbettung in Development Dialogues",
    ],
  },
];

export default function StrategicStoryboard() {
  return (
    <section className="w-full bg-white" data-testid="section-storyboard">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[#FFD700] mb-3">
          Strategischer Kontext
        </p>
        <h2
          className="text-2xl md:text-3xl font-bold text-black mb-14"
          style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
        >
          Mandat und strategischer Kontext
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200">
          {BOXES.map((box) => (
            <div key={box.num} className="bg-white p-8 lg:p-10">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-gray-200 leading-none" style={{ fontFamily: "Georgia, serif" }}>
                  {box.num}
                </span>
                <div className="w-8 h-[2px] bg-[#FFD700]" />
              </div>
              <div className="text-gray-400 mb-4">{box.icon}</div>
              <h3
                className="text-lg font-bold text-black mb-5"
                style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
              >
                {box.title}
              </h3>
              <ul className="space-y-3">
                {box.items.map((item) => (
                  <li key={item} className="text-sm text-gray-600 leading-relaxed flex items-start gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-[#FFD700] mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
