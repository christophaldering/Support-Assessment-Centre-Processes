import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.assessmentId, workspaceId: workspace.id },
    include: {
      candidates: {
        select: { id: true, name: true, email: true, roles: true },
      },
    },
  });

  if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

  return NextResponse.json(assessment.candidates);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.assessmentId, workspaceId: workspace.id },
  });
  if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId ist erforderlich" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, workspaceId: workspace.id },
    });
    if (!user) return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });

    await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        candidates: { connect: { id: userId } },
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { assessmentId: assessment.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId ist erforderlich" }, { status: 400 });
    }

    await prisma.assessment.update({
      where: { id: params.assessmentId },
      data: {
        candidates: { disconnect: { id: userId } },
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { assessmentId: null },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
