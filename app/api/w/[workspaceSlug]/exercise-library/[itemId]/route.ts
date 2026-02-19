import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission, hasAnyPermission } from "@/lib/rbac";
import { sanitizeRichText } from "@/lib/sanitize";
import { Client } from "@replit/object-storage";

interface RouteContext {
  params: { workspaceSlug: string; itemId: string };
}

function getStorageClient() {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || process.env.REPLIT_DEFAULT_BUCKET_ID;
  if (!bucketId) throw new Error("Object storage bucket not configured");
  return new Client({ bucketId });
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

    const body = await req.json();
    const { title, description, tags, exerciseType, targetLevels, languagesAvailable, metadataJson, qualityStatus, sourceContext, downloadAllowed, archive } = body;

    if (archive === true && !existing.archivedAt) {
      const item = await prisma.exerciseLibraryItem.update({
        where: { id: params.itemId },
        data: { archivedAt: new Date() },
        include: { variants: { orderBy: { createdAt: "desc" } } },
      });
      return NextResponse.json(item);
    }

    if (archive === false && existing.archivedAt) {
      if (!master) {
        return NextResponse.json({ error: "Nur Master-Admin kann Übungen wiederherstellen" }, { status: 403 });
      }
      const item = await prisma.exerciseLibraryItem.update({
        where: { id: params.itemId },
        data: { archivedAt: null },
        include: { variants: { orderBy: { createdAt: "desc" } } },
      });
      return NextResponse.json(item);
    }

    const item = await prisma.exerciseLibraryItem.update({
      where: { id: params.itemId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: sanitizeRichText(description) }),
        ...(tags !== undefined && { tags }),
        ...(exerciseType !== undefined && { exerciseType }),
        ...(targetLevels !== undefined && { targetLevels }),
        ...(languagesAvailable !== undefined && { languagesAvailable }),
        ...(metadataJson !== undefined && { metadataJson }),
        ...(qualityStatus !== undefined && { qualityStatus }),
        ...(sourceContext !== undefined && { sourceContext }),
        ...(downloadAllowed !== undefined && { downloadAllowed: !!downloadAllowed }),
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
      include: { variants: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Übungselement nicht gefunden" }, { status: 404 });
    }

    const filesToDelete: string[] = [];
    if (existing.originalFileKey) {
      filesToDelete.push(existing.originalFileKey);
    }
    for (const v of existing.variants) {
      if (v.fileObjectPath) {
        filesToDelete.push(v.fileObjectPath);
      }
    }

    await prisma.exerciseLibraryItem.delete({
      where: { id: params.itemId },
    });

    if (filesToDelete.length > 0) {
      try {
        const storageClient = getStorageClient();
        for (const key of filesToDelete) {
          await storageClient.delete(key).catch(() => {});
        }
      } catch (e) {
        console.error("Object storage cleanup error (non-fatal):", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
