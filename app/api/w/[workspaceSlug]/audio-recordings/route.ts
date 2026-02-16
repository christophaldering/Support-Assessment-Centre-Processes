import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getUploadUrl } from "@/lib/object-storage";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
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
  const exerciseId = searchParams.get("exerciseId");
  const candidateId = searchParams.get("candidateId");

  const where: Record<string, unknown> = { workspaceId: workspace.id };
  if (assessmentId) where.assessmentId = assessmentId;
  if (exerciseId) where.exerciseId = exerciseId;
  if (candidateId) where.candidateId = candidateId;

  const recordings = await prisma.audioRecording.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(recordings);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const body = await req.json();
    const { assessmentId, exerciseId, candidateId, originalFileName, retentionDays } = body;

    if (!originalFileName) {
      return NextResponse.json({ error: "Dateiname ist erforderlich" }, { status: 400 });
    }

    const userId = session?.userId || "master";
    const retention = retentionDays || 90;

    const upload = await getUploadUrl();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retention);

    const recording = await prisma.audioRecording.create({
      data: {
        workspaceId: workspace.id,
        assessmentId: assessmentId || null,
        exerciseId: exerciseId || null,
        candidateId: candidateId || null,
        objectPath: upload.objectPath,
        originalFileName,
        retentionDays: retention,
        expiresAt,
        createdById: userId,
      },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId,
      action: "audio_recording.created",
      entityType: "AudioRecording",
      entityId: recording.id,
      details: { originalFileName, retentionDays: retention, assessmentId, exerciseId, candidateId },
    });

    return NextResponse.json({ recording, uploadUrl: upload.uploadURL }, { status: 201 });
  } catch (err) {
    console.error("Audio recording creation error:", err);
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
