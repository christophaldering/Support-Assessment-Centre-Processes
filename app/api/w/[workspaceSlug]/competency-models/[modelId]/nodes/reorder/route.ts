import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; modelId: string };
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

    const { nodes } = await req.json();

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ error: "Knotenliste ist erforderlich" }, { status: 400 });
    }

    await prisma.$transaction(
      nodes.map((node: { id: string; sortOrder: number; parentId?: string | null }) =>
        prisma.competencyNode.update({
          where: { id: node.id },
          data: {
            sortOrder: node.sortOrder,
            ...(node.parentId !== undefined && { parentId: node.parentId ?? null }),
          },
        })
      )
    );

    const updatedNodes = await prisma.competencyNode.findMany({
      where: { competencyModelId: params.modelId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(updatedNodes);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
