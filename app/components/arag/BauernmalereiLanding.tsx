"use client";

interface Props {
  onSelectEnv: (env: "live" | "demo") => void;
  envLockedNote: boolean;
}

const FOLK_FONT = "'Segoe Script', 'Comic Sans MS', 'Caveat', cursive";
const BODY_FONT = "Georgia, 'Palatino Linotype', serif";

const C = {
  linen: "#F5E6C8",
  linenDark: "#E8D5B0",
  oxblood: "#8B2500",
  enzian: "#1E3A5F",
  grass: "#2D5F2D",
  sun: "#E8B800",
  edelweiss: "#FFF8F0",
  wood: "#5C3317",
  woodLight: "#7A4B2A",
  woodDark: "#3E2210",
  cream: "#FDF6E3",
};

function Edelweiss({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <ellipse
          key={angle}
          cx="50" cy="50" rx="8" ry="22"
          fill={C.edelweiss}
          stroke={C.sun}
          strokeWidth="1"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="8" fill={C.sun} />
      <circle cx="50" cy="50" r="4" fill={C.oxblood} />
    </svg>
  );
}

function FlowerCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const rot = { tl: 0, tr: 90, bl: 270, br: 180 }[position];
  const pos = {
    tl: "top-0 left-0",
    tr: "top-0 right-0",
    bl: "bottom-0 left-0",
    br: "bottom-0 right-0",
  }[position];
  return (
    <svg
      width="60" height="60" viewBox="0 0 60 60"
      className={`absolute ${pos} opacity-60`}
      style={{ transform: `rotate(${rot}deg)` }}
    >
      <path d="M0 0 Q30 5 25 25 Q5 30 0 0Z" fill={C.grass} opacity="0.5" />
      <path d="M0 0 Q10 20 20 20 Q20 10 0 0Z" fill={C.grass} opacity="0.7" />
      <circle cx="18" cy="18" r="6" fill={C.oxblood} opacity="0.8" />
      <circle cx="18" cy="18" r="3" fill={C.sun} />
      <circle cx="8" cy="28" r="4" fill={C.enzian} opacity="0.6" />
      <circle cx="28" cy="8" r="4" fill={C.oxblood} opacity="0.5" />
    </svg>
  );
}

function FlowerBorder() {
  return (
    <div className="flex justify-center gap-2 py-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <svg key={i} width="24" height="24" viewBox="0 0 24 24">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="12" cy="12" rx="3" ry="7" fill={i % 2 === 0 ? C.oxblood : C.enzian} opacity="0.7" transform={`rotate(${a} 12 12)`} />
          ))}
          <circle cx="12" cy="12" r="3" fill={C.sun} />
        </svg>
      ))}
    </div>
  );
}

const PERSPECTIVES = [
  {
    num: "I",
    title: "Vorstandsmotivation",
    items: ["Zukunftsfähigkeit sichtbar machen", "Strategisches Denken unter Realbedingungen", "Potenziale differenzieren"],
  },
  {
    num: "II",
    title: "Spannung im Format",
    items: ["Teamkonstellation beeinflusst Vergleichbarkeit", "Wettbewerbsrealität bleibt gewollt", "Auswahl & Diagnose nebeneinander"],
  },
  {
    num: "III",
    title: "Lösungsansatz",
    items: ["Standardisierte Bewertungsarchitektur", "100-Punkte-System", "Einbettung in Development Dialogues"],
  },
];

const DIMENSIONS = [
  { label: "Strategic Relevance", pct: 88, color: C.oxblood },
  { label: "Innovation", pct: 76, color: C.enzian },
  { label: "KPI Logic", pct: 82, color: C.grass },
  { label: "Go-to-Market", pct: 70, color: C.sun },
  { label: "Defense & Q&A", pct: 65, color: C.oxblood },
  { label: "Leadership Alignment", pct: 90, color: C.enzian },
];

const JOURNEY = [
  { title: "WHU Learning", sub: "Strategische Grundlagen" },
  { title: "Business Dev. Pitch", sub: "Geschäftsmodellentwicklung" },
  { title: "Board Evaluation", sub: "Strukturierte Bewertung" },
  { title: "Development Dialogue", sub: "Individuelle Rückmeldung" },
  { title: "Development Path", sub: "Maßgeschneiderter Plan" },
];

