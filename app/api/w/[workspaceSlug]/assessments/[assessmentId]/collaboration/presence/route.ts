import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasAnyPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasAnyPermission(session.roles, ["assessments.read", "assessments.update"])) {
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

    const userId = master ? "master" : session!.userId;
    const userName = master ? "Admin" : (session!.roles.includes("ADMIN") ? "Admin" : userId);
    const userRole = master ? "ADMIN" : (session!.roles[0] || "OBSERVER");

    await prisma.presenceSession.upsert({
      where: {
        assessmentId_userId: {
          assessmentId: params.assessmentId,
          userId,
        },
      },
      update: {
        lastSeenAt: new Date(),
        status: "active",
        userName,
        userRole,
      },
      create: {
        assessmentId: params.assessmentId,
        userId,
        userName,
        userRole,
        status: "active",
        lastSeenAt: new Date(),
      },
    });

    const cutoff = new Date(Date.now() - 60 * 1000);
    const activeSessions = await prisma.presenceSession.findMany({
      where: {
        assessmentId: params.assessmentId,
        lastSeenAt: { gte: cutoff },
      },
      orderBy: { lastSeenAt: "desc" },
    });

    return NextResponse.json(activeSessions);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function GET(req: NextRequest, { params }: RouteContext) {
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

    const cutoff = new Date(Date.now() - 60 * 1000);

    await prisma.presenceSession.updateMany({
      where: {
        assessmentId: params.assessmentId,
        lastSeenAt: { lt: cutoff },
        status: "active",
      },
      data: { status: "inactive" },
    });

    const activeSessions = await prisma.presenceSession.findMany({
      where: {
        assessmentId: params.assessmentId,
        lastSeenAt: { gte: cutoff },
      },
      orderBy: { lastSeenAt: "desc" },
    });

    return NextResponse.json(activeSessions);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
