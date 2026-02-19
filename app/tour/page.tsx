"use client";
import { useState } from "react";
import Link from "next/link";

const slides = [
  {
    id: 1,
    badge: "Anforderungsanalyse",
    title: "Von der Anforderung zum Assessment-Design",
    description: "Der erste Schritt jedes Assessment Centers: Was wird gesucht? Die Plattform überführt Stellenprofile und Anforderungen in ein strukturiertes Assessment-Design — mit KI-Unterstützung oder manuell.",
    features: [
      "Stellenprofile hochladen oder manuell eingeben",
      "KI leitet Kompetenzmodelle automatisch ab",
      "Verhaltensanker werden pro Kompetenz operationalisiert",
      "Direkte Verknüpfung mit dem Übungsdesign",
      "Ergebnis: Ein vollständiges, maßgeschneidertes Assessment-Framework",
    ],
    icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
    accent: "from-blue-500 to-indigo-600",
    timeLabel: "Kompetenzmodell erstellen",
    timeBefore: "1 Woche",
    timeAfter: "2 Stunden",
  },
  {
    id: 2,
    badge: "Modul-Designer",
    title: "Bausteine hochladen, analysieren und weiterentwickeln",
    description: "Bestehende Assessment-Übungen hochladen und von der KI analysieren lassen — oder komplett neue Bausteine generieren. Die KI erkennt Kompetenzabdeckung, Schwierigkeitsgrad und Optimierungspotenzial.",
    features: [
      "Bestehende Übungen als Dokument hochladen",
      "KI-gestützte Inhaltsanalyse: Kompetenzen, Schwierigkeit, Lücken",
      "Automatische Kategorisierung und Verschlagwortung",
      "KI-Vorschläge zur Weiterentwicklung",
      "Komplett neue Übungen per KI generieren lassen",
      "Direkte Verknüpfung mit der Anforderungsanalyse",
    ],
    icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
    accent: "from-emerald-500 to-teal-600",
    timeLabel: "Übung analysieren & optimieren",
    timeBefore: "Manuell",
    timeAfter: "< 5 Min.",
  },
  {
    id: 3,
    badge: "Verknüpfung",
    title: "Anforderungen und Übungen intelligent verknüpft",
    description: "Die Plattform verbindet Anforderungsanalyse und Übungsdesign automatisch — inkl. MTMM-Matrix-Generierung. Jede Übung wird den passenden Kompetenzen zugeordnet, Lücken werden sofort sichtbar.",
    features: [
      "Automatische Zuordnung: Übungen ↔ Kompetenzen",
      "MTMM-Matrix wird automatisch generiert",
      "Lückenanalyse: Welche Kompetenzen sind noch nicht abgedeckt?",
      "Scoring-Algorithmus prüft Passung zur Anforderung",
      "Versionierung: Änderungen nachvollziehbar dokumentiert",
    ],
    icon: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244",
    accent: "from-violet-500 to-purple-600",
    timeLabel: "MTMM-Matrix erstellen",
    timeBefore: "0,5–1 Tag",
    timeAfter: "Automatisch",
  },
  {
    id: 4,
    badge: "Case-Studio",
    title: "Fallstudien bauen — oder bauen lassen",
    description: "Maßgeschneiderte Fallstudien in Minuten statt Wochen. Bestehende Cases hochladen und KI-gestützt strukturieren — oder komplett neue generieren lassen, passgenau für Branche, Position und Schwierigkeitsgrad.",
    features: [
      "Bestehende Fallstudien hochladen und KI-gestützt strukturieren",
      "Komplett neue Fallstudien per KI generieren",
      "Parameter: Branche, Position, Komplexität, Themenfeld",
      "Automatische Aufgabenstellung und Bewertungsschlüssel",
      "Sofort einsatzfähig mit professionellem Layout",
    ],
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    accent: "from-orange-500 to-red-500",
    timeLabel: "Fallstudie entwickeln",
    timeBefore: "2–3 Wochen",
    timeAfter: "< 1 Stunde",
  },
  {
    id: 5,
    badge: "Fallstudien-Präsentation",
    title: "Ansprechend darreichen — und blitzschnell anpassen",
    description: "Fallstudien — ob neu generiert oder bestehend — werden professionell aufbereitet und dargeboten. Anpassungen an aktuelle Gegebenheiten (Jahreszahlen, Marktdaten, Unternehmensnamen) erfolgen in Sekunden.",
    features: [
      "Professionelles, sofort einsetzbares Layout",
      "Auch bestehende Fallstudien ansprechend aufbereiten",
      "Blitzschnelle Anpassung an aktuelle Gegebenheiten",
      "Jahreszahlen, Marktdaten, Kennzahlen sofort aktualisieren",
      "Unternehmensnamen und Branchenkontext individualisieren",
      "Konsistentes Corporate Design des Mandanten",
    ],
    icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605",
    accent: "from-pink-500 to-rose-600",
    timeLabel: "Fallstudie aktualisieren",
    timeBefore: "Stunden",
    timeAfter: "Sekunden",
  },
  {
    id: 6,
    badge: "Beobachtung & Bewertung",
    title: "Strukturiert beobachten, digital erfassen, in Echtzeit zusammenarbeiten",
    description: "Das Herzstück jedes Assessment Centers: die strukturierte Beobachtung. Digitale Beobachtungsbögen, Echtzeit-Kollaboration zwischen Beobachtern und sofortige Datenkonsolidierung.",
    features: [
      "Digitale Beobachtungsbögen mit Kompetenzankern",
      "Echtzeit-Kollaboration: Live-Präsenz, Notizen, Activity Feed",
      "Automatische Zuordnung zur MTMM-Matrix",
      "Rating-Erfassung mit Konsistenzprüfung",
      "Versionierung und Locking nach Abgabe",
    ],
    icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    accent: "from-cyan-500 to-blue-600",
    timeLabel: "Beobachtungsdaten konsolidieren",
    timeBefore: "Manuell",
    timeAfter: "Automatisch",
  },
  {
    id: 7,
    badge: "Konsolidierung & Reports",
    title: "Von der Beobachtung zum fertigen Bericht — in 30 Minuten",
    description: "Alle Beobachtungsdaten fließen zusammen: MTMM-Matrix, Konsolidierung, KI-gestützte Hypothesen und Empfehlungen — bis zum fertigen Ergebnisbericht in DOCX, PDF oder PowerPoint.",
    features: [
      "Automatische Score-Konsolidierung (Mean, Median, Trimmed Mean)",
      "MTMM-Matrix-Auswertung mit Visualisierung",
      "KI-generierte diagnostische Hypothesen",
      "KI-gestützte Entwicklungsempfehlungen",
      "Fertige Berichte in DOCX, PDF und PPTX",
      "Professionelles Layout, mandanten-individuell",
    ],
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    accent: "from-amber-500 to-orange-600",
    timeLabel: "Ergebnisbericht erstellen",
    timeBefore: "4 Stunden",
    timeAfter: "30 Minuten",
  },
  {
    id: 8,
    badge: "Ausblick",
    title: "Benchmarks — das wahre Gold der Diagnostik",
    description: "Mit jeder Durchführung wächst die Datenbasis. KI-gestützte Auswertung und der Aufbau eigener Benchmarks ermöglichen fundierte Einordnung und Vergleichbarkeit — ein Wettbewerbsvorteil, den kein anderer Anbieter bieten kann.",
    features: [
      "Automatischer Aufbau von Vergleichsdaten über Assessments hinweg",
      "KI-gestützte Normierung und Benchmarking",
      "Branchenspezifische und positionsspezifische Vergleichswerte",
      "Entwicklungstrends über mehrere Assessments sichtbar",
      "Fundierte Einordnung statt isolierter Einzelbewertung",
      "Datenbasis als strategischer Vermögenswert",
    ],
    icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941",
    accent: "from-yellow-500 to-amber-600",
    timeLabel: "Benchmark-Generierung",
    timeBefore: "Nicht verfügbar",
    timeAfter: "Automatisch",
    isOutlook: true,
  },
  {
    id: 9,
    badge: "Ausblick",
    title: "KI-Avatare als Interaktionspartner",
    description: "Die Zukunft der Simulationsübungen: Realistische KI-Avatare als Gesprächs- und Interaktionspartner — konsistent, skalierbar und mit einstellbarem Schwierigkeitsgrad. Keine Rollenspieler-Verfügbarkeit mehr als Engpass.",
    features: [
      "Realistische KI-Avatare für Mitarbeiter-, Kunden- und Konfliktgespräche",
      "Konsistentes Verhalten über alle Durchführungen hinweg",
      "Einstellbarer Schwierigkeitsgrad und Persönlichkeitsprofil",
      "Skalierbar: Unbegrenzt viele parallele Simulationen möglich",
      "Adaptiv: Reaktionen passen sich an das Verhalten des Kandidaten an",
      "Kein Engpass durch Rollenspieler-Verfügbarkeit mehr",
    ],
    icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
    accent: "from-indigo-500 to-violet-600",
    timeLabel: "Rollenspieler organisieren",
    timeBefore: "Tage/Wochen",
    timeAfter: "Sofort verfügbar",
    isOutlook: true,
  },
];

