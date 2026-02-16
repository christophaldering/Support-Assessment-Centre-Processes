import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; modelId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "competencies.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const model = await prisma.competencyModel.findFirst({
      where: { id: params.modelId, workspaceId: workspace.id },
    });

    if (!model) {
      return NextResponse.json({ error: "Kompetenzmodell nicht gefunden" }, { status: 404 });
    }

    const profiles = await prisma.weightingProfile.findMany({
      where: { competencyModelId: params.modelId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(profiles);
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

  if (session && !master && !hasPermission(session.roles, "competencies.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const model = await prisma.competencyModel.findFirst({
      where: { id: params.modelId, workspaceId: workspace.id },
    });

    if (!model) {
      return NextResponse.json({ error: "Kompetenzmodell nicht gefunden" }, { status: 404 });
    }

    const { name, targetRole, weights, version } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }

    const profile = await prisma.weightingProfile.create({
      data: {
        competencyModelId: params.modelId,
        name,
        targetRole: targetRole ?? null,
        weights: weights ?? [],
        version: version ?? 1,
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
