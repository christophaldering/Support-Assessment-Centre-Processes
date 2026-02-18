import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/session";

const VALID_PHASES = ["preparation", "execution", "followup"] as const;

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
}

async function resolveAssessment(workspaceSlug: string, assessmentId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true },
  });
  if (!workspace) return null;

  return prisma.assessment.findFirst({
    where: { id: assessmentId, workspaceId: workspace.id },
    select: { id: true, workflowConfig: true },
  });
}

function buildPhasesResponse(unlockedPhases: string[]) {
  return {
    phases: VALID_PHASES.map(p => ({
      id: p,
      label: p === "preparation" ? "Vorbereitung" : p === "execution" ? "Durchführung" : "Nachbereitung",
      unlocked: unlockedPhases.includes(p),
    })),
  };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  if (!session || session.workspaceSlug !== params.workspaceSlug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.roles.some((r: string) => ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN", "MODERATOR"].includes(r))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assessment = await resolveAssessment(params.workspaceSlug, params.assessmentId);
  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const config = (assessment.workflowConfig as any) || {};
  return NextResponse.json(buildPhasesResponse(config.unlockedPhases || []));
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  if (!session || session.workspaceSlug !== params.workspaceSlug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.roles.some((r: string) => ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN", "MODERATOR"].includes(r))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { phase, unlocked } = await req.json();
  if (!VALID_PHASES.includes(phase)) {
    return NextResponse.json({ error: "Invalid phase" }, { status: 400 });
  }

  const assessment = await resolveAssessment(params.workspaceSlug, params.assessmentId);
  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const config = (assessment.workflowConfig as any) || {};
  let unlockedPhases: string[] = config.unlockedPhases || [];

  if (unlocked && !unlockedPhases.includes(phase)) {
    unlockedPhases = [...unlockedPhases, phase];
  } else if (!unlocked) {
    unlockedPhases = unlockedPhases.filter((p: string) => p !== phase);
  }

  await prisma.assessment.update({
    where: { id: assessment.id },
    data: {
      workflowConfig: { ...config, unlockedPhases },
    },
  });

  return NextResponse.json(buildPhasesResponse(unlockedPhases));
}
