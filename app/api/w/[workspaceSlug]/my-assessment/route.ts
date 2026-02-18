import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/session";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  if (!session || session.workspaceSlug !== params.workspaceSlug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isCandidate = session.roles.includes("CANDIDATE");
  const isAdmin = session.roles.includes("ADMIN") || session.roles.includes("MODERATOR");

  if (!isCandidate && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { assessmentId: true, roles: true, workspaceId: true },
  });

  if (!user || user.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "No assessment assigned" }, { status: 404 });
  }

  let assessmentId = user.assessmentId;
  if (!assessmentId && isAdmin) {
    const firstAssessment = await prisma.assessment.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!firstAssessment) {
      return NextResponse.json({ error: "No assessment found" }, { status: 404 });
    }
    assessmentId = firstAssessment.id;
  }

  if (!assessmentId) {
    return NextResponse.json({ error: "No assessment assigned" }, { status: 404 });
  }

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      workspaceId: workspace.id,
    },
    include: {
      exercises: {
        where: { status: "active" },
        orderBy: { sortOrder: "asc" },
      },
      documents: {
        where: {
          visibleTo: { hasSome: user.roles },
        },
        select: {
          id: true,
          name: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          exerciseId: true,
          createdAt: true,
        },
      },
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const hasCaseStudyExercise = assessment.exercises.some(e => e.type === "case_study");
  let caseStudyData = null;
  if (hasCaseStudyExercise) {
    const activeCaseStudy = await prisma.caseStudy.findFirst({
      where: {
        workspaceId: workspace.id,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
    });
    if (activeCaseStudy) {
      caseStudyData = {
        id: activeCaseStudy.id,
        dataJson: activeCaseStudy.dataJson,
        questionsJson: activeCaseStudy.questionsJson,
      };
    }
  }

  const portalDocuments = await prisma.portalDocument.findMany({
    where: { assessmentId: assessment.id },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  const selfAssessments = await prisma.selfAssessment.findMany({
    where: { assessmentId: assessment.id },
    orderBy: { sortOrder: "asc" },
  });

  const selfAssessmentResponses = await prisma.selfAssessmentResponse.findMany({
    where: {
      candidateId: session.userId,
      selfAssessmentId: { in: selfAssessments.map(sa => sa.id) },
    },
  });

  return NextResponse.json({
    ...assessment,
    caseStudyData,
    portalDocuments,
    selfAssessments,
    selfAssessmentResponses,
  });
}
