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

  const serializedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    roles: u.roles,
    status: u.status,
  }));

  const base = `/w/${params.workspaceSlug}/admin`;

  const modules = [
    {
      title: "Kompetenzmanagement",
      description: "Kompetenzmodelle, Verhaltensanker und MTMM-Matrix verwalten",
      href: `${base}/competencies`,
      icon: "competency",
    },
    {
      title: "Anforderungsanalyse",
      description: "Anforderungsprofile erstellen und abgleichen",
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
      title: "Modul-Designer",
      description: "Assessment-Bausteine erstellen, aus der Bibliothek übernehmen oder per KI generieren",
      href: `${base}/modules`,
      icon: "builder",
    },
    {
      title: "Case-Studio",
      description: "Fallstudien erstellen: Upload bestehender Dokumente oder KI-gestützte Generierung",
      href: `${base}/modules/case-study-builder`,
      icon: "casestudy",
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
  ];

  return (
    <DashboardClient
      assessments={serializedAssessments}
      users={serializedUsers}
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
