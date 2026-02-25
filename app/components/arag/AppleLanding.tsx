"use client";

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

const JOURNEY = [
  { title: "WHU Learning", sub: "Strategische Grundlagen" },
  { title: "Business Development Pitch", sub: "Geschäftsmodellentwicklung" },
  { title: "Board Evaluation", sub: "Strukturierte Bewertung" },
  { title: "Development Dialogue", sub: "Individuelle Rückmeldung" },
  { title: "Development Path", sub: "Maßgeschneiderter Plan" },
];

export default function AppleLanding({ onSelectEnv, envLockedNote }: Props) {
  return (
    <>
      <section className="relative min-h-[85vh] flex items-center justify-center bg-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "48px 48px" }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center py-24">
          <p className="text-[#FFD700] text-sm font-medium tracking-[0.3em] uppercase mb-8">
            ARAG SE
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-8">
            Executive
            <br />
            <span className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Potential Journey
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/50 font-light max-w-2xl mx-auto leading-relaxed">
            Strategische Entscheidungssimulation.
            <br className="hidden md:block" />
            Strukturierte Potenzialbeobachtung.
          </p>
        </div>
      </section>

      <section className="bg-black text-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[#FFD700] text-xs font-medium tracking-[0.3em] uppercase mb-4 text-center">
            Business Development Pitch
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-20 tracking-tight">
            Drei Perspektiven.
            <br />
            <span className="text-white/40">Ein Framework.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden">
            {[
              { num: "01", title: "Vorstandsmotivation", items: ["Zukunftsfähigkeit sichtbar machen", "Strategisches Denken unter Realbedingungen", "Potenziale differenzieren"] },
              { num: "02", title: "Spannung im Format", items: ["Teamkonstellation beeinflusst Vergleichbarkeit", "Wettbewerbsrealität bleibt gewollt", "Auswahl & Diagnose nebeneinander"] },
              { num: "03", title: "Lösungsansatz", items: ["Standardisierte Bewertungsarchitektur", "100-Punkte-System", "Einbettung in Development Dialogues"] },
            ].map((card) => (
              <div key={card.num} className="bg-[#111] p-8 lg:p-10">
                <span className="text-[#FFD700] text-xs font-mono tracking-wider">{card.num}</span>
                <h3 className="text-xl font-bold mt-3 mb-6">{card.title}</h3>
                <ul className="space-y-3">
                  {card.items.map((item) => (
                    <li key={item} className="text-sm text-white/50 flex items-start gap-2.5">
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

      <section className="bg-black text-white py-24">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-[#FFD700] text-xs font-medium tracking-[0.3em] uppercase mb-4 text-center">
            Struktur
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 tracking-tight">
            Bewertungs&shy;dimensionen
          </h2>
          <div className="space-y-6">
            {DIMENSIONS.map((dim) => (
              <div key={dim.label}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-white/70">{dim.label}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500]"
                    style={{ width: `${dim.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/20 mt-8 text-center italic">
            Darstellung der Bewertungsstruktur — keine echten Punktwerte.
          </p>
        </div>
      </section>

      <section className="bg-black text-white py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#FFD700] text-xs font-medium tracking-[0.3em] uppercase mb-4 text-center">
            Programm
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-20 tracking-tight">
            Executive Potential Journey
          </h2>
          <div className="flex flex-col md:flex-row items-stretch gap-px">
            {JOURNEY.map((step, i) => (
              <div key={step.title} className="flex-1 flex flex-col items-center text-center relative">
                <div className="w-10 h-10 rounded-full border-2 border-[#FFD700] flex items-center justify-center text-[#FFD700] text-sm font-bold mb-4">
                  {i + 1}
                </div>
                <h4 className="text-sm font-bold mb-1">{step.title}</h4>
                <p className="text-xs text-white/40">{step.sub}</p>
                {i < JOURNEY.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-[calc(50%+24px)] w-[calc(100%-48px)] h-px bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black text-white py-24 border-t border-white/5" data-testid="section-env-select">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Bereit?
          </h2>
          <p className="text-white/40 text-base mb-12">
            Starten Sie die Bewertungsumgebung.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              data-testid="arag-lobby-live"
              disabled
              className="px-8 py-5 border border-white/10 rounded-2xl text-center opacity-30 cursor-not-allowed"
            >
              <span className="block font-bold text-white text-lg mb-1">LIVE</span>
              <span className="block text-xs text-white/30">Noch nicht verfügbar</span>
            </button>
            <button
              data-testid="arag-lobby-demo"
              onClick={() => onSelectEnv("demo")}
              className="group px-8 py-5 border border-[#FFD700] rounded-2xl text-center transition-all hover:bg-[#FFD700]"
            >
              <span className="block font-bold text-white text-lg mb-1 group-hover:text-black transition-colors">DEMO</span>
              <span className="block text-xs text-white/40 group-hover:text-black/60 transition-colors">Testumgebung starten</span>
            </button>
          </div>

          {envLockedNote && (
            <p className="text-sm text-amber-400 mt-6" data-testid="arag-env-locked-note">
              Sie befinden sich in der DEMO-Umgebung.
            </p>
          )}
        </div>
      </section>

      <footer className="bg-black border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <p className="text-xs text-white/20">
            Powered by <span className="font-semibold text-[#A6473B]">aestimamus</span>
          </p>
          <p className="text-xs text-white/15">ARAG SE</p>
        </div>
      </footer>
    </>
  );
}
