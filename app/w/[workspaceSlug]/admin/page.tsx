import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
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
  const primary = t?.primaryColor ?? "#3b82f6";
  const textColor = t?.textColor ?? "#1a1a1a";
  const bgColor = t?.backgroundColor ?? "#ffffff";
  const headingFont = t?.fontFamilyHeading ?? "Playfair Display";

  const userRoles = userSession?.roles ?? [];
  const canManageUsers = masterAuth || hasPermission(userRoles, "users.read");

  const [pendingCount, assessmentCount, reportCount, consentCount, userCount, assessments, competencyNodes] = await Promise.all([
    prisma.accessRequest.count({ where: { workspaceId: workspace.id, status: "pending" } }),
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
  ]);

  const base = `/w/${params.workspaceSlug}/admin`;

  const toolLinks = [
    { title: "Modul- & Übungsbibliothek", href: `${base}/exercise-library`, desc: "Fallstudien, Übungen & Assessment-Instrumente", icon: "library" },
    { title: "Kompetenzmodelle", href: `${base}/competencies`, desc: "Kompetenzmodelle & Verhaltensanker", icon: "competency" },
    { title: "Brand & Style", href: `${base}/brand-rules`, desc: "Corporate-Identity-Regeln", icon: "brand" },
    { title: "Advanced Intelligence", href: `${base}/intelligence`, desc: "KI-gestützte Diagnostik-Analyse", icon: "intelligence" },
    { title: "Anforderungsanalyse", href: `${base}/requirements`, desc: "Anforderungsprofile & Stellenanalyse", icon: "requirements" },
    { title: "Theme Editor", href: `${base}/theme`, desc: "Workspace-Branding anpassen", icon: "theme" },
    { title: "Module & Fallstudien", href: `${base}/modules`, desc: "Interaktive Fallstudien & Assessment-Module", icon: "modules" },
  ];

  const governanceLinks = [
    ...(canManageUsers
      ? [
          { title: "Benutzer & Rollen", href: `${base}/users`, desc: "Workspace-Benutzer verwalten", icon: "users" },
          ...(pendingCount > 0
            ? [{ title: "Zugangsanfragen", href: `${base}/access-requests`, desc: `${pendingCount} offen`, badge: String(pendingCount), icon: "requests" }]
            : []),
        ]
      : []),
    { title: "Einwilligungen", href: `${base}/consents`, desc: "DSGVO-Einwilligungsvorlagen", icon: "consent" },
    { title: "Berichte", href: `${base}/reports`, desc: "Ergebnisberichte & Exporte", icon: "reports" },
    { title: "Analytik", href: `${base}/analytics`, desc: "Auswertungen & Dashboard", icon: "analytics" },
    { title: "Audio-Verarbeitung", href: `${base}/audio`, desc: "Transkription & KI-Zusammenfassungen", icon: "audio" },
  ];

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
    };
  });

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

        <section className="mb-6" data-testid="section-cockpit">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
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
        </section>

        <DashboardClient
          assessments={serializedAssessments}
          workspaceSlug={params.workspaceSlug}
          primary={primary}
          textColor={textColor}
          bgColor={bgColor}
          headingFont={headingFont}
          toolLinks={toolLinks}
          governanceLinks={governanceLinks}
        />
      </main>

      <footer className="border-t py-6" style={{ borderColor: `${primary}10` }}>
        <p className="text-center text-xs opacity-40">
          &copy; Christoph Aldering &middot; Private initiative / concept
        </p>
      </footer>
    </div>
  );
}
