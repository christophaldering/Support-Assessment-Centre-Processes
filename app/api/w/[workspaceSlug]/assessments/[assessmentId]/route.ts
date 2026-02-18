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

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
      include: {
        exercises: { orderBy: { sortOrder: "asc" } },
        documents: true,
        candidates: {
          where: { roles: { has: "CANDIDATE" } },
          select: { id: true, name: true, email: true },
        },
        client: { select: { id: true, name: true } },
        _count: { select: { candidates: true } },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(assessment);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
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

    const existing = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const { name, description, location, startDate, endDate, status, clientId, clientName } = await req.json();

    let resolvedClientId: string | null | undefined = undefined;
    let resolvedClientName: string | null | undefined = undefined;

    if (clientId !== undefined || clientName !== undefined) {
      resolvedClientId = clientId || null;
      resolvedClientName = clientName?.trim() || null;

      if (!resolvedClientId && resolvedClientName) {
        const existingClient = await prisma.client.findFirst({
          where: { workspaceId: workspace.id, name: resolvedClientName },
        });
        if (existingClient) {
          resolvedClientId = existingClient.id;
        } else {
          const newClient = await prisma.client.create({
            data: { workspaceId: workspace.id, name: resolvedClientName },
          });
          resolvedClientId = newClient.id;
        }
      } else if (resolvedClientId && !resolvedClientName) {
        const c = await prisma.client.findUnique({ where: { id: resolvedClientId } });
        resolvedClientName = c?.name || null;
      }
    }

    const assessment = await prisma.assessment.update({
      where: { id: params.assessmentId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(location !== undefined && { location }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status !== undefined && { status }),
        ...(resolvedClientId !== undefined && { clientId: resolvedClientId }),
        ...(resolvedClientName !== undefined && { clientName: resolvedClientName }),
      },
    });

    return NextResponse.json(assessment);
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const existing = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    await prisma.assessment.delete({
      where: { id: params.assessmentId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
