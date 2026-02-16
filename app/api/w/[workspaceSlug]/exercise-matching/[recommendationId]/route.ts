import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; recommendationId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    session &&
    !master &&
    !hasPermission(session.roles, "requirements.match_exercises")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 },
    );
  }

  const recommendation = await prisma.exerciseRecommendation.findFirst({
    where: {
      id: params.recommendationId,
      workspaceId: workspace.id,
    },
  });

  if (!recommendation) {
    return NextResponse.json(
      { error: "Recommendation not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: recommendation.id,
    requirementsAnalysisId: recommendation.requirementsAnalysisId,
    recommendationsJson: recommendation.recommendationsJson,
    status: recommendation.status,
    createdAt: recommendation.createdAt,
    updatedAt: recommendation.updatedAt,
  });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    session &&
    !master &&
    !hasPermission(session.roles, "requirements.match_exercises")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status ist erforderlich" },
        { status: 400 },
      );
    }

    const validStatuses = ["draft", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Ungültiger Status. Erlaubt: ${validStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    const existing = await prisma.exerciseRecommendation.findFirst({
      where: {
        id: params.recommendationId,
        workspaceId: workspace.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.exerciseRecommendation.update({
      where: { id: params.recommendationId },
      data: {
        status,
        approvedByUserId:
          status === "approved" ? (session?.userId ?? null) : null,
      },
    });

    return NextResponse.json({
      id: updated.id,
      requirementsAnalysisId: updated.requirementsAnalysisId,
      recommendationsJson: updated.recommendationsJson,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
