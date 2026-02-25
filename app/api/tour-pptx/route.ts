import { NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";

const NAVY = "0f172a";
const BLUE = "3b82f6";
const WHITE = "FFFFFF";
const SLATE100 = "f1f5f9";
const SLATE400 = "94a3b8";
const SLATE500 = "64748b";
const EMERALD = "10b981";
const RED400 = "f87171";

const slides = [
  {
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
    timeBefore: "1 Woche",
    timeAfter: "2 Stunden",
    timeLabel: "Kompetenzmodell erstellen",
  },
  {
    badge: "Modul-Designer",
    title: "Bausteine hochladen, analysieren und weiterentwickeln",
    description: "Bestehende Assessment-Übungen hochladen und von der KI analysieren lassen — oder komplett neue Bausteine generieren.",
    features: [
      "Bestehende Übungen als Dokument hochladen",
      "KI-gestützte Inhaltsanalyse: Kompetenzen, Schwierigkeit, Lücken",
      "Automatische Kategorisierung und Verschlagwortung",
      "KI-Vorschläge zur Weiterentwicklung",
      "Komplett neue Übungen per KI generieren lassen",
      "Direkte Verknüpfung mit der Anforderungsanalyse",
    ],
    timeBefore: "Manuell",
    timeAfter: "< 5 Min.",
    timeLabel: "Übung analysieren & optimieren",
  },
  {
    badge: "Verknüpfung",
    title: "Anforderungen und Übungen intelligent verknüpft",
    description: "Die Plattform verbindet Anforderungsanalyse und Übungsdesign automatisch — inkl. MTMM-Matrix-Generierung.",
    features: [
      "Automatische Zuordnung: Übungen ↔ Kompetenzen",
      "MTMM-Matrix wird automatisch generiert",
      "Lückenanalyse: Welche Kompetenzen sind noch nicht abgedeckt?",
      "Scoring-Algorithmus prüft Passung zur Anforderung",
      "Versionierung: Änderungen nachvollziehbar dokumentiert",
    ],
    timeBefore: "0,5–1 Tag",
    timeAfter: "Automatisch",
    timeLabel: "MTMM-Matrix erstellen",
  },
  {
    badge: "Case-Studio",
    title: "Fallstudien bauen — oder bauen lassen",
    description: "Maßgeschneiderte Fallstudien in Minuten statt Wochen. Bestehende Cases hochladen und KI-gestützt strukturieren — oder komplett neue generieren lassen.",
    features: [
      "Bestehende Fallstudien hochladen und KI-gestützt strukturieren",
      "Komplett neue Fallstudien per KI generieren",
      "Parameter: Branche, Position, Komplexität, Themenfeld",
      "Automatische Aufgabenstellung und Bewertungsschlüssel",
      "Sofort einsatzfähig mit professionellem Layout",
    ],
    timeBefore: "2–3 Wochen",
    timeAfter: "< 1 Stunde",
    timeLabel: "Fallstudie entwickeln",
  },
  {
    badge: "Fallstudien-Präsentation",
    title: "Ansprechend darreichen — und blitzschnell anpassen",
    description: "Fallstudien werden professionell aufbereitet. Anpassungen an aktuelle Gegebenheiten (Jahreszahlen, Marktdaten) erfolgen in Sekunden.",
    features: [
      "Professionelles, sofort einsetzbares Layout",
      "Auch bestehende Fallstudien ansprechend aufbereiten",
      "Blitzschnelle Anpassung an aktuelle Gegebenheiten",
      "Jahreszahlen, Marktdaten, Kennzahlen sofort aktualisieren",
      "Unternehmensnamen und Branchenkontext individualisieren",
      "Konsistentes Corporate Design des Mandanten",
    ],
    timeBefore: "Stunden",
    timeAfter: "Sekunden",
    timeLabel: "Fallstudie aktualisieren",
  },
  {
    badge: "Beobachtung & Bewertung",
    title: "Strukturiert beobachten, digital erfassen, in Echtzeit zusammenarbeiten",
    description: "Digitale Beobachtungsbögen, Echtzeit-Kollaboration zwischen Beobachtern und sofortige Datenkonsolidierung.",
    features: [
      "Digitale Beobachtungsbögen mit Kompetenzankern",
      "Echtzeit-Kollaboration: Live-Präsenz, Notizen, Activity Feed",
      "Automatische Zuordnung zur MTMM-Matrix",
      "Rating-Erfassung mit Konsistenzprüfung",
      "Versionierung und Locking nach Abgabe",
    ],
    timeBefore: "Manuell",
    timeAfter: "Automatisch",
    timeLabel: "Beobachtungsdaten konsolidieren",
  },
  {
    badge: "Konsolidierung & Reports",
    title: "Von der Beobachtung zum fertigen Bericht — in 30 Minuten",
    description: "Alle Beobachtungsdaten fließen zusammen: MTMM-Matrix, Konsolidierung, KI-gestützte Hypothesen und Empfehlungen.",
    features: [
      "Automatische Score-Konsolidierung (Mean, Median, Trimmed Mean)",
      "MTMM-Matrix-Auswertung mit Visualisierung",
      "KI-generierte diagnostische Hypothesen",
      "KI-gestützte Entwicklungsempfehlungen",
      "Fertige Berichte in DOCX, PDF und PPTX",
      "Professionelles Layout, mandanten-individuell",
    ],
    timeBefore: "4 Stunden",
    timeAfter: "30 Minuten",
    timeLabel: "Ergebnisbericht erstellen",
  },
  {
    badge: "Ausblick: Benchmarks",
    title: "Benchmarks — das wahre Gold der Diagnostik",
    description: "KI-gestützte Auswertung und Aufbau eigener Benchmarks ermöglichen fundierte Einordnung — ein Wettbewerbsvorteil, den kein anderer Anbieter bieten kann.",
    features: [
      "Automatischer Aufbau von Vergleichsdaten über Assessments hinweg",
      "KI-gestützte Normierung und Benchmarking",
      "Branchenspezifische und positionsspezifische Vergleichswerte",
      "Entwicklungstrends über mehrere Assessments sichtbar",
      "Fundierte Einordnung statt isolierter Einzelbewertung",
      "Datenbasis als strategischer Vermögenswert",
    ],
    timeBefore: "Nicht verfügbar",
    timeAfter: "Automatisch",
    timeLabel: "Benchmark-Generierung",
  },
  {
    badge: "Ausblick: Avatare",
    title: "KI-Avatare als Interaktionspartner",
    description: "Realistische KI-Avatare als Gesprächs- und Interaktionspartner — konsistent, skalierbar und mit einstellbarem Schwierigkeitsgrad.",
    features: [
      "Realistische KI-Avatare für Mitarbeiter-, Kunden- und Konfliktgespräche",
      "Konsistentes Verhalten über alle Durchführungen hinweg",
      "Einstellbarer Schwierigkeitsgrad und Persönlichkeitsprofil",
      "Skalierbar: Unbegrenzt viele parallele Simulationen möglich",
      "Adaptiv: Reaktionen passen sich an das Verhalten des Kandidaten an",
      "Kein Engpass durch Rollenspieler-Verfügbarkeit mehr",
    ],
    timeBefore: "Tage/Wochen",
    timeAfter: "Sofort verfügbar",
    timeLabel: "Rollenspieler organisieren",
  },
];

export async function GET() {
  try {
    const pptx = new PptxGenJS();
    pptx.author = "Executive Diagnostics Suite";
    pptx.title = "Produkt-Tour — Augmented Diagnostics";
    pptx.subject = "Plattform-Übersicht";

    pptx.defineSlideMaster({
      title: "MASTER",
      background: { color: WHITE },
      objects: [
        { rect: { x: 0, y: 0, w: "100%", h: 0.6, fill: { color: NAVY } } },
        { text: { text: "Augmented Diagnostics", options: { x: 0.5, y: 0.12, w: 4, h: 0.35, fontSize: 12, fontFace: "Arial", color: "94a3b8", bold: false } } },
        { rect: { x: 0, y: "93%", w: "100%", h: "7%", fill: { color: SLATE100 } } },
        { text: { text: "Executive Diagnostics Suite — Produkt-Tour", options: { x: 0.5, y: 5.15, w: 6, h: 0.3, fontSize: 8, fontFace: "Arial", color: SLATE400 } } },
      ],
    });

    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: NAVY };
    titleSlide.addText("Augmented Diagnostics", {
      x: 0.8, y: 1.2, w: 8.4, h: 0.8,
      fontSize: 36, fontFace: "Arial", color: WHITE, bold: true,
    });
    titleSlide.addText("Produkt-Tour", {
      x: 0.8, y: 2.0, w: 8.4, h: 0.5,
      fontSize: 20, fontFace: "Arial", color: BLUE,
    });
    titleSlide.addText("Diagnostische Expertise, verstärkt durch KI.\nEin System von der Anforderungsanalyse bis zum Ergebnisbericht.", {
      x: 0.8, y: 3.0, w: 7, h: 1.0,
      fontSize: 13, fontFace: "Arial", color: SLATE400, lineSpacingMultiple: 1.5,
    });

    for (let i = 0; i < slides.length; i++) {
      const s = slides[i]!;
      const slide = pptx.addSlide({ masterName: "MASTER" });

      slide.addText(s.badge, {
        x: 0.5, y: 0.8, w: 3, h: 0.3,
        fontSize: 10, fontFace: "Arial", color: BLUE, bold: true,
      });

      slide.addText(s.title, {
        x: 0.5, y: 1.15, w: 9, h: 0.5,
        fontSize: 20, fontFace: "Arial", color: NAVY, bold: true,
      });

      slide.addText(s.description, {
        x: 0.5, y: 1.75, w: 9, h: 0.6,
        fontSize: 11, fontFace: "Arial", color: SLATE500, lineSpacingMultiple: 1.4,
      });

      s.features.forEach((f, fi) => {
        slide.addText(`✓  ${f}`, {
          x: 0.5, y: 2.6 + fi * 0.32, w: 5.5, h: 0.3,
          fontSize: 10, fontFace: "Arial", color: NAVY,
        });
      });

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.5, y: 2.6, w: 3.2, h: 2.2,
        fill: { color: SLATE100 },
        rectRadius: 0.1,
        line: { color: "e2e8f0", width: 1 },
      });

      slide.addText("Zeitersparnis", {
        x: 6.7, y: 2.7, w: 2.8, h: 0.25,
        fontSize: 9, fontFace: "Arial", color: SLATE400, bold: true,
      });

      slide.addText(s.timeLabel, {
        x: 6.7, y: 2.95, w: 2.8, h: 0.25,
        fontSize: 9, fontFace: "Arial", color: SLATE500,
      });

      slide.addText("Bisher", {
        x: 6.7, y: 3.35, w: 1.2, h: 0.2,
        fontSize: 8, fontFace: "Arial", color: RED400,
      });
      slide.addText(s.timeBefore, {
        x: 6.7, y: 3.55, w: 1.2, h: 0.35,
        fontSize: 14, fontFace: "Arial", color: RED400, bold: true,
      });

      slide.addText("→", {
        x: 7.9, y: 3.55, w: 0.4, h: 0.35,
        fontSize: 14, fontFace: "Arial", color: SLATE400, align: "center",
      });

      slide.addText("Mit Plattform", {
        x: 8.3, y: 3.35, w: 1.3, h: 0.2,
        fontSize: 8, fontFace: "Arial", color: EMERALD,
      });
      slide.addText(s.timeAfter, {
        x: 8.3, y: 3.55, w: 1.3, h: 0.35,
        fontSize: 14, fontFace: "Arial", color: EMERALD, bold: true,
      });

      slide.addText(`${i + 1} / ${slides.length}`, {
        x: 8.5, y: 5.15, w: 1.2, h: 0.3,
        fontSize: 8, fontFace: "Arial", color: SLATE400, align: "right",
      });
    }

    const closingSlide = pptx.addSlide();
    closingSlide.background = { color: NAVY };
    closingSlide.addText("Augmented — nicht automatisiert.", {
      x: 0.8, y: 1.5, w: 8.4, h: 0.8,
      fontSize: 28, fontFace: "Arial", color: WHITE, bold: true,
    });
    closingSlide.addText("KI verstärkt die Diagnostik.\nDie fachliche Verantwortung bleibt beim Menschen.", {
      x: 0.8, y: 2.5, w: 7, h: 0.8,
      fontSize: 14, fontFace: "Arial", color: SLATE400, lineSpacingMultiple: 1.5,
    });
    closingSlide.addText("Executive Diagnostics Suite\n© Christoph Aldering · Private initiative – for training reasons only – no data from reality so far!", {
      x: 0.8, y: 4.0, w: 5, h: 0.6,
      fontSize: 10, fontFace: "Arial", color: SLATE500, lineSpacingMultiple: 1.4,
    });

    const buffer = await pptx.write({ outputType: "nodebuffer" }) as Buffer;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": "attachment; filename=Executive-Diagnostics-Produkt-Tour.pptx",
      },
    });
  } catch (error) {
    console.error("PPTX generation error:", error);
    return NextResponse.json({ error: "Failed to generate PPTX" }, { status: 500 });
  }
}
