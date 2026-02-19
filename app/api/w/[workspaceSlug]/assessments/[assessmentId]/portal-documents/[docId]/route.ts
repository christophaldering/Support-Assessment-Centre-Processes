import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string; docId: string };
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, category, releaseStatus, sortOrder, exerciseId, alwaysAvailable, releaseStart, releaseEnd, downloadAllowed } = body;

  const doc = await prisma.portalDocument.findFirst({
    where: { id: params.docId, assessmentId: params.assessmentId },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (exerciseId !== undefined) updateData.exerciseId = exerciseId;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (alwaysAvailable !== undefined) updateData.alwaysAvailable = alwaysAvailable;
  if (releaseStart !== undefined) updateData.releaseStart = releaseStart ? new Date(releaseStart) : null;
  if (releaseEnd !== undefined) updateData.releaseEnd = releaseEnd ? new Date(releaseEnd) : null;
  if (downloadAllowed !== undefined) updateData.downloadAllowed = downloadAllowed;
  if (releaseStatus !== undefined) {
    updateData.releaseStatus = releaseStatus;
    if (releaseStatus === "released" && doc.releaseStatus !== "released") {
      updateData.releasedAt = new Date();
    }
  }

  const updated = await prisma.portalDocument.update({
    where: { id: params.docId },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.portalDocument.deleteMany({
    where: { id: params.docId, assessmentId: params.assessmentId },
  });

  return NextResponse.json({ ok: true });
}
