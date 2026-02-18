import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import { ensureHex } from "@/lib/color-utils";
import Link from "next/link";
import DashboardClient from "./DashboardClient";

interface Props {
  params: { workspaceSlug: string };
}

export default async function WorkspaceAdminDashboard({ params }: Props) {
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

  const [
    assessmentCount, reportCount, consentCount, userCount,
    assessments, competencyNodes,
    exerciseLibCount, observationTemplateCount, caseStudyCount,
  ] = await Promise.all([
    prisma.assessment.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
    prisma.report.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
    prisma.consentRecord.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
    prisma.user.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
    prisma.assessment.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            candidates: true,
            exercises: true,
            reports: true,
            observerRatings: true,
            consolidatedScores: true,
          },
        },
        exercises: {
          select: {
            id: true,
            competencyMappings: { select: { competencyNodeId: true } },
          },
        },
      },
    }),
    prisma.competencyNode.count({
      where: { competencyModel: { workspaceId: workspace.id } },
    }).catch(() => 0),
    prisma.exerciseLibraryItem.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
    prisma.observationSheetTemplate.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
    prisma.caseStudy.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
  ]);

  const serializedAssessments = assessments.map((a) => {
    const mappedNodeIds = new Set(
      a.exercises.flatMap((ex) => ex.competencyMappings.map((m) => m.competencyNodeId))
    );
    const competencyCoverage = competencyNodes > 0
      ? Math.round((mappedNodeIds.size / competencyNodes) * 100)
      : 0;

    const totalExpectedRatings = a._count.exercises * a._count.candidates;
    const ratingProgress = totalExpectedRatings > 0
      ? Math.round((a._count.observerRatings / totalExpectedRatings) * 100)
      : 0;

    return {
      id: a.id,
      name: a.name,
      status: a.status,
      designMode: a.designMode,
      description: a.description,
      startDate: a.startDate?.toISOString() ?? null,
      endDate: a.endDate?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      candidateCount: a._count.candidates,
      exerciseCount: a._count.exercises,
      reportCount: a._count.reports,
      ratingCount: a._count.observerRatings,
      consolidatedCount: a._count.consolidatedScores,
      competencyCoverage,
      ratingProgress,
      autoDeleteDays: a.autoDeleteDays ?? null,
    };
  });

  const base = `/w/${params.workspaceSlug}/admin`;

  const kpis = [
    { label: "Projekte", value: assessmentCount, href: `${base}/assessments` },
    { label: "Übungen", value: exerciseLibCount, href: `${base}/exercise-library` },
    { label: "Beobachtungsbögen", value: observationTemplateCount, href: `${base}/observation-sheets` },
    { label: "Berichte", value: reportCount, href: `${base}/reports` },
    { label: "Benutzer", value: userCount, href: `${base}/users` },
    { label: "Einwilligungen", value: consentCount, href: `${base}/consents` },
  ];

  const statusConfig: Record<string, { label: string; bg: string; textColor: string; border?: string }> = {
    active: { label: "Verfügbar", bg: "#16a34a", textColor: "#ffffff" },
    partial: { label: "Teilweise", bg: "#f59e0b", textColor: "#ffffff" },
    development: { label: "In Entwicklung", bg: "#8b5cf6", textColor: "#ffffff" },
    planned: { label: "Geplant", bg: "transparent", textColor: "#94a3b8", border: "#cbd5e1" },
  };

  const phaseStatusConfig: Record<string, { dotColor: string; lineColor: string }> = {
    active: { dotColor: "#16a34a", lineColor: "#16a34a" },
    partial: { dotColor: "#f59e0b", lineColor: "#f59e0b" },
    development: { dotColor: "#8b5cf6", lineColor: "#8b5cf6" },
    planned: { dotColor: "#cbd5e1", lineColor: "#cbd5e1" },
  };

  const phases = [
    {
      id: "planning",
      number: 1,
      title: "Planung & Design",
      description: "Assessment-Grundlagen definieren und Anforderungen klären",
      status: "active",
      modules: [
        {
          title: "Projekt anlegen",
          subtitle: "Assessment erstellen & Grunddaten pflegen",
          description: "Neues Assessment-Projekt anlegen mit Name, Kunde, Zielposition, Zeitraum und Beschreibung.",
          href: `${base}/assessments`,
          tags: ["Grunddaten", "Zielposition", "Zeitraum"],
          status: "active",
          count: assessmentCount,
          countLabel: "Projekte",
        },
        {
          title: "Anforderungsanalyse",
          subtitle: "Kompetenzen & Anforderungsprofil definieren",
          description: "Strukturierte Anforderungsanalyse: Kompetenzen definieren, Verhaltensanker formulieren, Anforderungsprofil erstellen.",
          href: `${base}/requirements`,
          tags: ["Kompetenzen", "Verhaltensanker", "Profil"],
          status: "active",
        },
        {
          title: "MTMM-Matrix",
          subtitle: "Übung-Kompetenz-Zuordnung erstellen",
          description: "Multi-Trait-Multi-Method-Matrix: Kompetenzen den Übungen zuordnen, Gewichtungen festlegen.",
          href: `${base}/competencies`,
          tags: ["Zuordnung", "Gewichtung", "Validierung"],
          status: "active",
        },
      ],
    },
    {
      id: "assembly",
      number: 2,
      title: "Zusammenstellung",
      description: "Übungen, Beobachtungsbögen und Materialien zusammenstellen",
      status: "active",
      modules: [
        {
          title: "Übungsbibliothek",
          subtitle: "Übungen erstellen, importieren & verwalten",
          description: "Wiederverwendbare Übungen verwalten: Erstellen, importieren, KI-generierte Varianten oder CD-adaptierte Versionen.",
          href: `${base}/exercise-library`,
          tags: ["CRUD", "KI-Generierung", "Varianten", "CD-Adaption"],
          status: "active",
          count: exerciseLibCount,
          countLabel: "Übungen",
        },
        {
          title: "Beobachtungsbögen",
          subtitle: "Bögen erstellen, KI-generieren & zuordnen",
          description: "Beobachtungsbögen für strukturierte Bewertung: Manuell, per Vorlage oder KI-generiert mit Upload-Analyse.",
          href: `${base}/observation-sheets`,
          tags: ["Builder", "KI-Analyse", "Upload", "Vorlagen"],
          status: "active",
          count: observationTemplateCount,
          countLabel: "Vorlagen",
        },
        {
          title: "Fallstudien-Builder",
          subtitle: "Fallstudien erstellen & in Datenräume überführen",
          description: "Fallstudien hochladen und per KI in Datenräume überführen oder neue KI-generieren lassen.",
          href: `${base}/modules/case-study-builder`,
          tags: ["Upload", "KI-Generierung", "Datenraum"],
          status: "active",
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
      status: "active",
      modules: [
        {
          title: "AC konfigurieren",
          subtitle: "Validierung, Workflow & Freischaltung",
          description: "Assessment konfigurieren: Validierungsprüfung, Workflow-Einstellungen, Freischaltung zur Durchführung.",
          href: `${base}/assessments`,
          tags: ["Validierung", "Workflow", "Freischaltung"],
          status: "active",
        },
        {
          title: "Corporate Design",
          subtitle: "Brand & Style Guide Management",
          description: "Style Guides hochladen, Branding-Regeln definieren und per KI-Analyse extrahieren.",
          href: `${base}/brand-rules`,
          tags: ["KI-Analyse", "Regelsets", "CD-Varianten"],
          status: "active",
        },
      ],
    },
    {
      id: "execution",
      number: 4,
      title: "Durchführung",
      description: "Assessment durchführen mit Teilnehmer- und Beobachter-Portalen",
      status: "development",
      modules: [
        {
          title: "Einladungsmanagement",
          subtitle: "Teilnehmer einladen & Zugangscodes versenden",
          description: "Kandidaten und Beobachter einladen: E-Mail-Einladungen, Zugangscodes, Terminplanung.",
          tags: ["Einladungen", "Zugangscodes", "E-Mail"],
          status: "development",
        },
        {
          title: "Teilnehmer-Portal",
          subtitle: "Kandidaten-Sicht für die Übungsdurchführung",
          description: "Portal für Kandidaten: Übungen durchführen, Datenraum nutzen, Dokumente herunterladen.",
          tags: ["Kandidaten-Sicht", "Übungen", "Datenraum"],
          status: "partial",
        },
        {
          title: "Beobachter-Portal",
          subtitle: "Ratings erfassen & Live-Zusammenarbeit",
          description: "Portal für Beobachter: Bewertungen erfassen, gemeinsame Notizen, Live-Präsenz.",
          tags: ["Ratings", "Live-Notizen", "Zusammenarbeit"],
          status: "partial",
        },
      ],
    },
    {
      id: "analysis",
      number: 5,
      title: "Auswertung",
      description: "Ergebnisse konsolidieren, auswerten und berichten",
      status: "partial",
      modules: [
        {
          title: "Konsolidierung & Berichte",
          subtitle: "Ergebnisse zusammenführen & Berichte generieren",
          description: "Ratings konsolidieren, Kompetenzprofile erstellen, Berichte in DOCX/PDF/PPTX generieren.",
          href: `${base}/reports`,
          tags: ["Konsolidierung", "DOCX", "PDF", "PPTX"],
          status: "active",
        },
        {
          title: "Analytics & Benchmarks",
          subtitle: "Normwerte, Vergleiche & Visualisierungen",
          description: "Normierte Kompetenzwerte, Benchmark-Vergleiche, Ausreißer-Erkennung und Dashboards.",
          href: `${base}/analytics`,
          tags: ["Normwerte", "Benchmarks", "Visualisierung"],
          status: "active",
        },
        {
          title: "Advanced Intelligence",
          subtitle: "KI-gestützte Diagnostik & Empfehlungen",
          description: "Predictive Success, Development Paths und Diagnostic Hypotheses mit Konfidenz-Scores.",
          href: `${base}/intelligence`,
          tags: ["Prädiktiv", "Entwicklungspfade", "Hypothesen"],
          status: "active",
        },
      ],
    },
    {
      id: "evaluation",
      number: 6,
      title: "Evaluation",
      description: "Qualitätssicherung und Prozess-Evaluation des Assessment Centers",
      status: "planned",
      modules: [
        {
          title: "Prozess-Evaluation",
          subtitle: "Qualität des AC-Verfahrens bewerten",
          description: "Systematische Evaluation: Reliabilität, Validität, Fairness und Akzeptanz prüfen.",
          tags: ["Reliabilität", "Validität", "Fairness"],
          status: "planned",
        },
        {
          title: "Feedback-Management",
          subtitle: "Strukturiertes Feedback an Teilnehmer",
          description: "Individuelles Feedback erstellen: Kompetenzprofile, Entwicklungsempfehlungen, Stärken-/Schwächen-Analyse.",
          tags: ["Feedback", "Empfehlungen", "Entwicklung"],
          status: "planned",
        },
      ],
    },
  ];

  const crossTools = [
    {
      title: "Benutzer & Rollen",
      subtitle: "RBAC-Rollenverwaltung",
      description: "Benutzer anlegen und Rollen zuweisen. Zugriffsrechte und Berechtigungen verwalten.",
      href: `${base}/users`,
      tags: ["Rollen", "Berechtigungen"],
    },
    {
      title: "Einwilligungen",
      subtitle: "DSGVO-konforme Consent-Verwaltung",
      description: "Versionierte Einwilligungsvorlagen und granulare Consent-Records.",
      href: `${base}/consents`,
      tags: ["DSGVO", "Consent"],
    },
    {
      title: "Audio-Verarbeitung",
      subtitle: "Transkription & KI-Zusammenfassung",
      description: "Audio hochladen, automatisch transkribieren und KI-Zusammenfassungen generieren.",
      href: `${base}/audio`,
      tags: ["Transkription", "KI"],
    },
    {
      title: "Workspace-Theme",
      subtitle: "Branding & Design anpassen",
      description: "Farben, Schriften und Logo des Workspaces anpassen mit Live-Vorschau.",
      href: `${base}/theme`,
      tags: ["Farben", "Schriften"],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor, color: textColor }}>
      <header
        className="text-white sticky top-0 z-50"
        style={{ backgroundColor: primary }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: `'${headingFont}', serif` }}
          >
            {workspace.name}
          </span>
          <div className="flex items-center gap-4">
            {userSession && (
              <span className="text-xs text-white/70">{userSession.roles.join(", ")}</span>
            )}
            <span className="text-xs text-white/70">{workspace.dataResidency}</span>
            {masterAuth && (
              <Link
                href="/admin/workspaces"
                className="text-xs font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
                data-testid="link-switch-workspace"
              >
                Workspace wechseln
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">

        <section className="mb-8" data-testid="section-cockpit">
          <div className="mb-6">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: `'${headingFont}', serif` }}
              data-testid="text-dashboard-title"
            >
              Enterprise Cockpit
            </h1>
            <p className="text-sm mt-1 opacity-60" style={{ color: textColor }}>
              {workspace.name} · Diagnostik-Plattform
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8" data-testid="kpi-grid">
            {kpis.map((kpi) => (
              <Link
                key={kpi.label}
                href={kpi.href}
                className="rounded-xl border p-4 text-center transition-all hover:shadow-md group"
                style={{ borderColor: `${primary}15`, backgroundColor: bgColor }}
                data-testid={`kpi-${kpi.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <p
                  className="text-2xl font-bold group-hover:scale-110 transition-transform"
                  style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
                >
                  {kpi.value}
                </p>
                <p className="text-[11px] mt-1 opacity-60">{kpi.label}</p>
              </Link>
            ))}
          </div>
        </section>

        <DashboardClient
          assessments={serializedAssessments}
          workspaceSlug={params.workspaceSlug}
          primary={primary}
          textColor={textColor}
          bgColor={bgColor}
          headingFont={headingFont}
        />

        <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${primary}15` }}>
          <div className="mb-8">
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: `'${headingFont}', serif` }}
              data-testid="text-lifecycle-title"
            >
              Assessment-Center Lifecycle
            </h2>
            <p className="text-sm mt-1 opacity-50">
              Alle Module und Werkzeuge im Prozessablauf
            </p>
          </div>

          {phases.map((phase, phaseIdx) => {
            const pStatus = phaseStatusConfig[phase.status] ?? phaseStatusConfig.active;
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
                      <h3
                        className="text-lg font-bold tracking-tight"
                        style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
                        data-testid={`text-phase-title-${phase.id}`}
                      >
                        {phase.title}
                      </h3>
                      <p className="text-xs opacity-50 mt-0.5">{phase.description}</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {phase.modules.map((mod) => {
                        const mStatus = statusConfig[mod.status] ?? statusConfig.active;
                        const isLinked = "href" in mod && mod.href;
                        const card = (
                          <div
                            className={`rounded-xl border p-5 transition-all ${isLinked ? "hover:shadow-lg group cursor-pointer" : ""} ${mod.status === "planned" || mod.status === "development" ? "opacity-60" : ""}`}
                            style={{ borderColor: `${primary}15`, backgroundColor: bgColor }}
                            data-testid={`card-module-${mod.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4
                                  className={`font-semibold text-sm ${isLinked ? "group-hover:underline" : ""}`}
                                  style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
                                >
                                  {mod.title}
                                </h4>
                                <p className="text-[11px] opacity-50 mt-0.5">{mod.subtitle}</p>
                              </div>
                              <span
                                className="text-[10px] font-bold rounded-full px-2.5 py-1 shrink-0 ml-2"
                                style={{
                                  backgroundColor: mStatus.bg,
                                  color: mStatus.textColor,
                                  border: mStatus.border ? `1px solid ${mStatus.border}` : "none",
                                }}
                              >
                                {mStatus.label}
                              </span>
                            </div>

                            <p className="text-xs opacity-55 leading-relaxed mb-3 line-clamp-2">
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
                              href={(mod as any).href}
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
        </div>

        <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${primary}15` }}>
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
        <p className="text-center text-xs opacity-60" style={{ color: textColor }}>
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
