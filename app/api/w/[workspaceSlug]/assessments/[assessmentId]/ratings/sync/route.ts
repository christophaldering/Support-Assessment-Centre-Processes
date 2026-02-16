import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
}

interface SyncRatingPayload {
  exerciseId: string;
  competencyNodeId: string;
  candidateId: string;
  observerId?: string;
  rating?: number | null;
  evidenceNotes?: string | null;
  evidenceStructured?: unknown;
  scaleId?: string | null;
  clientTimestamp?: string | null;
  version?: number;
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
    const { ratings } = body as { ratings: SyncRatingPayload[] };

    if (!Array.isArray(ratings) || ratings.length === 0) {
      return NextResponse.json(
        { error: "Ein Array von Bewertungen ist erforderlich" },
        { status: 400 }
      );
    }

    const synced: unknown[] = [];
    const conflicts: unknown[] = [];

    for (const item of ratings) {
      const {
        exerciseId,
        competencyNodeId,
        candidateId,
        rating,
        evidenceNotes,
        evidenceStructured,
        scaleId,
        clientTimestamp,
        version: clientVersion,
      } = item;

      if (!exerciseId || !competencyNodeId || !candidateId) {
        conflicts.push({
          ...item,
          reason: "Fehlende Pflichtfelder (exerciseId, competencyNodeId, candidateId)",
        });
        continue;
      }

      const observerId = master
        ? (item.observerId ?? "master")
        : session!.userId;

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

      if (existing) {
        const serverIsNewer =
          existing.version > (clientVersion ?? 0) ||
          (existing.clientTimestamp &&
            clientTimestamp &&
            new Date(existing.clientTimestamp) > new Date(clientTimestamp));

        if (serverIsNewer) {
          conflicts.push({
            ...item,
            serverVersion: existing.version,
            serverTimestamp: existing.clientTimestamp,
            reason: "Serverversion ist neuer",
          });
          continue;
        }
      }

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
          evidenceStructured: (evidenceStructured as Record<string, unknown>) ?? null,
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
          evidenceStructured: (evidenceStructured as Record<string, unknown>) ?? null,
          scaleId: scaleId ?? null,
          clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : null,
          syncedAt: new Date(),
          version: 1,
        },
      });

      synced.push(result);
    }

    if (synced.length > 0) {
      await logAudit({
        workspaceId: workspace.id,
        userId: master ? null : session!.userId,
        action: "ratings.synced",
        entityType: "ObserverRating",
        entityId: params.assessmentId,
        details: { syncedCount: synced.length, conflictCount: conflicts.length },
      });
    }

    return NextResponse.json({ synced, conflicts });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
