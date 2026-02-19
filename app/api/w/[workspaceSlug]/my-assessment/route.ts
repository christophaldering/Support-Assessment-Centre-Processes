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
  const isAdmin = session.roles.some((r: string) => ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN", "MODERATOR"].includes(r));

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

  const wfConfig = (assessment.workflowConfig as any) || {};
  const unlockedPhases: string[] = wfConfig.unlockedPhases || [];

  const preparationUnlocked = isAdmin || unlockedPhases.includes("preparation");
  const executionUnlocked = isAdmin || unlockedPhases.includes("execution");

  const filteredExercises = executionUnlocked ? assessment.exercises : [];
  const filteredDocuments = executionUnlocked
    ? assessment.documents
    : assessment.documents.filter(d => !d.exerciseId && preparationUnlocked);
  const now = new Date();

  function isContentAvailable(item: { alwaysAvailable: boolean; releaseStart: Date | null; releaseEnd: Date | null; releaseStatus: string }): boolean {
    if (item.alwaysAvailable) return true;
    if (item.releaseStart || item.releaseEnd) {
      const afterStart = !item.releaseStart || now >= item.releaseStart;
      const beforeEnd = !item.releaseEnd || now <= item.releaseEnd;
      return afterStart && beforeEnd;
    }
    return item.releaseStatus === "released";
  }

  const filteredPortalDocuments = portalDocuments.filter(d => {
    if (d.exerciseId && !executionUnlocked) return false;
    if (!d.exerciseId && !preparationUnlocked) return false;
    return isContentAvailable(d);
  });
  const filteredSelfAssessments = preparationUnlocked ? selfAssessments.filter(sa => isContentAvailable(sa)) : [];
  const filteredSaResponses = preparationUnlocked ? selfAssessmentResponses : [];

  return NextResponse.json({
    ...assessment,
    exercises: filteredExercises,
    documents: filteredDocuments,
    unlockedPhases,
    caseStudyData: executionUnlocked ? caseStudyData : null,
    portalDocuments: filteredPortalDocuments,
    selfAssessments: filteredSelfAssessments,
    selfAssessmentResponses: filteredSaResponses,
  });
}
