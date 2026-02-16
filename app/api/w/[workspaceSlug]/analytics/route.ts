import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasAnyPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (
    session &&
    !master &&
    !hasAnyPermission(session.roles, ["workspace.manage", "assessments.read"])
  ) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");

  const assessmentWhere: Record<string, unknown> = { workspaceId: workspace.id };
  if (assessmentId) assessmentWhere.id = assessmentId;

  const assessments = await prisma.assessment.findMany({
    where: assessmentWhere,
    include: {
      candidates: { select: { id: true, name: true } },
    },
  });

  const assessmentIds = assessments.map((a) => a.id);

  const ratings = await prisma.observerRating.findMany({
    where: { assessmentId: { in: assessmentIds } },
    select: { id: true, rating: true },
  });

  const consolidatedScores = await prisma.consolidatedScore.findMany({
    where: { assessmentId: { in: assessmentIds } },
  });

  const competencyNodeIds = [
    ...new Set(consolidatedScores.map((s) => s.competencyNodeId)),
  ];

  const competencyNodes = await prisma.competencyNode.findMany({
    where: { id: { in: competencyNodeIds } },
    select: { id: true, name: true },
  });

  const nodeNameMap = new Map(competencyNodes.map((n) => [n.id, n.name]));

  const allCandidates = assessments.flatMap((a) => a.candidates);
  const uniqueCandidates = new Map(allCandidates.map((c) => [c.id, c.name]));

  const totalAssessments = assessments.length;
  const totalCandidates = uniqueCandidates.size;
  const totalRatings = ratings.length;
  const ratingValues = ratings
    .map((r) => r.rating)
    .filter((r): r is number => r !== null);
  const averageScore =
    ratingValues.length > 0
      ? Math.round(
          (ratingValues.reduce((s, v) => s + v, 0) / ratingValues.length) * 100
        ) / 100
      : 0;

  const compAvgMap = new Map<
    string,
    { total: number; count: number; name: string }
  >();
  for (const score of consolidatedScores) {
    const name = nodeNameMap.get(score.competencyNodeId) || score.competencyNodeId;
    const val = score.normalizedValue ?? score.consolidatedValue;
    const existing = compAvgMap.get(name);
    if (existing) {
      existing.total += val;
      existing.count += 1;
    } else {
      compAvgMap.set(name, { total: val, count: 1, name });
    }
  }

  const competencyAverages = Array.from(compAvgMap.values()).map((v) => ({
    competencyName: v.name,
    averageNormalized: Math.round((v.total / v.count) * 100) / 100,
    count: v.count,
  }));

  const candidateScoresMap = new Map<
    string,
    {
      candidateId: string;
      candidateName: string;
      competencies: {
        name: string;
        normalized: number;
        outlier: boolean;
        overridden: boolean;
      }[];
    }
  >();

  for (const score of consolidatedScores) {
    const candidateName =
      uniqueCandidates.get(score.candidateId) || score.candidateId;
    if (!candidateScoresMap.has(score.candidateId)) {
      candidateScoresMap.set(score.candidateId, {
        candidateId: score.candidateId,
        candidateName,
        competencies: [],
      });
    }
    const entry = candidateScoresMap.get(score.candidateId)!;
    entry.competencies.push({
      name: nodeNameMap.get(score.competencyNodeId) || score.competencyNodeId,
      normalized: score.normalizedValue ?? score.consolidatedValue,
      outlier: score.outlierFlag,
      overridden: score.moderatorOverride !== null,
    });
  }

  const candidateScores = Array.from(candidateScoresMap.values());

  return NextResponse.json({
    totalAssessments,
    totalCandidates,
    totalRatings,
    averageScore,
    competencyAverages,
    candidateScores,
  });
}
