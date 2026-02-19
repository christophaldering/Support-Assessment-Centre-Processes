import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string; saId: string };
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const sa = await prisma.selfAssessment.findFirst({
    where: { id: params.saId, assessmentId: params.assessmentId },
  });
  if (!sa) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.schemaJson !== undefined) updateData.schemaJson = body.schemaJson;
  if (body.alwaysAvailable !== undefined) updateData.alwaysAvailable = body.alwaysAvailable;
  if (body.releaseStart !== undefined) updateData.releaseStart = body.releaseStart ? new Date(body.releaseStart) : null;
  if (body.releaseEnd !== undefined) updateData.releaseEnd = body.releaseEnd ? new Date(body.releaseEnd) : null;
  if (body.releaseStatus !== undefined) {
    updateData.releaseStatus = body.releaseStatus;
    if (body.releaseStatus === "released" && sa.releaseStatus !== "released") {
      updateData.releasedAt = new Date();
    }
  }

  const updated = await prisma.selfAssessment.update({
    where: { id: params.saId },
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
  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.selfAssessment.deleteMany({
    where: { id: params.saId, assessmentId: params.assessmentId },
  });

  return NextResponse.json({ ok: true });
}
