import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import { ensureHex } from "@/lib/color-utils";
import Link from "next/link";

interface Props {
  params: { workspaceSlug: string };
}

export default async function ModulesPage({ params }: Props) {
  const wsAuth = getWorkspaceAuth();
  const masterAuth = hasMasterAuth();
  const userSession = getUserSession();

  const hasUserAccess =
    userSession &&
    userSession.workspaceSlug === params.workspaceSlug &&
    !userSession.roles.includes("CANDIDATE");

  if (!masterAuth && wsAuth !== params.workspaceSlug && !hasUserAccess) {
    redirect(`/w/${params.workspaceSlug}/login`);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    include: { theme: true },
  });

  if (!workspace) {
    notFound();
  }

  const t = workspace.theme;
  const primary = ensureHex(t?.primaryColor ?? "#3b82f6");
  const textColor = ensureHex(t?.textColor ?? "#1a1a1a");
  const bgColor = ensureHex(t?.backgroundColor ?? "#ffffff");
  const headingFont = t?.fontFamilyHeading ?? "Playfair Display";

  const base = `/w/${params.workspaceSlug}/admin`;

  const [assessmentCount, exerciseLibCount, observationTemplateCount, caseStudyCount] = await Promise.all([
    prisma.assessment.count({ where: { workspaceId: workspace.id } }),
    prisma.exerciseLibraryItem.count({ where: { workspaceId: workspace.id } }),
    prisma.observationSheetTemplate.count({ where: { workspaceId: workspace.id } }),
    prisma.caseStudy.count({ where: { workspaceId: workspace.id } }),
  ]);

  const phases = [
    {
      id: "planning",
      number: 1,
      title: "Planung & Design",
      description: "Assessment-Grundlagen definieren und Anforderungen klären",
      status: "active" as const,
      modules: [
        {
          title: "Projekt anlegen",
          subtitle: "Assessment erstellen & Grunddaten pflegen",
          description: "Neues Assessment-Projekt anlegen mit Name, Kunde, Zielposition, Zeitraum und Beschreibung. Bildet die Grundlage für alle weiteren Schritte.",
          href: `${base}/assessments`,
          tags: ["Grunddaten", "Zielposition", "Zeitraum"],
          status: "active" as const,
          count: assessmentCount,
          countLabel: "Projekte",
        },
        {
          title: "Anforderungsanalyse",
          subtitle: "Kompetenzen & Anforderungsprofil definieren",
          description: "Strukturierte Anforderungsanalyse durchführen: Kompetenzen definieren, Verhaltensanker formulieren, Anforderungsprofil für die Zielposition erstellen.",
          href: `${base}/requirements`,
          tags: ["Kompetenzen", "Verhaltensanker", "Profil"],
          status: "active" as const,
        },
        {
          title: "MTMM-Matrix",
          subtitle: "Übung-Kompetenz-Zuordnung erstellen",
          description: "Multi-Trait-Multi-Method-Matrix erstellen: Kompetenzen den Übungen zuordnen, Gewichtungen festlegen und methodische Absicherung sicherstellen.",
          href: `${base}/competencies`,
          tags: ["Zuordnung", "Gewichtung", "Validierung"],
          status: "active" as const,
        },
      ],
    },
    {
      id: "assembly",
      number: 2,
      title: "Zusammenstellung",
      description: "Übungen, Beobachtungsbögen und Materialien zusammenstellen",
      status: "active" as const,
      modules: [
        {
          title: "Übungsbibliothek",
          subtitle: "Übungen erstellen, importieren & verwalten",
          description: "Wiederverwendbare Übungen verwalten: Neue Übungen erstellen, aus der Bibliothek importieren, KI-generierte Varianten erzeugen oder CD-adaptierte Versionen anlegen.",
          href: `${base}/exercise-library`,
          tags: ["CRUD", "KI-Generierung", "Varianten", "CD-Adaption"],
          status: "active" as const,
          count: exerciseLibCount,
          countLabel: "Übungen",
        },
        {
          title: "Beobachtungsbögen",
          subtitle: "Bögen erstellen, KI-generieren & zuordnen",
          description: "Beobachtungsbögen für die strukturierte Bewertung erstellen: Manuell, per Vorlage oder KI-generiert. Upload bestehender Bögen mit automatischer Inhaltsanalyse.",
          href: `${base}/observation-sheets`,
          tags: ["Builder", "KI-Analyse", "Upload", "Vorlagen"],
          status: "active" as const,
          count: observationTemplateCount,
          countLabel: "Vorlagen",
        },
        {
          title: "Fallstudien-Builder",
          subtitle: "Fallstudien erstellen & in Datenräume überführen",
          description: "Bestehende Fallstudien hochladen und per KI in strukturierte Datenräume überführen, oder neue Fallstudien auf Basis von Kernfragen KI-generieren lassen.",
          href: `${base}/modules/case-study-builder`,
          tags: ["Upload", "KI-Generierung", "Datenraum"],
          status: "active" as const,
          count: caseStudyCount,
          countLabel: "Fallstudien",
        },
      ],
    },
    {
      id: "config",
      number: 3,
      title: "Konfiguration & Freigabe",
      description: "Assessment validieren, konfigurieren und zur Durchführung freigeben",
      status: "active" as const,
      modules: [
        {
          title: "AC konfigurieren",
          subtitle: "Validierung, Workflow & Freischaltung",
          description: "Assessment vollständig konfigurieren: Validierungsprüfung durchführen, Workflow-Einstellungen festlegen (Auto-Konsolidierung, Beobachter-Rollen, Notizen-Sharing) und zur Durchführung freischalten.",
          href: `${base}/assessments`,
          tags: ["Validierung", "Workflow", "Freischaltung"],
          status: "active" as const,
        },
        {
          title: "Corporate Design",
          subtitle: "Brand & Style Guide Management",
          description: "Style Guides hochladen (PDF/DOCX), Branding-Regeln definieren und per KI-Analyse automatisch extrahieren. Regeln auf Übungen, Dokumente und Exporte anwenden.",
          href: `${base}/brand-rules`,
          tags: ["KI-Analyse", "Regelsets", "CD-Varianten"],
          status: "active" as const,
        },
      ],
    },
    {
      id: "execution",
      number: 4,
      title: "Durchführung",
      description: "Assessment durchführen mit Teilnehmer- und Beobachter-Portalen",
      status: "development" as const,
      modules: [
        {
          title: "Einladungsmanagement",
          subtitle: "Teilnehmer einladen & Zugangscodes versenden",
          description: "Kandidaten und Beobachter zum Assessment einladen: Personalisierte Einladungen per E-Mail, individuelle Zugangscodes generieren, Terminplanung und Erinnerungen.",
          tags: ["Einladungen", "Zugangscodes", "E-Mail"],
          status: "development" as const,
        },
        {
          title: "Teilnehmer-Portal",
          subtitle: "Kandidaten-Sicht für die Übungsdurchführung",
          description: "Portal für Kandidaten: Übungen einsehen und durchführen, Fallstudien-Datenraum nutzen, Dokumente herunterladen, zeitgesteuerte Aufgaben bearbeiten.",
          tags: ["Kandidaten-Sicht", "Übungen", "Datenraum"],
          status: "partial" as const,
        },
        {
          title: "Beobachter-Portal",
          subtitle: "Ratings erfassen & Live-Zusammenarbeit",
          description: "Portal für Beobachter: Strukturierte Bewertungen in Echtzeit erfassen, gemeinsame Notizen führen, Live-Präsenz sehen, Beobachtungsbögen ausfüllen.",
          tags: ["Ratings", "Live-Notizen", "Zusammenarbeit"],
          status: "partial" as const,
        },
      ],
    },
    {
      id: "analysis",
      number: 5,
      title: "Auswertung",
      description: "Ergebnisse konsolidieren, auswerten und berichten",
      status: "partial" as const,
      modules: [
        {
          title: "Konsolidierung & Berichte",
          subtitle: "Ergebnisse zusammenführen & Berichte generieren",
          description: "Beobachter-Ratings konsolidieren (Mittelwert, Median, getrimmt), Kompetenzprofile erstellen, umfassende Berichte in DOCX/PDF/PPTX generieren.",
          href: `${base}/reports`,
          tags: ["Konsolidierung", "DOCX", "PDF", "PPTX"],
          status: "active" as const,
        },
        {
          title: "Analytics & Benchmarks",
          subtitle: "Normwerte, Vergleiche & Visualisierungen",
          description: "Normierte Kompetenzwerte, Benchmark-Vergleiche, Kompetenz-Durchschnitte und Ausreißer-Erkennung. Visuelle Auswertungen und Dashboards.",
          href: `${base}/analytics`,
          tags: ["Normwerte", "Benchmarks", "Visualisierung"],
          status: "active" as const,
        },
        {
          title: "Advanced Intelligence",
          subtitle: "KI-gestützte Diagnostik & Empfehlungen",
          description: "Predictive Success Intelligence, Development Path Generator und Diagnostic Hypothesis Engine: KI-basierte Einschätzungen mit Konfidenz-Scores und Evidenz-Tracking.",
          href: `${base}/intelligence`,
          tags: ["Prädiktiv", "Entwicklungspfade", "Hypothesen"],
          status: "active" as const,
        },
      ],
    },
    {
      id: "evaluation",
      number: 6,
      title: "Evaluation",
      description: "Qualitätssicherung und Prozess-Evaluation des Assessment Centers",
      status: "planned" as const,
      modules: [
        {
          title: "Prozess-Evaluation",
          subtitle: "Qualität des AC-Verfahrens bewerten",
          description: "Systematische Evaluation des Assessment-Center-Verfahrens: Reliabilität, Validität, Fairness und Akzeptanz des Prozesses überprüfen und dokumentieren.",
          tags: ["Reliabilität", "Validität", "Fairness"],
          status: "planned" as const,
        },
        {
          title: "Feedback-Management",
          subtitle: "Strukturiertes Feedback an Teilnehmer",
          description: "Individuelles Feedback für Kandidaten erstellen und übermitteln: Kompetenzprofile, Entwicklungsempfehlungen und Stärken-/Schwächen-Analyse.",
          tags: ["Feedback", "Empfehlungen", "Entwicklung"],
          status: "planned" as const,
        },
      ],
    },
  ];

  const crossTools = [
    {
      title: "Benutzer & Rollen",
      subtitle: "RBAC-Rollenverwaltung",
      description: "Benutzer anlegen und Rollen zuweisen (Admin, Moderator, Beobachter, HR-Auftraggeber, Kandidat). Zugriffsrechte und Berechtigungen verwalten.",
      href: `${base}/users`,
      tags: ["Rollen", "Berechtigungen", "Benutzer"],
    },
    {
      title: "Einwilligungen",
      subtitle: "DSGVO-konforme Consent-Verwaltung",
      description: "Versionierte Einwilligungsvorlagen, granulare Consent-Records und Feature-Gating auf API-Ebene.",
      href: `${base}/consents`,
      tags: ["DSGVO", "Consent", "Vorlagen"],
    },
    {
      title: "Audio-Verarbeitung",
      subtitle: "Transkription & KI-Zusammenfassung",
      description: "Audio-Dateien hochladen, automatisch transkribieren (OpenAI) und strukturierte KI-Zusammenfassungen generieren.",
      href: `${base}/audio`,
      tags: ["Transkription", "KI", "Zusammenfassung"],
    },
    {
      title: "Workspace-Theme",
      subtitle: "Branding & Design anpassen",
      description: "Farben, Schriften und Logo des Workspaces anpassen. Live-Vorschau aller Änderungen.",
      href: `${base}/theme`,
      tags: ["Farben", "Schriften", "Logo"],
    },
  ];

  const statusConfig = {
    active: { label: "Verfügbar", bg: "#16a34a", textColor: "#ffffff" },
    partial: { label: "Teilweise", bg: "#f59e0b", textColor: "#ffffff" },
    development: { label: "In Entwicklung", bg: "#8b5cf6", textColor: "#ffffff" },
    planned: { label: "Geplant", bg: "transparent", textColor: "#94a3b8", border: "#cbd5e1" },
  };

  const phaseStatusConfig = {
    active: { dotColor: "#16a34a", lineColor: "#16a34a" },
    partial: { dotColor: "#f59e0b", lineColor: "#f59e0b" },
    development: { dotColor: "#8b5cf6", lineColor: "#8b5cf6" },
    planned: { dotColor: "#cbd5e1", lineColor: "#cbd5e1" },
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor, color: textColor }}>
      <header className="text-white sticky top-0 z-50" style={{ backgroundColor: primary }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`${base}`}
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
              data-testid="link-back-dashboard"
            >
              ← Dashboard
            </Link>
            <span
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: `'${headingFont}', serif` }}
            >
              {workspace.name}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="mb-10">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: `'${headingFont}', serif` }}
            data-testid="text-modules-title"
          >
            Assessment-Center Lifecycle
          </h1>
          <p className="text-sm mt-1 opacity-50">
            Alle Module und Werkzeuge im Überblick — vom Projektstart bis zur Evaluation
          </p>
        </div>

        {phases.map((phase, phaseIdx) => {
          const pStatus = phaseStatusConfig[phase.status];
          const isLastPhase = phaseIdx === phases.length - 1;
          const isPlannedOrDev = phase.status === "planned" || phase.status === "development";

          return (
            <section
              key={phase.id}
              className={`relative mb-2 ${isPlannedOrDev ? "opacity-70" : ""}`}
              data-testid={`section-phase-${phase.id}`}
            >
              <div className="flex gap-6">
                <div className="flex flex-col items-center shrink-0 w-8">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 z-10"
                    style={{ backgroundColor: pStatus.dotColor }}
                    data-testid={`phase-dot-${phase.id}`}
                  >
                    {phase.number}
                  </div>
                  {!isLastPhase && (
                    <div
                      className="w-0.5 flex-1 min-h-[2rem]"
                      style={{ backgroundColor: pStatus.lineColor }}
                    />
                  )}
                </div>

                <div className="flex-1 pb-10">
                  <div className="mb-4">
                    <h2
                      className="text-lg font-bold tracking-tight"
                      style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
                      data-testid={`text-phase-title-${phase.id}`}
                    >
                      {phase.title}
                    </h2>
                    <p className="text-xs opacity-50 mt-0.5">{phase.description}</p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {phase.modules.map((mod) => {
                      const mStatus = statusConfig[mod.status];
                      const isLinked = "href" in mod && mod.href;
                      const card = (
                        <div
                          className={`rounded-xl border p-5 transition-all ${isLinked ? "hover:shadow-lg group cursor-pointer" : ""} ${mod.status === "planned" || mod.status === "development" ? "opacity-60" : ""}`}
                          style={{ borderColor: `${primary}15`, backgroundColor: bgColor }}
                          data-testid={`card-module-${mod.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-semibold text-sm ${isLinked ? "group-hover:underline" : ""}`}
                                style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
                              >
                                {mod.title}
                              </h3>
                              <p className="text-[11px] opacity-50 mt-0.5">{mod.subtitle}</p>
                            </div>
                            <span
                              className="text-[10px] font-bold rounded-full px-2.5 py-1 shrink-0 ml-2"
                              style={{
                                backgroundColor: mStatus.bg,
                                color: mStatus.textColor,
                                border: "border" in mStatus ? `1px solid ${mStatus.border}` : "none",
                              }}
                            >
                              {mStatus.label}
                            </span>
                          </div>

                          <p className="text-xs opacity-55 leading-relaxed mb-3 line-clamp-3">
                            {mod.description}
                          </p>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {mod.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-full opacity-40"
                                style={{ border: `1px solid ${primary}30` }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            {"count" in mod && mod.count !== undefined && (
                              <span className="text-[11px] font-medium opacity-40">
                                {mod.count} {mod.countLabel}
                              </span>
                            )}
                            {isLinked && (
                              <span className="text-xs opacity-40 ml-auto">→ Öffnen</span>
                            )}
                          </div>
                        </div>
                      );

                      if (isLinked) {
                        return (
                          <Link
                            key={mod.title}
                            href={mod.href!}
                            data-testid={`link-module-${mod.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                          >
                            {card}
                          </Link>
                        );
                      }
                      return <div key={mod.title}>{card}</div>;
                    })}
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${primary}15` }}>
          <div className="mb-6">
            <h2
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
              data-testid="text-cross-tools-title"
            >
              Querschnitts-Werkzeuge
            </h2>
            <p className="text-xs opacity-50 mt-0.5">
              Phasenübergreifende Module für Administration, Compliance und Konfiguration
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {crossTools.map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                data-testid={`link-tool-${tool.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <div
                  className="rounded-xl border p-4 transition-all hover:shadow-lg group cursor-pointer h-full"
                  style={{ borderColor: `${primary}15`, backgroundColor: bgColor }}
                  data-testid={`card-tool-${tool.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  <h3
                    className="font-semibold text-sm group-hover:underline mb-0.5"
                    style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
                  >
                    {tool.title}
                  </h3>
                  <p className="text-[11px] opacity-50 mb-2">{tool.subtitle}</p>
                  <p className="text-xs opacity-55 leading-relaxed mb-2 line-clamp-2">
                    {tool.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {tool.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded-full opacity-35"
                        style={{ border: `1px solid ${primary}25` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t py-6" style={{ borderColor: `${primary}10` }}>
        <p className="text-center text-xs opacity-40">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
