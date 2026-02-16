import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string; scoreId: string };
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const score = await prisma.consolidatedScore.findFirst({
      where: { id: params.scoreId, assessmentId: params.assessmentId },
    });

    if (!score) {
      return NextResponse.json(
        { error: "Konsolidierter Score nicht gefunden" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { moderatorOverride, overrideReason } = body;

    if (moderatorOverride == null) {
      return NextResponse.json(
        { error: "moderatorOverride ist erforderlich" },
        { status: 400 }
      );
    }

    const updated = await prisma.consolidatedScore.update({
      where: { id: params.scoreId },
      data: {
        moderatorOverride,
        overrideReason: overrideReason ?? null,
        version: score.version + 1,
      },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId: master ? null : session!.userId,
      action: "consolidation.override",
      entityType: "ConsolidatedScore",
      entityId: params.scoreId,
      details: {
        moderatorOverride,
        overrideReason: overrideReason ?? null,
        previousVersion: score.version,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
