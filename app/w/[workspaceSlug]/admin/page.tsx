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
    assessments, users,
    exerciseLibCount, observationTemplateCount,
  ] = await Promise.all([
    prisma.assessment.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        designMode: true,
        description: true,
        clientName: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        autoDeleteDays: true,
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
    prisma.user.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true, email: true, roles: true, status: true },
      orderBy: { name: "asc" },
    }),
    prisma.exerciseLibraryItem.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
    prisma.observationSheetTemplate.count({ where: { workspaceId: workspace.id } }).catch(() => 0),
  ]);

  const competencyNodes = await prisma.competencyNode.count({
    where: { competencyModel: { workspaceId: workspace.id } },
  }).catch(() => 0);

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
      clientName: a.clientName ?? null,
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

  const roleGroups: Record<string, typeof users> = {};
  const roleLabels: Record<string, string> = {
    ADMIN: "Administratoren",
    MODERATOR: "Moderatoren",
    OBSERVER: "Beobachter",
    PROJECT_ASSISTANT: "Projektassistenten",
    HR_CLIENT: "HR-Kunden",
    CANDIDATE: "Kandidaten",
  };

  for (const user of users) {
    for (const role of user.roles) {
      if (!roleGroups[role]) roleGroups[role] = [];
      roleGroups[role].push(user);
    }
  }

  const roleSummary = Object.entries(roleLabels).map(([role, label]) => ({
    role,
    label,
    count: roleGroups[role]?.length ?? 0,
  }));

  const base = `/w/${params.workspaceSlug}/admin`;

  const modules = [
    {
      title: "Anforderungsanalyse",
      description: "Kompetenzen definieren, Verhaltensanker formulieren, Anforderungsprofil erstellen",
      href: `${base}/requirements`,
      icon: "target",
    },
    {
      title: "Baustein-Bibliothek",
      description: "Wiederverwendbare Übungen, Fallstudien und Instrumente verwalten",
      href: `${base}/exercise-library`,
      icon: "library",
      count: exerciseLibCount,
      countLabel: "Bausteine",
    },
    {
      title: "Baustein-Builder",
      description: "Übungen, Fallstudien und Instrumente per KI generieren oder hochladen",
      href: `${base}/modules/case-study-builder`,
      icon: "builder",
    },
    {
      title: "Beobachtungsbogen-Tool",
      description: "Beobachtungsbögen erstellen, KI-generieren und Übungen zuordnen",
      href: `${base}/observation-sheets`,
      icon: "clipboard",
      count: observationTemplateCount,
      countLabel: "Vorlagen",
    },
    {
      title: "Analytics & Berichte",
      description: "Normwerte, Benchmarks, Kompetenzprofile und Berichtsgenerierung",
      href: `${base}/analytics`,
      icon: "chart",
    },
    {
      title: "Corporate Design",
      description: "Branding-Regeln definieren, Style Guides hochladen und per KI analysieren",
      href: `${base}/brand-rules`,
      icon: "palette",
    },
    {
      title: "Advanced Intelligence",
      description: "KI-gestützte Diagnostik: Predictive Success, Entwicklungspfade, Hypothesen",
      href: `${base}/intelligence`,
      icon: "brain",
    },
    {
      title: "Benutzer & Rollen",
      description: "Benutzer anlegen, Rollen zuweisen und Berechtigungen verwalten",
      href: `${base}/users`,
      icon: "users",
    },
  ];

  return (
    <DashboardClient
      assessments={serializedAssessments}
      roleSummary={roleSummary}
      modules={modules}
      workspaceSlug={params.workspaceSlug}
      workspaceName={workspace.name}
      primary={primary}
      textColor={textColor}
      bgColor={bgColor}
      headingFont={headingFont}
      isMaster={!!masterAuth}
      userRoles={userSession?.roles ?? []}
    />
  );
}
