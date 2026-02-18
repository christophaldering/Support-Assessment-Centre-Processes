import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/session";

interface RouteContext {
  params: { workspaceSlug: string; saId: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  if (!session || session.workspaceSlug !== params.workspaceSlug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.roles.includes("CANDIDATE")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { assessmentId: true, workspaceId: true },
  });
  if (!user || user.workspaceId !== workspace.id || !user.assessmentId) {
    return NextResponse.json({ error: "No assessment" }, { status: 404 });
  }

  const sa = await prisma.selfAssessment.findFirst({
    where: { id: params.saId, assessmentId: user.assessmentId },
  });
  if (!sa) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (sa.releaseStatus !== "released") {
    return NextResponse.json({ error: "Fragebogen ist nicht freigegeben" }, { status: 403 });
  }

  const body = await req.json();
  const { responsesJson, status } = body;

  const response = await prisma.selfAssessmentResponse.upsert({
    where: {
      selfAssessmentId_candidateId: {
        selfAssessmentId: params.saId,
        candidateId: session.userId,
      },
    },
    update: {
      responsesJson,
      status: status || "in_progress",
      submittedAt: status === "submitted" ? new Date() : undefined,
    },
    create: {
      selfAssessmentId: params.saId,
      candidateId: session.userId,
      responsesJson,
      status: status || "in_progress",
      submittedAt: status === "submitted" ? new Date() : undefined,
    },
  });

  return NextResponse.json(response);
}
