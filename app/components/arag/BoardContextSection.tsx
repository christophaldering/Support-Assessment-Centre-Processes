"use client";

export default function BoardContextSection() {
  return (
    <section className="w-full bg-white" data-testid="section-board-context">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <h2
          className="text-2xl md:text-3xl font-bold text-black mb-12"
          style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
        >
          Mandat und strategischer Kontext
        </h2>

        <div className="space-y-10">
          <div className="border-l-4 border-[#FFD700] pl-6 lg:pl-8 space-y-4">
            <p className="text-base text-gray-800 leading-relaxed">
              Der Vorstand hat den Auftrag formuliert, strategisches Zukunftsdenken
              unter realitätsnahen Bedingungen sichtbar zu machen und Potenziale
              differenzierter zu identifizieren.
            </p>
            <p className="text-base text-gray-800 leading-relaxed">
              Der Business Development Pitch dient damit nicht nur der
              Auswahlentscheidung, sondern der strukturierten Beobachtung
              strategischer Handlungslogik.
            </p>
          </div>

          <div className="border-l-4 border-[#FFD700] pl-6 lg:pl-8 space-y-4">
            <h3
              className="text-lg font-bold text-black"
              style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
            >
              Herausforderung
            </h3>
            <p className="text-base text-gray-800 leading-relaxed">
              Die Zusammenstellung der Teams beeinflusst potenziell die
              Vergleichbarkeit individueller Leistungen.
            </p>
            <p className="text-base text-gray-800 leading-relaxed">
              Gleichzeitig soll unter realitätsnahen Wettbewerbsbedingungen eine
              Entscheidung vorbereitet werden.
            </p>
            <p className="text-base text-gray-800 leading-relaxed">
              Diese Konstellation erzeugt eine produktive Spannung zwischen
              Auswahl- und Diagnoseperspektive.
            </p>
          </div>

          <div className="border-l-4 border-[#FFD700] pl-6 lg:pl-8 space-y-4">
            <h3
              className="text-lg font-bold text-black"
              style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
            >
              Konzeptioneller Lösungsansatz
            </h3>
            <ul className="space-y-2.5">
              <li className="text-base text-gray-800 leading-relaxed">Standardisierte Bewertungsarchitektur</li>
              <li className="text-base text-gray-800 leading-relaxed">Vollständige Punktverteilung (100 Punkte)</li>
              <li className="text-base text-gray-800 leading-relaxed">Strukturierte Aggregation</li>
              <li className="text-base text-gray-800 leading-relaxed">Ergänzende diagnostische Einordnung</li>
              <li className="text-base text-gray-800 leading-relaxed">Integration in nachgelagerte Development Dialogues</li>
            </ul>
            <p className="text-base text-gray-600 leading-relaxed italic mt-2">
              Ziel ist es, Vergleichbarkeit herzustellen, ohne die Realitätsnähe
              zu verlieren.
            </p>
          </div>

          <div className="border-l-4 border-[#FFD700] pl-6 lg:pl-8 space-y-4">
            <h3
              className="text-lg font-bold text-black"
              style={{ fontFamily: "Georgia, 'Playfair Display', serif" }}
            >
              Voraussetzungen
            </h3>
            <ul className="space-y-3">
              <li className="text-base text-gray-800 leading-relaxed">
                Transparente Kommunikation der Bewertungslogik
                <span className="ml-2 text-xs font-medium text-gray-400 tracking-wide uppercase">to be discussed</span>
              </li>
              <li className="text-base text-gray-800 leading-relaxed">
                Klarheit über Gewichtung von Team- vs. Individualleistung
                <span className="ml-2 text-xs font-medium text-gray-400 tracking-wide uppercase">to be discussed</span>
              </li>
              <li className="text-base text-gray-800 leading-relaxed">
                Gemeinsames Verständnis zur Rolle des Vorstands als Beobachter und Sponsor
                <span className="ml-2 text-xs font-medium text-gray-400 tracking-wide uppercase">to be discussed</span>
              </li>
              <li className="text-base text-gray-800 leading-relaxed">
                Verbindliche Einbettung der Ergebnisse in die Development Dialogues
                <span className="ml-2 text-xs font-medium text-gray-400 tracking-wide uppercase">to be discussed</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
