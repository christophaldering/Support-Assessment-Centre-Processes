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
  "interview_guide",
  "group_discussion",
  "case_study",
  "role_play",
  "behavior_simulation",
  "in_tray",
  "fact_finding",
  "psychometric",
  "psychometric_test",
  "other",
];

const TYPE_NORMALIZE: Record<string, string> = {
  "Fallstudie": "case_study",
  "Präsentation": "presentation",
  "Interview": "interview",
  "Interview-Leitfaden": "interview_guide",
  "Fact-Finding": "fact_finding",
  "Fact-Finding-Simulation": "fact_finding",
  "Verhaltenssimulation": "behavior_simulation",
  "Rollenspiel": "role_play",
  "Psychometrischer Test": "psychometric_test",
  "Gruppenübung": "group_discussion",
  "Gruppendiskussion": "group_discussion",
  "Postkorb": "in_tray",
};

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
      include: { documents: true },
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

    const { name, type: rawType, instructions, duration, sortOrder, status, libraryItemId } = await req.json();

    if (!name || !rawType) {
      return NextResponse.json({ error: "Name und Typ sind erforderlich" }, { status: 400 });
    }

    const type = TYPE_NORMALIZE[rawType] || rawType;

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
        ...(libraryItemId ? { libraryItemId } : {}),
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
