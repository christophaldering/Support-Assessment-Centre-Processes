import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const exercises = await prisma.exercise.findMany({
      where: { assessmentId: params.assessmentId },
      select: { id: true },
    });

    const exerciseIds = exercises.map((e) => e.id);

    const mappings = await prisma.exerciseCompetencyMapping.findMany({
      where: { exerciseId: { in: exerciseIds } },
      include: {
        exercise: { select: { id: true, name: true } },
        competencyNode: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(mappings);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const { exerciseId, competencyNodeId, weight } = await req.json();

    if (!exerciseId || !competencyNodeId) {
      return NextResponse.json({ error: "exerciseId und competencyNodeId sind erforderlich" }, { status: 400 });
    }

    const exercise = await prisma.exercise.findFirst({
      where: { id: exerciseId, assessmentId: params.assessmentId },
    });

    if (!exercise) {
      return NextResponse.json({ error: "Übung nicht gefunden" }, { status: 404 });
    }

    const node = await prisma.competencyNode.findUnique({
      where: { id: competencyNodeId },
    });

    if (!node) {
      return NextResponse.json({ error: "Kompetenzknoten nicht gefunden" }, { status: 404 });
    }

    const mapping = await prisma.exerciseCompetencyMapping.create({
      data: {
        exerciseId,
        competencyNodeId,
        weight: weight ?? 1.0,
      },
      include: {
        exercise: { select: { id: true, name: true } },
        competencyNode: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(mapping, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const { mappings } = await req.json();

    if (!Array.isArray(mappings)) {
      return NextResponse.json({ error: "mappings Array ist erforderlich" }, { status: 400 });
    }

    const exercises = await prisma.exercise.findMany({
      where: { assessmentId: params.assessmentId },
      select: { id: true },
    });

    const exerciseIds = new Set(exercises.map((e) => e.id));

    for (const m of mappings) {
      if (!m.exerciseId || !m.competencyNodeId) {
        return NextResponse.json({ error: "Jedes Mapping benötigt exerciseId und competencyNodeId" }, { status: 400 });
      }
      if (!exerciseIds.has(m.exerciseId)) {
        return NextResponse.json({ error: `Übung ${m.exerciseId} gehört nicht zu diesem Assessment` }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.exerciseCompetencyMapping.deleteMany({
        where: { exerciseId: { in: Array.from(exerciseIds) } },
      });

      if (mappings.length > 0) {
        await tx.exerciseCompetencyMapping.createMany({
          data: mappings.map((m: { exerciseId: string; competencyNodeId: string; weight?: number }) => ({
            exerciseId: m.exerciseId,
            competencyNodeId: m.competencyNodeId,
            weight: m.weight ?? 1.0,
          })),
        });
      }
    });

    const updatedMappings = await prisma.exerciseCompetencyMapping.findMany({
      where: { exerciseId: { in: Array.from(exerciseIds) } },
      include: {
        exercise: { select: { id: true, name: true } },
        competencyNode: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(updatedMappings);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
