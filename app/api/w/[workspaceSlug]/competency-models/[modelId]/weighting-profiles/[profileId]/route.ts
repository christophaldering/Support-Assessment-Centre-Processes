import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; modelId: string; profileId: string };
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

    const profile = await prisma.weightingProfile.findFirst({
      where: { id: params.profileId, competencyModelId: params.modelId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Gewichtungsprofil nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(profile);
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

    const existing = await prisma.weightingProfile.findFirst({
      where: { id: params.profileId, competencyModelId: params.modelId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Gewichtungsprofil nicht gefunden" }, { status: 404 });
    }

    const { name, targetRole, weights, status } = await req.json();

    const profile = await prisma.weightingProfile.update({
      where: { id: params.profileId },
      data: {
        ...(name !== undefined && { name }),
        ...(targetRole !== undefined && { targetRole }),
        ...(weights !== undefined && { weights }),
        ...(status !== undefined && { status }),
        version: existing.version + 1,
      },
    });

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
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

    const existing = await prisma.weightingProfile.findFirst({
      where: { id: params.profileId, competencyModelId: params.modelId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Gewichtungsprofil nicht gefunden" }, { status: 404 });
    }

    await prisma.weightingProfile.delete({
      where: { id: params.profileId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
