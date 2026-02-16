import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
}

function computeMean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function computeMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeTrimmedMean(values: number[]): number {
  if (values.length <= 2) return computeMean(values);
  const sorted = [...values].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return computeMean(trimmed);
}

function computeVariance(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  return (
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
    (values.length - 1)
  );
}

function hasOutlier(values: number[], mean: number, variance: number): boolean {
  if (values.length <= 2) return false;
  const stdev = Math.sqrt(variance);
  return values.some((v) => Math.abs(v - mean) > 2 * stdev);
}

function normalize(
  value: number,
  minValue: number,
  maxValue: number
): number {
  if (maxValue === minValue) return 50;
  return ((value - minValue) / (maxValue - minValue)) * 100;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
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

    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId");

    const where: Record<string, unknown> = { assessmentId: params.assessmentId };
    if (candidateId) where.candidateId = candidateId;

    const scores = await prisma.consolidatedScore.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scores);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
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

    const body = await req.json();
    const { candidateId, method = "mean", exerciseId } = body;

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId ist erforderlich" },
        { status: 400 }
      );
    }

    if (!["mean", "median", "trimmed_mean"].includes(method)) {
      return NextResponse.json(
        { error: "Ungültige Methode. Erlaubt: mean, median, trimmed_mean" },
        { status: 400 }
      );
    }

    const ratingsWhere: Record<string, unknown> = {
      assessmentId: params.assessmentId,
      candidateId,
      rating: { not: null },
    };
    if (exerciseId) ratingsWhere.exerciseId = exerciseId;

    const ratings = await prisma.observerRating.findMany({ where: ratingsWhere });

    if (ratings.length === 0) {
      return NextResponse.json(
        { error: "Keine Bewertungen für diesen Kandidaten gefunden" },
        { status: 404 }
      );
    }

    const scaleIds = [...new Set(ratings.map((r) => r.scaleId).filter(Boolean))] as string[];
    const scales = scaleIds.length > 0
      ? await prisma.scaleDefinition.findMany({ where: { id: { in: scaleIds } } })
      : [];
    const scaleMap = new Map(scales.map((s) => [s.id, s]));

    const groups = new Map<string, typeof ratings>();
    for (const r of ratings) {
      const key = `${r.competencyNodeId}::${r.exerciseId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }

    const results: unknown[] = [];

    for (const [key, groupRatings] of groups) {
      const [competencyNodeId, groupExerciseId] = key.split("::");
      const values = groupRatings.map((r) => r.rating!);

      let consolidatedValue: number;
      switch (method) {
        case "median":
          consolidatedValue = computeMedian(values);
          break;
        case "trimmed_mean":
          consolidatedValue = computeTrimmedMean(values);
          break;
        default:
          consolidatedValue = computeMean(values);
      }

      const mean = computeMean(values);
      const variance = computeVariance(values, mean);
      const outlierFlag = hasOutlier(values, mean, variance);

      let normalizedValue: number | null = null;
      const firstScale = groupRatings[0]?.scaleId
        ? scaleMap.get(groupRatings[0].scaleId)
        : null;
      if (firstScale && firstScale.minValue != null && firstScale.maxValue != null) {
        normalizedValue = normalize(consolidatedValue, firstScale.minValue, firstScale.maxValue);
      }

      const existing = await prisma.consolidatedScore.findUnique({
        where: {
          assessmentId_candidateId_competencyNodeId_exerciseId: {
            assessmentId: params.assessmentId,
            candidateId,
            competencyNodeId,
            exerciseId: groupExerciseId,
          },
        },
      });

      const score = await prisma.consolidatedScore.upsert({
        where: {
          assessmentId_candidateId_competencyNodeId_exerciseId: {
            assessmentId: params.assessmentId,
            candidateId,
            competencyNodeId,
            exerciseId: groupExerciseId,
          },
        },
        update: {
          consolidatedValue,
          normalizedValue,
          method,
          raterCount: values.length,
          variance,
          outlierFlag,
          algorithmMeta: {
            method,
            rawValues: values,
            observerIds: groupRatings.map((r) => r.observerId),
          },
          version: existing ? existing.version + 1 : 1,
        },
        create: {
          assessmentId: params.assessmentId,
          candidateId,
          competencyNodeId,
          exerciseId: groupExerciseId,
          consolidatedValue,
          normalizedValue,
          method,
          raterCount: values.length,
          variance,
          outlierFlag,
          algorithmMeta: {
            method,
            rawValues: values,
            observerIds: groupRatings.map((r) => r.observerId),
          },
          version: 1,
        },
      });

      results.push(score);
    }

    await logAudit({
      workspaceId: workspace.id,
      userId: master ? null : session!.userId,
      action: "consolidation.triggered",
      entityType: "ConsolidatedScore",
      entityId: params.assessmentId,
      details: { candidateId, method, exerciseId: exerciseId ?? null, scoresCount: results.length },
    });

    return NextResponse.json({ scores: results });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
