import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission, hasAnyPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; itemId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const item = await prisma.exerciseLibraryItem.findFirst({
      where: { id: params.itemId, workspaceId: workspace.id },
      include: {
        variants: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Übungselement nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(item);
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

  if (session && !master && !hasAnyPermission(session.roles, ["exerciselibrary.upload", "exerciselibrary.manage"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const existing = await prisma.exerciseLibraryItem.findFirst({
      where: { id: params.itemId, workspaceId: workspace.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Übungselement nicht gefunden" }, { status: 404 });
    }

    const { title, description, tags, exerciseType, targetLevels, languagesAvailable, metadataJson, qualityStatus, sourceContext } = await req.json();

    const item = await prisma.exerciseLibraryItem.update({
      where: { id: params.itemId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
        ...(exerciseType !== undefined && { exerciseType }),
        ...(targetLevels !== undefined && { targetLevels }),
        ...(languagesAvailable !== undefined && { languagesAvailable }),
        ...(metadataJson !== undefined && { metadataJson }),
        ...(qualityStatus !== undefined && { qualityStatus }),
        ...(sourceContext !== undefined && { sourceContext }),
      },
      include: {
        variants: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json(item);
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

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const existing = await prisma.exerciseLibraryItem.findFirst({
      where: { id: params.itemId, workspaceId: workspace.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Übungselement nicht gefunden" }, { status: 404 });
    }

    await prisma.exerciseLibraryItem.delete({
      where: { id: params.itemId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
