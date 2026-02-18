import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
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
    const exerciseId = searchParams.get("exerciseId");
    const observerId = searchParams.get("observerId");

    const where: Record<string, unknown> = { assessmentId: params.assessmentId };
    if (candidateId) where.candidateId = candidateId;
    if (exerciseId) where.exerciseId = exerciseId;
    if (observerId) where.observerId = observerId;

    const ratings = await prisma.observerRating.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ratings);
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

    const body = await req.json();
    const {
      exerciseId,
      competencyNodeId,
      candidateId,
      rating,
      evidenceNotes,
      evidenceStructured,
      scaleId,
      clientTimestamp,
    } = body;

    if (!exerciseId || !competencyNodeId || !candidateId) {
      return NextResponse.json(
        { error: "exerciseId, competencyNodeId und candidateId sind erforderlich" },
        { status: 400 }
      );
    }

    const observerId = master ? (body.observerId ?? "master") : session!.userId;

    const existing = await prisma.observerRating.findUnique({
      where: {
        assessmentId_exerciseId_competencyNodeId_candidateId_observerId: {
          assessmentId: params.assessmentId,
          exerciseId,
          competencyNodeId,
          candidateId,
          observerId,
        },
      },
    });

    const result = await prisma.observerRating.upsert({
      where: {
        assessmentId_exerciseId_competencyNodeId_candidateId_observerId: {
          assessmentId: params.assessmentId,
          exerciseId,
          competencyNodeId,
          candidateId,
          observerId,
        },
      },
      update: {
        rating: rating ?? null,
        evidenceNotes: evidenceNotes ?? null,
        evidenceStructured: evidenceStructured ?? null,
        scaleId: scaleId ?? null,
        clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : null,
        syncedAt: new Date(),
        version: existing ? existing.version + 1 : 1,
      },
      create: {
        assessmentId: params.assessmentId,
        exerciseId,
        competencyNodeId,
        candidateId,
        observerId,
        rating: rating ?? null,
        evidenceNotes: evidenceNotes ?? null,
        evidenceStructured: evidenceStructured ?? null,
        scaleId: scaleId ?? null,
        clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : null,
        syncedAt: new Date(),
        version: 1,
      },
    });

    const activeSnapshot = await prisma.mtmmSnapshot.findFirst({
      where: { assessmentId: params.assessmentId, status: "active", lockedAt: null },
    });
    if (activeSnapshot) {
      await prisma.mtmmSnapshot.update({
        where: { id: activeSnapshot.id },
        data: {
          lockedAt: new Date(),
          lockedReason: "Automatisch gesperrt: Erste Bewertung wurde abgegeben",
        },
      });
    }

    await logAudit({
      workspaceId: workspace.id,
      userId: master ? null : session!.userId,
      action: existing ? "rating.updated" : "rating.created",
      entityType: "ObserverRating",
      entityId: result.id,
      details: { exerciseId, competencyNodeId, candidateId, observerId },
    });

    const eventUserName = session
      ? (await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } }))?.name || "Benutzer"
      : "Admin";

    prisma.collaborationEvent.create({
      data: {
        assessmentId: params.assessmentId,
        userId: session?.userId || "master",
        userName: eventUserName,
        eventType: existing ? "rating_updated" : "rating_submitted",
        payload: {
          exerciseId: body.exerciseId,
          competencyNodeId: body.competencyNodeId,
          candidateId: body.candidateId,
          rating: body.rating,
        },
      },
    }).catch((err: any) => console.error("Failed to emit collaboration event:", err));

    return NextResponse.json(result, { status: existing ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
