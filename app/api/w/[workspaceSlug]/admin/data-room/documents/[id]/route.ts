import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; id: string };
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
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const doc = await prisma.portalDocument.findFirst({
    where: { id: params.id, workspaceId: workspace.id },
    include: {
      dataRoomCategory: { select: { id: true, slug: true, label: true, labelEn: true, color: true, icon: true } },
      _count: { select: { views: true } },
    },
  });

  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  return NextResponse.json(doc);
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

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const doc = await prisma.portalDocument.findFirst({
    where: { id: params.id, workspaceId: workspace.id },
  });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const body = await req.json();

  if (body.categoryId) {
    const cat = await prisma.dataRoomCategory.findFirst({
      where: { id: body.categoryId, workspaceId: workspace.id },
    });
    if (!cat) {
      return NextResponse.json({ error: "Category not found in this workspace" }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {};

  const stringFields = [
    "title", "description", "shortDescription", "textSummary", "category",
    "categoryId", "slug", "documentType", "confidentialityLabel",
    "sourceLabel", "releaseStatus", "exerciseId",
  ];

  for (const field of stringFields) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }

  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.isImportant !== undefined) updateData.isImportant = body.isImportant;
  if (body.isNew !== undefined) updateData.isNew = body.isNew;
  if (body.readingTime !== undefined) updateData.readingTime = body.readingTime;
  if (body.pageCount !== undefined) updateData.pageCount = body.pageCount;
  if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;
  if (body.alwaysAvailable !== undefined) updateData.alwaysAvailable = body.alwaysAvailable;
  if (body.downloadAllowed !== undefined) updateData.downloadAllowed = body.downloadAllowed;

  const dateFields = ["releaseStart", "releaseEnd", "visibleFrom", "visibleUntil"];
  for (const field of dateFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field] ? new Date(body[field]) : null;
    }
  }

  if (body.releaseStatus !== undefined) {
    if (body.releaseStatus === "released" && doc.releaseStatus !== "released") {
      updateData.releasedAt = new Date();
    }
  }

  const updated = await prisma.portalDocument.update({
    where: { id: params.id },
    data: updateData,
    include: {
      dataRoomCategory: { select: { id: true, slug: true, label: true, labelEn: true, color: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const doc = await prisma.portalDocument.findFirst({
    where: { id: params.id, workspaceId: workspace.id },
  });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  await prisma.portalDocument.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
