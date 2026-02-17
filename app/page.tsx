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
            <a href="#features" className="text-xs font-medium text-slate-400 hover:text-white transition-colors" data-testid="link-features">
              Funktionen
            </a>
            <a href="#benefits" className="text-xs font-medium text-slate-400 hover:text-white transition-colors" data-testid="link-benefits">
              Vorteile
            </a>
            <a href="#portals" className="text-xs font-medium text-slate-400 hover:text-white transition-colors" data-testid="link-portals">
              Portale
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

      <section className="bg-brand-navy text-white py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue border border-brand-blue/30 rounded-full px-4 py-1.5 mb-2">
            Enterprise Assessment Platform
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight font-serif" data-testid="text-hero-title">
            Executive Diagnostik{" "}
            <span className="text-brand-blue">neu gedacht</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Assessment Center, Development Center & Management-Diagnostik effizient, valide und KI-gestützt gestalten
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#demo"
              className="rounded-lg bg-brand-blue text-white font-semibold px-8 py-3.5 text-sm hover:bg-brand-blue-dark transition-colors shadow-lg shadow-brand-blue/25"
              data-testid="button-hero-demo"
            >
              Kostenlose Demo vereinbaren
            </a>
            <a
              href="#features"
              className="rounded-lg border border-white/20 text-white font-medium px-8 py-3.5 text-sm hover:bg-white/5 transition-colors"
              data-testid="button-hero-features"
            >
              Mehr erfahren
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-10">
            Vertrauen von Beratungen, Unternehmen & Hochschulen
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {["aestimamus", "Management Diagnostik", "HR Consulting", "Executive Search", "Talent Advisory"].map((name) => (
              <span key={name} className="text-sm font-medium text-slate-300 tracking-wide">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-features-headline">
              Drei Schritte zum Assessment
            </h2>
            <div className="h-1 w-16 bg-brand-blue mx-auto rounded-full mt-4" />
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">
              Von der Planung bis zum Ergebnis &mdash; alles in einer Plattform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Verfahren planen & gestalten",
                desc: "Richten Sie Assessments nach individuellem Bedarf ein. Hinterlegen Sie Kompetenzmodelle, Anforderungsprofile und Übungen. Wählen Sie zwischen KI-Vollautomatik, KI-Unterstützung oder manuellem Design.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                  </svg>
                ),
              },
              {
                step: "2",
                title: "Kandidat*innen bewerten",
                desc: "Beobachter bewerten strukturiert mit der interaktiven Bewertungsmatrix. Offline-fähig, automatisch synchronisiert, mit Evidenz-Tags und Verhaltensankern. Echtzeit-Konsolidierung inklusive.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                ),
              },
              {
                step: "3",
                title: "Ergebnisse analysieren & berichten",
                desc: "Erhalten Sie datenbasierte Einblicke mit KI-gestützter Diagnostik. Automatisierte Ergebnisberichte, Kandidatenvergleiche, prädiktive Analysen und Entwicklungsempfehlungen.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="relative bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-brand-blue/20 hover:shadow-lg hover:shadow-brand-blue/5 transition-all group">
                <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center text-sm font-bold shadow-md">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-5 mt-2">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-brand-navy mb-3">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-benefits-headline">
              Ihre Vorteile
            </h2>
            <div className="h-1 w-16 bg-brand-blue mx-auto rounded-full mt-4" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Wissenschaftlich fundiert",
                desc: "Alle Verfahren orientieren sich an der DIN 33430 und aktuellen Standards der Eignungsdiagnostik.",
                icon: "🎯",
              },
              {
                title: "KI-gestützte Intelligenz",
                desc: "Prädiktive Erfolgsanalysen, Entwicklungspfade und diagnostische Hypothesen auf Knopfdruck.",
                icon: "🧠",
              },
              {
                title: "Multi-Tenant & Workspace-basiert",
                desc: "Jede Organisation arbeitet in ihrem eigenen Workspace mit individuellem Branding und Zugangskontrolle.",
                icon: "🏢",
              },
              {
                title: "Effizienz & Zeitersparnis",
                desc: "Automatisierte Berichte, KI-Konsolidierung und strukturierte Bewertungsbögen sparen wertvolle Zeit.",
                icon: "⚡",
              },
              {
                title: "DSGVO-konform",
                desc: "Granulares Consent-Management, versionierte Einwilligungen und vollständige Audit-Trails.",
                icon: "🔒",
              },
              {
                title: "Drei Design-Modi",
                desc: "Wählen Sie zwischen KI-Vollautomatik, KI-Unterstützung oder klassischem manuellen Design.",
                icon: "🎨",
              },
            ].map((benefit) => (
              <div key={benefit.title} className="bg-white rounded-xl p-6 border border-slate-200 flex gap-5">
                <div className="text-2xl shrink-0 mt-0.5">{benefit.icon}</div>
                <div>
                  <h3 className="font-semibold text-brand-navy mb-1.5">{benefit.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="portals" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-portals-headline">
              Dedizierte Portale f&uuml;r jede Rolle
            </h2>
            <div className="h-1 w-16 bg-brand-blue mx-auto rounded-full mt-4" />
            <p className="text-slate-500 mt-4 max-w-xl mx-auto">
              Jeder Beteiligte erh&auml;lt genau die Oberfl&auml;che, die er braucht
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-2 bg-brand-navy" />
              <div className="p-7">
                <div className="w-12 h-12 rounded-xl bg-brand-navy/5 text-brand-navy flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-brand-navy mb-2">Admin-Cockpit</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Projekte verwalten, Assessments konfigurieren, Kompetenzmodelle aufbauen, Berichte erstellen und KI-gestützte Diagnostik steuern.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Projektverwaltung", "Assessment-Design", "Berichte", "KI-Diagnostik"].map((tag) => (
                    <span key={tag} className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-2" style={{ backgroundColor: "hsl(14, 48%, 44%)" }} />
              <div className="p-7">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "hsl(14, 48%, 95%)" }}>
                  <svg className="w-6 h-6" style={{ color: "hsl(14, 48%, 44%)" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-brand-navy mb-2">Beobachter-Desk</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Strukturierte Bewertungsmatrix mit Offline-Modus, automatischer Synchronisation, Evidenz-Tagging und Konfliktl&ouml;sung.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Bewertungsmatrix", "Offline-fähig", "Auto-Sync", "Evidenz-Tags"].map((tag) => (
                    <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "hsl(14, 48%, 95%)", color: "hsl(14, 48%, 44%)" }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-2 bg-brand-blue" />
              <div className="p-7">
                <div className="w-12 h-12 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-brand-navy mb-2">Kandidat*innen-Portal</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Pers&ouml;nliches Portal mit Assessment-&Uuml;bersicht, &Uuml;bungsdetails, Unterlagen-Download, Zeitplan und Einwilligungsmanagement.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Assessment-Info", "Übungen", "Unterlagen", "Consent"].map((tag) => (
                    <span key={tag} className="text-[10px] font-medium bg-blue-50 text-brand-blue px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "6", label: "Benutzerrollen" },
              { value: "3", label: "Design-Modi" },
              { value: "100%", label: "DSGVO-konform" },
              { value: "24/7", label: "Offline-fähig" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold text-brand-blue mb-1" data-testid={`stat-${stat.label}`}>{stat.value}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif" data-testid="text-innovation-headline">
              Innovation im Kern
            </h2>
            <div className="h-1 w-16 bg-brand-blue mx-auto rounded-full mt-4" />
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-5">
              <div className="h-1 w-10 bg-brand-blue rounded-full" />
              <h3 className="text-lg font-semibold text-brand-navy">
                Dynamische Assessment-Architektur
              </h3>
              <div className="space-y-4 text-slate-500 text-sm leading-relaxed">
                <p>
                  Anforderungsanalyse ist kein separates Dokument mehr.
                  Die Ergebnisse konfigurieren direkt die Assessment-Architektur.
                </p>
                <p>
                  Validierte Module werden gem&auml;&szlig; DIN 33430 ausgew&auml;hlt und zusammengestellt.
                  Kompetenzen, Gewichtung, Skalen und Verhaltensanker sind systemisch verkn&uuml;pft.
                </p>
                <p className="font-medium text-brand-navy">
                  Assessment-Design wird adaptiv &mdash; nicht statisch.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="h-1 w-10 bg-brand-blue rounded-full" />
              <h3 className="text-lg font-semibold text-brand-navy">
                KI-gest&uuml;tzte Intelligenz-Schicht
              </h3>
              <div className="space-y-4 text-slate-500 text-sm leading-relaxed">
                <p>
                  Pr&auml;diktive Erfolgsanalysen identifizieren Risiken und Potenziale. Entwicklungspfade generieren 90-Tage bis 12-Monats-Pl&auml;ne.
                </p>
                <p>
                  Diagnostische Hypothesen verkn&uuml;pfen Evidenzen mit alternativen Interpretationen und Validierungsschritten.
                </p>
                <p className="font-medium text-brand-navy">
                  KI verst&auml;rkt das Urteil &mdash; sie automatisiert es nicht.
                </p>
              </div>
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
                Kostenlose Demo vereinbaren
              </h2>
              <div className="h-1 w-16 bg-brand-blue rounded-full mb-6" />
              <p className="text-slate-500 leading-relaxed mb-8">
                Vereinbaren Sie einen pers&ouml;nlichen Demo-Termin mit uns.
                Wir freuen uns, Ihnen die Executive Diagnostics Suite pr&auml;sentieren zu d&uuml;rfen.
              </p>
              <div className="space-y-4">
                {[
                  "Live-Demonstration aller Funktionen",
                  "Individuelle Beratung für Ihren Anwendungsfall",
                  "Einrichtung Ihres eigenen Workspace",
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

      <section className="py-24 bg-brand-navy text-white border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold font-serif" data-testid="text-closing-headline">
            Diagnostik f&uuml;r strategische Konsequenz
          </h2>
          <div className="h-1 w-12 bg-brand-blue mx-auto rounded-full" />
          <p className="text-slate-300 leading-relaxed max-w-xl mx-auto">
            Wenn F&uuml;hrungsentscheidungen die Unternehmensentwicklung pr&auml;gen,
            muss die zugrunde liegende diagnostische Architektur ebenso robust sein.
          </p>
          <p className="text-white font-medium">
            Die Executive Diagnostics Suite ist f&uuml;r diese Verantwortung gebaut.
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
