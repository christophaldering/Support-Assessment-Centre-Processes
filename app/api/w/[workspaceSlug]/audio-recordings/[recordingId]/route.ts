import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getSignedDownloadUrl } from "@/lib/object-storage";
import { transcribeAudio } from "@/lib/ai";
import OpenAI from "openai";

interface RouteContext {
  params: { workspaceSlug: string; recordingId: string };
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function GET(_req: NextRequest, { params }: RouteContext) {
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

  const recording = await prisma.audioRecording.findFirst({
    where: { id: params.recordingId, workspaceId: workspace.id },
  });

  if (!recording) {
    return NextResponse.json({ error: "Aufnahme nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(recording);
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

    const recording = await prisma.audioRecording.findFirst({
      where: { id: params.recordingId, workspaceId: workspace.id },
    });

    if (!recording) {
      return NextResponse.json({ error: "Aufnahme nicht gefunden" }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !["transcribe", "summarize"].includes(action)) {
      return NextResponse.json(
        { error: "Ungültige Aktion. Erlaubt: transcribe, summarize" },
        { status: 400 }
      );
    }

    const userId = session?.userId || "master";

    if (action === "transcribe") {
      const downloadUrl = await getSignedDownloadUrl(recording.objectPath);
      const audioResponse = await fetch(downloadUrl);
      if (!audioResponse.ok) {
        return NextResponse.json({ error: "Audio-Datei konnte nicht heruntergeladen werden" }, { status: 500 });
      }

      const arrayBuffer = await audioResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = recording.originalFileName || "audio.wav";

      const transcript = await transcribeAudio(buffer, fileName);

      const updated = await prisma.audioRecording.update({
        where: { id: params.recordingId },
        data: { transcript, status: "transcribed" },
      });

      await logAudit({
        workspaceId: workspace.id,
        userId,
        action: "audio_recording.transcribed",
        entityType: "AudioRecording",
        entityId: recording.id,
      });

      return NextResponse.json(updated);
    }

    if (action === "summarize") {
      if (!recording.transcript) {
        return NextResponse.json(
          { error: "Transkript ist erforderlich. Bitte zuerst transkribieren." },
          { status: 400 }
        );
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Du bist ein Experte für die Zusammenfassung von Assessment-Center-Aufnahmen. Erstelle eine strukturierte Zusammenfassung auf Deutsch mit den folgenden Abschnitten: Hauptthemen, Schlüsselaussagen, Bewertungsrelevante Beobachtungen, Gesamteindruck.",
          },
          {
            role: "user",
            content: recording.transcript,
          },
        ],
        max_tokens: 2048,
      });

      const summary = response.choices[0]?.message?.content || "";
      const modelUsed = "gpt-4o-mini";

      const updated = await prisma.audioRecording.update({
        where: { id: params.recordingId },
        data: {
          aiSummary: summary,
          aiSummaryMeta: {
            model: modelUsed,
            timestamp: new Date().toISOString(),
            aiGenerated: true,
          },
          status: "summarized",
        },
      });

      await logAudit({
        workspaceId: workspace.id,
        userId,
        action: "audio_recording.summarized",
        entityType: "AudioRecording",
        entityId: recording.id,
        details: { model: modelUsed },
      });

      return NextResponse.json(updated);
    }
  } catch (err) {
    console.error("Audio recording processing error:", err);
    return NextResponse.json({ error: "Verarbeitungsfehler" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "workspace.manage")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
  }

  const recording = await prisma.audioRecording.findFirst({
    where: { id: params.recordingId, workspaceId: workspace.id },
  });

  if (!recording) {
    return NextResponse.json({ error: "Aufnahme nicht gefunden" }, { status: 404 });
  }

  const userId = session?.userId || "master";

  await prisma.audioRecording.delete({
    where: { id: params.recordingId },
  });

  await logAudit({
    workspaceId: workspace.id,
    userId,
    action: "audio_recording.deleted",
    entityType: "AudioRecording",
    entityId: recording.id,
    details: { objectPath: recording.objectPath, originalFileName: recording.originalFileName },
  });

  return NextResponse.json({ success: true });
}
