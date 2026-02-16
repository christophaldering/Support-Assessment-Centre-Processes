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

    const nodes = await prisma.competencyNode.findMany({
      where: { competencyModelId: params.modelId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(nodes);
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

    const { name, nodeType, parentId, description, sortOrder } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }

    if (parentId) {
      const parentNode = await prisma.competencyNode.findFirst({
        where: { id: parentId, competencyModelId: params.modelId },
      });
      if (!parentNode) {
        return NextResponse.json({ error: "Übergeordneter Knoten nicht gefunden" }, { status: 404 });
      }
    }

    const node = await prisma.competencyNode.create({
      data: {
        competencyModelId: params.modelId,
        name,
        nodeType: nodeType ?? "competency",
        parentId: parentId ?? null,
        description: description ?? null,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(node, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
