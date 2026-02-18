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
      include: {
        nodes: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!model) {
      return NextResponse.json({ error: "Kompetenzmodell nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(model);
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

    const existing = await prisma.competencyModel.findFirst({
      where: { id: params.modelId, workspaceId: workspace.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kompetenzmodell nicht gefunden" }, { status: 404 });
    }

    const { name, description, status, version, companyName, modelYear } = await req.json();

    const model = await prisma.competencyModel.update({
      where: { id: params.modelId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(version !== undefined && { version }),
        ...(companyName !== undefined && { companyName }),
        ...(modelYear !== undefined && { modelYear: modelYear ? parseInt(String(modelYear), 10) || null : null }),
      },
    });

    return NextResponse.json(model);
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

    const existing = await prisma.competencyModel.findFirst({
      where: { id: params.modelId, workspaceId: workspace.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Kompetenzmodell nicht gefunden" }, { status: 404 });
    }

    await prisma.competencyModel.delete({
      where: { id: params.modelId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
