import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string; noteId: string };
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
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

    const note = await prisma.sharedObserverNote.findFirst({
      where: { id: params.noteId, assessmentId: params.assessmentId },
    });

    if (!note) {
      return NextResponse.json({ error: "Notiz nicht gefunden" }, { status: 404 });
    }

    const userId = master ? "master" : session!.userId;
    const isAdmin = master || (session && session.roles.includes("ADMIN"));

    if (note.authorId !== userId && !isAdmin) {
      return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (typeof body.content === "string") {
      updateData.content = body.content.trim();
    }
    if (typeof body.pinned === "boolean") {
      updateData.pinned = body.pinned;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Keine Änderungen angegeben" }, { status: 400 });
    }

    const updated = await prisma.sharedObserverNote.update({
      where: { id: params.noteId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
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

    const note = await prisma.sharedObserverNote.findFirst({
      where: { id: params.noteId, assessmentId: params.assessmentId },
    });

    if (!note) {
      return NextResponse.json({ error: "Notiz nicht gefunden" }, { status: 404 });
    }

    const userId = master ? "master" : session!.userId;
    const isAdmin = master || (session && session.roles.includes("ADMIN"));

    if (note.authorId !== userId && !isAdmin) {
      return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
    }

    await prisma.sharedObserverNote.delete({
      where: { id: params.noteId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
