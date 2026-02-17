import Link from "next/link";
import WorkspaceEntry from "./components/WorkspaceEntry";
import DemoRequestForm from "./components/DemoRequestForm";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand-navy text-white sticky top-0 z-50 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-lg font-bold tracking-tight" data-testid="text-logo">
            Executive Diagnostics Suite
          </span>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#intelligence" className="text-xs font-medium text-slate-400 hover:text-white transition-colors" data-testid="link-intelligence">
              Intelligenz-Schicht
            </a>
            <a href="#modes" className="text-xs font-medium text-slate-400 hover:text-white transition-colors" data-testid="link-modes">
              Design-Modi
            </a>
            <a href="#architecture" className="text-xs font-medium text-slate-400 hover:text-white transition-colors" data-testid="link-architecture">
              Architektur
            </a>
            <a href="#demo" className="text-xs font-medium text-slate-400 hover:text-white transition-colors" data-testid="link-demo-nav">
              Demo
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#signin"
              className="text-xs font-medium text-slate-300 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-4 py-1.5 transition-colors"
              data-testid="link-signin"
            >
              Anmelden
            </a>
            <a
              href="#demo"
              className="text-xs font-medium text-white bg-brand-blue hover:bg-brand-blue-dark rounded-full px-4 py-1.5 transition-colors"
              data-testid="link-demo-cta"
            >
              Demo vereinbaren
            </a>
          </div>
        </div>
      </header>

      <section className="bg-brand-navy text-white py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="max-w-5xl mx-auto px-6 relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue border border-brand-blue/30 rounded-full px-4 py-1.5">
                Autonome Diagnostik-Plattform
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-[1.15] font-serif" data-testid="text-hero-title">
                Die KI denkt mit.
                <br />
                <span className="text-brand-blue">Sie entscheiden.</span>
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                Nicht noch ein Assessment-Tool. Eine diagnostische Intelligenz-Schicht,
                die Hypothesen bildet, Risiken simuliert und Entwicklungspfade generiert &mdash;
                w&auml;hrend Sie die Kontrolle behalten.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                <a
                  href="#demo"
                  className="rounded-lg bg-brand-blue text-white font-semibold px-8 py-3.5 text-sm hover:bg-brand-blue-dark transition-colors shadow-lg shadow-brand-blue/25"
                  data-testid="button-hero-demo"
                >
                  Live-Demo erleben
                </a>
                <a
                  href="#intelligence"
                  className="rounded-lg border border-white/20 text-white font-medium px-8 py-3.5 text-sm hover:bg-white/5 transition-colors"
                  data-testid="button-hero-explore"
                >
                  Was ist neu?
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                    <span className="text-xs text-white/30 ml-2 font-mono">intelligence.engine</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white/60">Pr&auml;diktive Analyse</p>
                        <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-purple-400 rounded-full" style={{ width: "87%" }} />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-purple-400">87%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white/60">Hypothesen-Validierung</p>
                        <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: "92%" }} />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-blue-400">92%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white/60">Entwicklungspfad</p>
                        <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: "74%" }} />
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">74%</span>
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      3 Risikoindikatoren identifiziert &middot; 2 Szenarien simuliert
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-40">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">DIN 33430 konform</span>
            <span className="text-slate-200">|</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">DSGVO-ready</span>
            <span className="text-slate-200">|</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Multi-Tenant</span>
            <span className="text-slate-200">|</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Offline-f&auml;hig</span>
            <span className="text-slate-200">|</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Enterprise-Grade</span>
          </div>
        </div>
      </section>

      <section id="intelligence" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-600 border border-purple-200 rounded-full px-4 py-1.5 mb-4">
              Was andere nicht haben
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-intelligence-headline">
              Die Advanced Intelligence Layer
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
              Drei KI-gest&uuml;tzte Diagnostik-Module, die &uuml;ber einfache Auswertung hinausgehen.
              Keine Dashboards mit h&uuml;bschen Diagrammen &mdash; sondern echte diagnostische Intelligenz.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="group rounded-2xl border border-slate-200 p-8 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-brand-navy mb-3 font-serif">Predictive Success Intelligence</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                Identifiziert F&uuml;hrungsrisiken in f&uuml;nf Dimensionen: Execution, Stakeholder, Resilienz, Governance und Transformation.
              </p>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-purple-400" />
                  Szenario-Simulationen (Krise, Wachstum, Konflikt)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-purple-400" />
                  Konfidenz-Scoring & Evidenz-Tracking
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-purple-400" />
                  Pr&auml;diktive Erfolgsprofile
                </div>
              </div>
            </div>

            <div className="group rounded-2xl border border-slate-200 p-8 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-brand-navy mb-3 font-serif">Development Path Generator</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                Generiert ma&szlig;geschneiderte Entwicklungspl&auml;ne: 90-Tage-Fokus, 6-Monats-Wachstum, 12-Monats-Positionierung.
              </p>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-400" />
                  Coaching-Fragen & Interventionen
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-400" />
                  Risikominimierungs-Strategien
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-400" />
                  Evidenzbasierte Empfehlungen
                </div>
              </div>
            </div>

            <div className="group rounded-2xl border border-slate-200 p-8 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-brand-navy mb-3 font-serif">Diagnostic Hypothesis Engine</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                Bildet evidenzgest&uuml;tzte Hypothesen mit alternativen Interpretationen und Validierungsschritten.
              </p>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  St&uuml;tzende & kontr&auml;re Evidenz
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  Alternative Interpretationsmodelle
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                  Strukturierte Validierungs-Protokolle
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-slate-400 italic max-w-xl mx-auto">
              Alle KI-Ausgaben sind mit Transparenz-Tags gekennzeichnet, konfidenzbewertet und vollst&auml;ndig audit-geloggt.
              KI verst&auml;rkt das diagnostische Urteil &mdash; sie ersetzt es nicht.
            </p>
          </div>
        </div>
      </section>

      <section id="modes" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-modes-headline">
              Drei Design-Modi. Ihr Grad an Autonomie.
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
              Sie bestimmen, wie viel die KI &uuml;bernimmt &mdash; von vollautomatischer Verfahrensgestaltung
              bis hin zur manuellen Expertensteuerung.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-700" />
              <div className="p-7">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">&#9889;</span>
                  <div>
                    <h3 className="text-base font-bold text-brand-navy">KI-Vollautomatik</h3>
                    <p className="text-[11px] text-purple-600 font-medium">Maximale Automatisierung</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Die KI generiert die komplette Assessment-Architektur: Kompetenzmodell, Verhaltensanker,
                  &Uuml;bungsauswahl, Bewertungskriterien und Beobachtungsb&ouml;gen &mdash; auf Knopfdruck.
                </p>
                <div className="space-y-2">
                  {["Kompetenzmodell-Generierung", "Automatische Übungsauswahl", "KI-Bewertungsbögen", "Sofortige Einsatzbereitschaft"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-3.5 h-3.5 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-700" />
              <div className="p-7">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">&#129302;</span>
                  <div>
                    <h3 className="text-base font-bold text-brand-navy">KI-Unterst&uuml;tzt</h3>
                    <p className="text-[11px] text-blue-600 font-medium">Kollaborative Steuerung</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  KI generiert Vorschl&auml;ge, Sie w&auml;hlen aus, modifizieren und verfeinern.
                  CD-angepasste Varianten auf Basis Ihrer Corporate Identity.
                </p>
                <div className="space-y-2">
                  {["KI-Vorschläge mit Auswahl", "CD-Varianten-Generierung", "Kontextuelle Anpassung", "Style-Guide-Integration"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-2 bg-gradient-to-r from-slate-400 to-slate-600" />
              <div className="p-7">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">&#9995;</span>
                  <div>
                    <h3 className="text-base font-bold text-brand-navy">Manuell</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Volle Expertenkontrolle</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Klassisches Assessment-Design mit voller Kontrolle.
                  W&auml;hlen Sie Module aus der Bibliothek, konfigurieren Sie jeden Aspekt selbst.
                </p>
                <div className="space-y-2">
                  {["Manuelle Modulauswahl", "Eigene Bewertungskriterien", "Volle Konfigurationsfreiheit", "Bibliotheks-Import"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-architecture-headline">
              Adaptive Assessment-Architektur
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
              Anforderungsanalyse ist kein separates Dokument mehr &mdash;
              sie konfiguriert direkt die diagnostische Architektur.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-brand-navy text-white flex items-center justify-center shrink-0 text-sm font-bold">1</div>
                <div>
                  <h3 className="text-base font-bold text-brand-navy mb-1">Anforderung definiert Struktur</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Kompetenzmodelle, Gewichtungen und Skalen werden systemisch aus der Anforderungsanalyse abgeleitet.
                    Keine Copy-Paste-Br&uuml;che zwischen Konzept und Umsetzung.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-brand-navy text-white flex items-center justify-center shrink-0 text-sm font-bold">2</div>
                <div>
                  <h3 className="text-base font-bold text-brand-navy mb-1">Exercise Matching & Generierung</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Scoring-Algorithmus klassifiziert Bibliotheks-&Uuml;bungen in &laquo;sofort einsetzbar&raquo;,
                    &laquo;anzupassen&raquo; oder &laquo;neu zu erstellen&raquo;. KI generiert fehlende &Uuml;bungen.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-brand-navy text-white flex items-center justify-center shrink-0 text-sm font-bold">3</div>
                <div>
                  <h3 className="text-base font-bold text-brand-navy mb-1">Konsolidierung & Diagnostik</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Konfigurierbare Konsolidierungsmethoden (Mittelwert, Median, Trimmed Mean),
                    Varianzberechnung und Moderator-Override f&uuml;r differenziertes Urteil.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center shrink-0 text-sm font-bold">4</div>
                <div>
                  <h3 className="text-base font-bold text-brand-navy mb-1">Offline-First Bewertung</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Beobachter bewerten in einer interaktiven &Uuml;bung-x-Kompetenz-Matrix.
                    localStorage-Caching, Auto-Sync, Konfliktl&ouml;sung &mdash; auch ohne Netz verf&uuml;gbar.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center shrink-0 text-sm font-bold">5</div>
                <div>
                  <h3 className="text-base font-bold text-brand-navy mb-1">Audio-Intelligence</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Aufnahmen werden transkribiert und KI-gest&uuml;tzt zusammengefasst.
                    Konfigurierbare Aufbewahrungsrichtlinien gew&auml;hrleisten DSGVO-Konformit&auml;t.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center shrink-0 text-sm font-bold">6</div>
                <div>
                  <h3 className="text-base font-bold text-brand-navy mb-1">Multi-Format Reporting</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Automatisierte Berichte in DOCX, PDF und PowerPoint.
                    Versioniert, in Object Storage gespeichert, jederzeit reproduzierbar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold font-serif mb-4">
              Was diese Plattform anders macht
            </h2>
            <div className="h-1 w-12 bg-brand-blue mx-auto rounded-full" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: "3", label: "KI-Module", sub: "Predictive, Development, Hypothesis" },
              { value: "5", label: "Risiko-Dimensionen", sub: "Execution bis Transformation" },
              { value: "6", label: "Benutzerrollen", sub: "Granulares RBAC-System" },
              { value: "3", label: "Design-Modi", sub: "Vollautomatik bis Manuell" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-xl border border-white/10 bg-white/5">
                <div className="text-3xl font-bold text-brand-blue mb-1" data-testid={`stat-${stat.label}`}>{stat.value}</div>
                <div className="text-sm font-semibold text-white mb-1">{stat.label}</div>
                <div className="text-[11px] text-slate-400">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-workspace-headline">
              Multi-Tenant Workspace-Isolation
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
              Jede Organisation arbeitet in einem vollst&auml;ndig isolierten Workspace
              mit eigenem Branding, Rollenkonzept und Datenhaltung.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 p-7 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-brand-navy/5 text-brand-navy flex items-center justify-center mb-5">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-brand-navy mb-2">Per-Workspace Theming</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Farben, Schriften, Logos &mdash; alles konfigurierbar. Live-Preview im Theme Editor.
                Corporate-Identity-Regeln als Brand Rule Sets hinterlegbar.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-7 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-brand-navy/5 text-brand-navy flex items-center justify-center mb-5">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-brand-navy mb-2">6-Rollen RBAC</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Admin, Moderator, Beobachter, Projektassistent, HR-Auftraggeber und Kandidat &mdash;
                mit granularer Berechtigung auf Feature-Ebene.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-7 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-brand-navy/5 text-brand-navy flex items-center justify-center mb-5">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-brand-navy mb-2">Consent & Compliance</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Versionierte Einwilligungsvorlagen, granulare Consent-Records
                und API-Level Feature-Gating mit <code className="text-xs bg-slate-100 px-1 rounded">checkConsent()</code>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="signin" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-lg mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-navy font-serif mb-3" data-testid="text-signin-headline">
            In Ihren Workspace anmelden
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Geben Sie den Namen Ihres Workspace ein, um sich anzumelden oder Zugang anzufordern.
          </p>
          <WorkspaceEntry />
          <p className="text-xs text-slate-400 mt-6">
            Noch keinen Workspace?{" "}
            <a href="#demo" className="text-brand-blue hover:text-brand-blue-dark font-medium transition-colors">
              Demo vereinbaren
            </a>
          </p>
        </div>
      </section>

      <section id="demo" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif mb-4" data-testid="text-demo-headline">
                Erleben Sie die Plattform live
              </h2>
              <div className="h-1 w-16 bg-brand-blue rounded-full mb-6" />
              <p className="text-slate-500 leading-relaxed mb-8">
                Keine generische Produktvorstellung. Wir zeigen Ihnen,
                wie die Intelligence Layer auf Ihre spezifischen Assessment-Szenarien reagiert.
              </p>
              <div className="space-y-4">
                {[
                  "Live-Demo der drei KI-Design-Modi",
                  "Predictive Success Intelligence in Aktion",
                  "Exercise Matching & KI-Generierung",
                  "Workspace-Setup mit Ihrem Branding",
                  "Kostenlos und unverbindlich",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <DemoRequestForm />
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-navy text-white border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold font-serif" data-testid="text-closing-headline">
            Diagnostik, die denkt &mdash; nicht nur z&auml;hlt.
          </h2>
          <div className="h-1 w-12 bg-brand-blue mx-auto rounded-full" />
          <p className="text-slate-300 leading-relaxed max-w-xl mx-auto">
            Assessment-Plattformen gibt es viele. Eine autonome Diagnostik-Intelligenz,
            die Hypothesen bildet, Szenarien simuliert und Entwicklungspfade generiert, gibt es einmal.
          </p>
          <div className="pt-6">
            <a
              href="#demo"
              className="inline-block rounded-lg bg-brand-blue text-white font-semibold px-8 py-3.5 text-sm hover:bg-brand-blue-dark transition-colors shadow-lg shadow-brand-blue/25"
              data-testid="button-closing-demo"
            >
              Jetzt Demo vereinbaren
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="font-serif font-bold text-brand-navy text-sm">Executive Diagnostics Suite</p>
              <p className="text-xs text-slate-400 mt-1">
                &copy; Christoph Aldering &middot; Private initiative / concept
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/admin/login"
                className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                data-testid="link-admin-access"
              >
                Plattform-Administration
              </Link>
              <a href="#demo" className="text-[11px] font-medium text-brand-blue hover:text-brand-blue-dark transition-colors">
                Demo vereinbaren
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
