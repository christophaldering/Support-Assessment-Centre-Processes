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
  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.assessmentId, workspaceId: workspace.id },
  });
  if (!assessment) return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });

  const snapshots = await prisma.mtmmSnapshot.findMany({
    where: { assessmentId: params.assessmentId },
    include: {
      _count: { select: { mappings: true } },
    },
    orderBy: { version: "desc" },
  });

  return NextResponse.json(snapshots);
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

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.assessmentId, workspaceId: workspace.id },
  });
  if (!assessment) return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });

  const body = await req.json();
  const { label, fromSnapshotId } = body;

  const latestSnapshot = await prisma.mtmmSnapshot.findFirst({
    where: { assessmentId: params.assessmentId },
    orderBy: { version: "desc" },
  });
  const nextVersion = (latestSnapshot?.version ?? 0) + 1;

  const snapshot = await prisma.$transaction(async (tx) => {
    const newSnapshot = await tx.mtmmSnapshot.create({
      data: {
        assessmentId: params.assessmentId,
        version: nextVersion,
        label: label || `Version ${nextVersion}`,
        status: "draft",
      },
    });

    if (fromSnapshotId) {
      const sourceMappings = await tx.exerciseCompetencyMapping.findMany({
        where: { snapshotId: fromSnapshotId },
      });
      if (sourceMappings.length > 0) {
        await tx.exerciseCompetencyMapping.createMany({
          data: sourceMappings.map((m) => ({
            exerciseId: m.exerciseId,
            competencyNodeId: m.competencyNodeId,
            weight: m.weight,
            snapshotId: newSnapshot.id,
          })),
        });
      }
    } else {
      const legacyMappings = await tx.exerciseCompetencyMapping.findMany({
        where: {
          snapshotId: null,
          exerciseId: {
            in: (await tx.exercise.findMany({ where: { assessmentId: params.assessmentId }, select: { id: true } })).map(e => e.id),
          },
        },
      });
      if (legacyMappings.length > 0) {
        await tx.exerciseCompetencyMapping.createMany({
          data: legacyMappings.map((m) => ({
            exerciseId: m.exerciseId,
            competencyNodeId: m.competencyNodeId,
            weight: m.weight,
            snapshotId: newSnapshot.id,
          })),
        });
      }
    }

    return newSnapshot;
  });

  const result = await prisma.mtmmSnapshot.findUnique({
    where: { id: snapshot.id },
    include: { _count: { select: { mappings: true } } },
  });

  return NextResponse.json(result, { status: 201 });
}
