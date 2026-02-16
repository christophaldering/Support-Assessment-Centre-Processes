import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; modelId: string; nodeId: string };
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

    const node = await prisma.competencyNode.findFirst({
      where: { id: params.nodeId, competencyModelId: params.modelId },
      include: {
        children: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!node) {
      return NextResponse.json({ error: "Knoten nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(node);
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

    const existing = await prisma.competencyNode.findFirst({
      where: { id: params.nodeId, competencyModelId: params.modelId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Knoten nicht gefunden" }, { status: 404 });
    }

    const { name, nodeType, description, sortOrder, parentId } = await req.json();

    if (parentId !== undefined && parentId !== null) {
      const parentNode = await prisma.competencyNode.findFirst({
        where: { id: parentId, competencyModelId: params.modelId },
      });
      if (!parentNode) {
        return NextResponse.json({ error: "Übergeordneter Knoten nicht gefunden" }, { status: 404 });
      }
      if (parentId === params.nodeId) {
        return NextResponse.json({ error: "Knoten kann nicht sein eigener Elternknoten sein" }, { status: 400 });
      }
    }

    const node = await prisma.competencyNode.update({
      where: { id: params.nodeId },
      data: {
        ...(name !== undefined && { name }),
        ...(nodeType !== undefined && { nodeType }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(parentId !== undefined && { parentId }),
      },
    });

    return NextResponse.json(node);
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

    const existing = await prisma.competencyNode.findFirst({
      where: { id: params.nodeId, competencyModelId: params.modelId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Knoten nicht gefunden" }, { status: 404 });
    }

    await prisma.competencyNode.delete({
      where: { id: params.nodeId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