export default function TourPage() {
  const [current, setCurrent] = useState(0);
  const slide = slides[current]!;
  const progress = ((current + 1) / slides.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="tour-page">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-brand-navy font-serif font-bold text-lg hover:text-brand-blue transition-colors" data-testid="link-back-home">
            ← Zurück zur Startseite
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">{current + 1} / {slides.length}</span>
            <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-brand-navy rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-6">
        <div className="max-w-4xl w-full">
          <div className="flex items-center gap-3 mb-6">
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full tracking-wider uppercase text-white bg-gradient-to-r ${slide.accent}`}>
              {slide.badge}
            </span>
            {(slide as any).isOutlook && (
              <span className="inline-block px-3 py-1 text-[10px] font-semibold rounded-full bg-slate-200 text-slate-500 uppercase tracking-wider">
                Zukunftsvision
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-brand-navy font-serif mb-4" data-testid="text-slide-title">
            {slide.title}
          </h1>
          <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-8 max-w-3xl">
            {slide.description}
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${slide.accent} text-white flex items-center justify-center`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={slide.icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wider">Features</h3>
              </div>
              <ul className="space-y-3">
                {slide.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-sm text-slate-600">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex-1">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Zeitersparnis</h3>
                <p className="text-xs text-slate-500 mb-4">{slide.timeLabel}</p>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Bisher</p>
                    <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-center">
                      <span className="text-lg font-bold text-red-400">{slide.timeBefore}</span>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-slate-300 shrink-0 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-[10px] text-emerald-600 uppercase tracking-wider mb-1">Mit Plattform</p>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 text-center">
                      <span className="text-lg font-bold text-emerald-600">{slide.timeAfter}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-100 rounded-2xl p-4">
                <div className="flex gap-1 overflow-x-auto">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setCurrent(i)}
                      className={`shrink-0 w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                        i === current
                          ? "bg-brand-navy text-white shadow-md"
                          : i < current
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-200"
                      }`}
                      data-testid={`button-slide-${i}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <button
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid="button-prev"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Zurück
          </button>

          <div className="flex items-center gap-3">
            <Link
              href="/api/tour-pptx"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
              data-testid="button-download-pptx"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              PPTX herunterladen
            </Link>
          </div>

          <button
            onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))}
            disabled={current === slides.length - 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-navy hover:bg-brand-navy/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid="button-next"
          >
            Weiter
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
