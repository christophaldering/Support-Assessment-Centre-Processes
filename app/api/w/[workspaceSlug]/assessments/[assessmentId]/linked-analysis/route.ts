import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
      select: { sourceAnalysisId: true },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (!assessment.sourceAnalysisId) {
      return NextResponse.json({ linked: false });
    }

    const analysis = await prisma.requirementsAnalysis.findFirst({
      where: { id: assessment.sourceAnalysisId, workspaceId: workspace.id },
      select: {
        id: true,
        title: true,
        clientName: true,
        projectName: true,
        status: true,
        proposal: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ linked: false });
    }

    return NextResponse.json({
      linked: true,
      analysis,
    });
  } catch (err) {
    console.error("linked-analysis error:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}
