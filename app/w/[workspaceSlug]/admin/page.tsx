import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import Link from "next/link";

interface Props {
  params: { workspaceSlug: string };
}

const processSteps = [
  { label: "Requirement", labelDe: "Anforderung" },
  { label: "Design", labelDe: "Design" },
  { label: "Execution", labelDe: "Durchführung" },
  { label: "Analysis", labelDe: "Analyse" },
  { label: "Reporting", labelDe: "Berichterstattung" },
];

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
  const primary = t?.primaryColor ?? "#3b82f6";
  const textColor = t?.textColor ?? "#1a1a1a";
  const bgColor = t?.backgroundColor ?? "#ffffff";
  const headingFont = t?.fontFamilyHeading ?? "Playfair Display";

  const userRoles = userSession?.roles ?? [];
  const canManageUsers = masterAuth || hasPermission(userRoles, "users.read");

  const [pendingCount, assessmentCount, reportCount, consentCount, userCount] = await Promise.all([
    prisma.accessRequest.count({ where: { workspaceId: workspace.id, status: "pending" } }),
    prisma.assessment.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
    prisma.report.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
    prisma.consentRecord.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
    prisma.user.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
  ]);

  const kpis = [
    { label: "Aktive Assessments", value: assessmentCount > 0 ? String(assessmentCount) : "—" },
    { label: "Ausstehende Berichte", value: reportCount > 0 ? String(reportCount) : "—" },
    { label: "Einwilligungen", value: consentCount > 0 ? String(consentCount) : "—" },
    { label: "Benutzer", value: String(userCount) },
    { label: "Offene Zugangsanfragen", value: String(pendingCount), highlight: pendingCount > 0 },
  ];

  const base = `/w/${params.workspaceSlug}/admin`;

  const sections = [
    {
      title: "Mandate & Diagnostic Design",
      titleDe: "Auftrag & Diagnostik-Design",
      subtitle: "Where structure precedes judgment.",
      subtitleDe: "Wo Struktur dem Urteil vorausgeht.",
      priority: "primary" as const,
      cards: [
        {
          title: "Anforderungsanalyse",
          titleEn: "Requirement Analysis",
          desc: "Rollenanforderungen analysieren und Assessment-Blaupausen erstellen (KI-gestützt).",
          href: `${base}/requirements`,
          primary: true,
        },
        {
          title: "Kompetenzrahmen",
          titleEn: "Competency Frameworks",
          desc: "Kompetenzen, Skalen, Anker und Gewichtungslogik konfigurieren.",
          href: `${base}/competencies`,
          primary: true,
        },
        {
          title: "Assessment-Architektur",
          titleEn: "Assessment Architecture",
          desc: "Validierte Module im Einklang mit DIN 33430 zusammenstellen.",
          href: `${base}/assessments`,
          primary: true,
        },
      ],
    },
    {
      title: "Execution & Observation",
      titleDe: "Durchführung & Beobachtung",
      subtitle: "Where evidence is generated.",
      subtitleDe: "Wo Evidenz entsteht.",
      priority: "primary" as const,
      cards: [
        {
          title: "Assessments",
          titleEn: "Assessments",
          desc: "Sitzungen verwalten, Kandidaten zuweisen und Moderation steuern.",
          href: `${base}/assessments`,
          primary: true,
        },
        {
          title: "Beobachtung & Bewertung",
          titleEn: "Observation & Ratings",
          desc: "Live-Bewertung, Sitzungs-Tracking, offline-fähige Erfassung.",
          href: `${base}/assessments`,
          primary: false,
        },
        {
          title: "Audio & Transkripte",
          titleEn: "Audio & Transcripts",
          desc: "Audio hochladen, transkribieren und zusammenfassen.",
          href: `${base}/audio`,
          primary: false,
        },
      ],
    },
    {
      title: "Tools & Modules",
      titleDe: "Tools & Module",
      subtitle: "Reusable diagnostic instruments and case studies.",
      subtitleDe: "Wiederverwendbare Diagnostik-Instrumente und Fallstudien.",
      priority: "primary" as const,
      cards: [
        {
          title: "Tools & Module",
          titleEn: "Tools & Modules",
          desc: "Fallstudien, Übungen und Assessment-Instrumente verwalten und einsetzen.",
          href: `${base}/modules`,
          primary: true,
          badge: "1 aktiv",
        },
      ],
    },
    {
      title: "Analysis & Judgment",
      titleDe: "Analyse & Urteilsbildung",
      subtitle: "From structured data to defensible insight.",
      subtitleDe: "Von strukturierten Daten zu belastbaren Erkenntnissen.",
      priority: "primary" as const,
      cards: [
        {
          title: "Analysen",
          titleEn: "Analyses",
          desc: "Kompetenzergebnisse, Muster und Statistiken einsehen.",
          href: `${base}/analytics`,
          primary: true,
        },
        {
          title: "Berichte",
          titleEn: "Reports",
          desc: "Vorstandstaugliche Berichte erstellen, prüfen und exportieren (PDF/DOCX).",
          href: `${base}/reports`,
          primary: true,
        },
      ],
    },
    {
      title: "Governance & Compliance",
      titleDe: "Governance & Compliance",
      subtitle: "Auditability and privacy built in.",
      subtitleDe: "Nachvollziehbarkeit und Datenschutz von Anfang an.",
      priority: "secondary" as const,
      cards: [
        {
          title: "Benutzer & Rollen",
          titleEn: "Users & Roles",
          desc: "Workspace-Benutzer, Rollen und Berechtigungen verwalten.",
          href: canManageUsers ? `${base}/users` : null,
          primary: false,
        },
        {
          title: "Zugangsanfragen",
          titleEn: "Access Requests",
          desc: "Zugangsanfragen prüfen und genehmigen.",
          href: canManageUsers ? `${base}/access-requests` : null,
          badge: pendingCount > 0 ? String(pendingCount) : undefined,
          primary: false,
        },
        {
          title: "Einwilligungen",
          titleEn: "Consent Management",
          desc: "Einwilligungsvorlagen und -aufzeichnungen verwalten.",
          href: `${base}/consents`,
          primary: false,
        },
        {
          title: "Audit-Protokoll",
          titleEn: "Audit Log",
          desc: "Systemaktivitäten und Compliance-Aufzeichnungen prüfen.",
          href: null,
          primary: false,
        },
      ],
    },
    {
      title: "Workspace & System",
      titleDe: "Workspace & System",
      subtitle: "Workspace appearance and configuration.",
      subtitleDe: "Erscheinungsbild und Konfiguration des Workspace.",
      priority: "tertiary" as const,
      cards: [
        {
          title: "Theme Editor",
          titleEn: "Theme Editor",
          desc: "Workspace-Branding und visuelle Identität anpassen.",
          href: `${base}/theme`,
          primary: false,
        },
      ],
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

        {/* ENTERPRISE COCKPIT */}
        <section className="mb-8" data-testid="section-cockpit">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: `'${headingFont}', serif` }}
                data-testid="text-dashboard-title"
              >
                Enterprise Cockpit
              </h1>
              <p className="text-sm mt-1 opacity-50">
                {workspace.name} · Diagnostik-Plattform
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-lg border px-4 py-3 text-center"
                style={{
                  borderColor: kpi.highlight ? primary : `${primary}15`,
                  backgroundColor: kpi.highlight ? `${primary}08` : `${bgColor}`,
                }}
                data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <p className="text-xl font-bold" style={{ color: kpi.highlight ? primary : textColor }}>
                  {kpi.value}
                </p>
                <p className="text-[11px] leading-tight mt-1 opacity-50">{kpi.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PROCESS BAR */}
        <section className="mb-10" data-testid="section-process-bar">
          <div className="flex items-center gap-0 overflow-x-auto">
            {processSteps.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap"
                  style={{
                    backgroundColor: `${primary}08`,
                    color: `${primary}`,
                    border: `1px solid ${primary}20`,
                  }}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: primary }}>
                    {i + 1}
                  </span>
                  {step.labelDe}
                </div>
                {i < processSteps.length - 1 && (
                  <div className="w-6 h-px mx-1" style={{ backgroundColor: `${primary}30` }} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* DASHBOARD SECTIONS */}
        {sections.map((section) => {
          const isPrimary = section.priority === "primary";
          const isSecondary = section.priority === "secondary";
          const isTertiary = section.priority === "tertiary";

          return (
            <section
              key={section.title}
              className={`mb-10 ${isTertiary ? "mb-6" : ""}`}
              data-testid={`section-${section.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="mb-4">
                <h2
                  className={`font-bold tracking-tight ${isPrimary ? "text-xl" : isSecondary ? "text-lg" : "text-base"}`}
                  style={{ fontFamily: `'${headingFont}', serif`, color: primary }}
                >
                  {section.titleDe}
                </h2>
                <p className={`mt-0.5 italic opacity-40 ${isPrimary ? "text-sm" : "text-xs"}`}>
                  {section.subtitleDe}
                </p>
              </div>

              <div className={`grid gap-4 ${
                isPrimary
                  ? "md:grid-cols-2 lg:grid-cols-3"
                  : isSecondary
                  ? "md:grid-cols-2 lg:grid-cols-4"
                  : "md:grid-cols-2 lg:grid-cols-3"
              }`}>
                {section.cards.map((card) => {
                  const cardContent = (
                    <div
                      className={`rounded-xl border transition-all ${
                        card.href ? "hover:shadow-md cursor-pointer" : "opacity-70"
                      } ${
                        isPrimary && card.primary
                          ? "p-6"
                          : isSecondary || isTertiary
                          ? "p-4"
                          : "p-5"
                      }`}
                      style={{
                        borderColor: `${primary}15`,
                        backgroundColor: bgColor,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`font-semibold ${isPrimary && card.primary ? "text-base" : "text-sm"}`}
                          style={{ color: primary, fontFamily: `'${headingFont}', serif` }}
                        >
                          {card.title}
                        </h3>
                        {card.badge && (
                          <span
                            className="text-[10px] font-bold text-white rounded-full px-2 py-0.5"
                            style={{ backgroundColor: primary }}
                            data-testid={`badge-${card.titleEn?.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            {card.badge}
                          </span>
                        )}
                      </div>
                      <p className={`mt-1.5 opacity-50 leading-relaxed ${isPrimary ? "text-sm" : "text-xs"}`}>
                        {card.desc}
                      </p>
                      {card.titleEn && (
                        <p className="text-[10px] mt-2 opacity-30 uppercase tracking-wider">
                          {card.titleEn}
                        </p>
                      )}
                      {card.href && (
                        <span className="text-[11px] mt-3 inline-block opacity-40">→ Öffnen</span>
                      )}
                    </div>
                  );

                  const cardId = (card.titleEn || card.title).toLowerCase().replace(/\s+/g, "-");

                  if (card.href) {
                    return (
                      <Link
                        key={card.title}
                        href={card.href}
                        data-testid={`link-card-${cardId}`}
                      >
                        {cardContent}
                      </Link>
                    );
                  }

                  return (
                    <div key={card.title} data-testid={`card-${cardId}`}>
                      {cardContent}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="border-t py-6" style={{ borderColor: `${primary}10` }}>
        <p className="text-center text-xs opacity-40">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