export default function BauernmalereiLanding({ onSelectEnv, envLockedNote }: Props) {
  return (
    <>
      <section
        className="relative min-h-[85vh] flex items-center overflow-hidden"
        style={{ backgroundColor: C.linen }}
        data-testid="section-hero"
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 19px, ${C.wood} 19px, ${C.wood} 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, ${C.wood} 19px, ${C.wood} 20px)`,
          }}
        />
        <Edelweiss size={120} className="absolute top-8 right-8 opacity-20 hidden lg:block" />
        <Edelweiss size={80} className="absolute bottom-12 left-8 opacity-15 hidden lg:block" />

        <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28 text-center w-full">
          <div
            className="relative inline-block p-10 md:p-14 rounded-lg"
            style={{
              border: `4px double ${C.oxblood}`,
              backgroundColor: `${C.cream}`,
              boxShadow: `inset 0 0 30px ${C.linenDark}`,
            }}
          >
            <FlowerCorner position="tl" />
            <FlowerCorner position="tr" />
            <FlowerCorner position="bl" />
            <FlowerCorner position="br" />

            <div className="flex justify-center mb-6">
              <Edelweiss size={64} />
            </div>

            <p
              className="text-lg md:text-xl tracking-[0.15em] uppercase mb-4"
              style={{ fontFamily: FOLK_FONT, color: C.grass }}
            >
              ARAG SE
            </p>
            <h1
              className="text-[36px] md:text-[56px] lg:text-[68px] leading-[1.15] mb-6"
              style={{ fontFamily: FOLK_FONT, color: C.oxblood }}
            >
              Executive
              <br />
              Potential Journey
            </h1>
            <h2
              className="text-xl md:text-2xl lg:text-3xl mb-6"
              style={{ fontFamily: FOLK_FONT, color: C.enzian }}
            >
              Business Development Pitch
            </h2>
            <p
              className="text-base md:text-lg leading-relaxed max-w-lg mx-auto"
              style={{ fontFamily: BODY_FONT, color: C.wood }}
            >
              Strategische Entscheidungssimulation
              <br />
              mit strukturierter Potenzialbeobachtung.
            </p>
          </div>

          <FlowerBorder />
        </div>
      </section>

      <section
        className="py-16 md:py-24"
        style={{ backgroundColor: C.linenDark }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <p
            className="text-center text-sm tracking-[0.2em] uppercase mb-3"
            style={{ fontFamily: FOLK_FONT, color: C.grass }}
          >
            Drei Perspektiven
          </p>
          <h2
            className="text-center text-[28px] md:text-[40px] mb-12 md:mb-16"
            style={{ fontFamily: FOLK_FONT, color: C.oxblood }}
          >
            Auf Holztafeln gemalt
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PERSPECTIVES.map((card) => (
              <div
                key={card.num}
                className="relative rounded-lg p-6 lg:p-8 overflow-hidden"
                style={{
                  backgroundColor: C.wood,
                  boxShadow: `inset 0 2px 8px ${C.woodDark}, 4px 4px 0 ${C.woodDark}`,
                  border: `2px solid ${C.woodLight}`,
                }}
              >
                <FlowerCorner position="tr" />
                <FlowerCorner position="bl" />
                <span
                  className="text-3xl font-bold block mb-3 opacity-60"
                  style={{ fontFamily: FOLK_FONT, color: C.sun }}
                >
                  {card.num}
                </span>
                <h3
                  className="text-xl md:text-2xl mb-5"
                  style={{ fontFamily: FOLK_FONT, color: C.edelweiss }}
                >
                  {card.title}
                </h3>
                <ul className="space-y-3">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: `${C.edelweiss}dd`, fontFamily: BODY_FONT }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 mt-1">
                        {[0, 72, 144, 216, 288].map((a) => (
                          <ellipse key={a} cx="6" cy="6" rx="1.5" ry="4" fill={C.sun} opacity="0.8" transform={`rotate(${a} 6 6)`} />
                        ))}
                        <circle cx="6" cy="6" r="2" fill={C.oxblood} />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="py-16 md:py-24"
        style={{ backgroundColor: C.linen }}
      >
        <div className="max-w-3xl mx-auto px-6">
          <p
            className="text-center text-sm tracking-[0.2em] uppercase mb-3"
            style={{ fontFamily: FOLK_FONT, color: C.enzian }}
          >
            Bewertungsstruktur
          </p>
          <h2
            className="text-center text-[28px] md:text-[40px] mb-12"
            style={{ fontFamily: FOLK_FONT, color: C.oxblood }}
          >
            Sechs Maßstäbe
          </h2>
          <div className="space-y-6">
            {DIMENSIONS.map((dim) => (
              <div key={dim.label}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm" style={{ fontFamily: BODY_FONT, color: C.wood }}>{dim.label}</span>
                </div>
                <div
                  className="h-5 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${C.linenDark}`, border: `2px solid ${C.woodLight}` }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${dim.pct}%`, backgroundColor: dim.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-8 italic" style={{ fontFamily: BODY_FONT, color: `${C.wood}99` }}>
            Darstellung der Bewertungsstruktur — keine echten Punktwerte.
          </p>
        </div>
      </section>

      <section
        className="py-16 md:py-24 relative overflow-hidden"
        style={{ backgroundColor: C.grass, color: C.edelweiss }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${C.edelweiss} 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6">
          <p
            className="text-center text-sm tracking-[0.2em] uppercase mb-3"
            style={{ fontFamily: FOLK_FONT, color: C.sun }}
          >
            Der Wanderweg
          </p>
          <h2
            className="text-center text-[28px] md:text-[40px] mb-14 md:mb-20"
            style={{ fontFamily: FOLK_FONT }}
          >
            Executive Potential Journey
          </h2>

          <div className="relative">
            <div
              className="hidden md:block absolute top-12 left-[10%] right-[10%] h-1 rounded-full"
              style={{ backgroundColor: `${C.sun}55` }}
            />

            <div className="flex flex-col md:flex-row items-start gap-8 md:gap-2">
              {JOURNEY.map((step, i) => (
                <div key={step.title} className="flex-1 flex flex-col items-center text-center relative z-10">
                  <div
                    className="w-24 min-h-[80px] flex flex-col items-center justify-center rounded-md mb-4 px-2 py-3 relative"
                    style={{
                      backgroundColor: C.wood,
                      border: `2px solid ${C.woodLight}`,
                      boxShadow: `3px 3px 0 ${C.woodDark}`,
                    }}
                  >
                    <span className="text-lg font-bold" style={{ fontFamily: FOLK_FONT, color: C.sun }}>{i + 1}</span>
                    <div
                      className="w-0 h-0 absolute -bottom-3 left-1/2 -translate-x-1/2"
                      style={{
                        borderLeft: "8px solid transparent",
                        borderRight: "8px solid transparent",
                        borderTop: `12px solid ${C.wood}`,
                      }}
                    />
                  </div>
                  <h4 className="text-base font-semibold mb-1 leading-tight" style={{ fontFamily: FOLK_FONT }}>
                    {step.title}
                  </h4>
                  <p className="text-sm opacity-70" style={{ fontFamily: BODY_FONT }}>{step.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-16 md:py-24"
        style={{ backgroundColor: C.linenDark }}
        data-testid="section-env-select"
      >
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            <Edelweiss size={48} />
          </div>
          <h2
            className="text-[28px] md:text-[40px] mb-4"
            style={{ fontFamily: FOLK_FONT, color: C.oxblood }}
          >
            Welche Tür?
          </h2>
          <p className="text-base mb-12" style={{ fontFamily: BODY_FONT, color: C.wood }}>
            Wählen Sie Ihre Umgebung — LIVE oder DEMO.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md mx-auto">
            <button
              data-testid="arag-lobby-live"
              disabled
              className="relative rounded-lg p-6 text-center opacity-50 cursor-not-allowed"
              style={{
                backgroundColor: C.wood,
                border: `3px solid ${C.woodDark}`,
                boxShadow: `4px 4px 0 ${C.woodDark}`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <line x1="10" y1="10" x2="50" y2="50" stroke={C.oxblood} strokeWidth="4" />
                  <line x1="50" y1="10" x2="10" y2="50" stroke={C.oxblood} strokeWidth="4" />
                </svg>
              </div>
              <span className="block text-lg font-bold mb-1" style={{ fontFamily: FOLK_FONT, color: C.edelweiss }}>LIVE</span>
              <span className="block text-xs" style={{ color: `${C.edelweiss}88` }}>Noch vernagelt</span>
            </button>

            <button
              data-testid="arag-lobby-demo"
              onClick={() => onSelectEnv("demo")}
              className="relative rounded-lg p-6 text-center transition-all hover:scale-105"
              style={{
                backgroundColor: C.grass,
                border: `3px solid ${C.sun}`,
                boxShadow: `4px 4px 0 ${C.woodDark}`,
              }}
            >
              <span className="block text-lg font-bold mb-1" style={{ fontFamily: FOLK_FONT, color: C.edelweiss }}>DEMO</span>
              <span className="block text-xs" style={{ fontFamily: BODY_FONT, color: `${C.edelweiss}cc` }}>Hereinspaziert!</span>
            </button>
          </div>

          {envLockedNote && (
            <p className="text-sm mt-8" style={{ fontFamily: FOLK_FONT, color: C.oxblood }} data-testid="arag-env-locked-note">
              Sie befinden sich in der DEMO-Umgebung.
            </p>
          )}
        </div>
      </section>

      <footer
        className="py-6"
        style={{ backgroundColor: C.woodDark, borderTop: `3px solid ${C.sun}` }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs" style={{ color: `${C.edelweiss}66`, fontFamily: BODY_FONT }}>
            Powered by <span className="font-semibold" style={{ color: C.oxblood }}>aestimamus</span>
          </p>
          <p className="text-xs" style={{ color: `${C.edelweiss}44`, fontFamily: FOLK_FONT }}>ARAG SE</p>
        </div>
      </footer>
    </>
  );
}
