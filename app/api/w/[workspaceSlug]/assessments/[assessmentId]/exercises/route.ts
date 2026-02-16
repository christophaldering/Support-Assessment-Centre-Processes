import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
}

const VALID_EXERCISE_TYPES = [
  "presentation",
  "interview",
  "group_discussion",
  "case_study",
  "role_play",
  "in_tray",
  "psychometric",
  "other",
];

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const exercises = await prisma.exercise.findMany({
      where: { assessmentId: params.assessmentId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(exercises);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const { name, type, instructions, duration, sortOrder, status } = await req.json();

    if (!name || !type) {
      return NextResponse.json({ error: "Name und Typ sind erforderlich" }, { status: 400 });
    }

    if (!VALID_EXERCISE_TYPES.includes(type)) {
      return NextResponse.json({ error: "Ungültiger Übungstyp" }, { status: 400 });
    }

    const exercise = await prisma.exercise.create({
      data: {
        assessmentId: params.assessmentId,
        name,
        type,
        instructions: instructions ?? null,
        duration: duration ?? null,
        sortOrder: sortOrder ?? 0,
        status: status ?? "active",
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
