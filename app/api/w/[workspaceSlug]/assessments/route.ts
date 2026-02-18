import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string };
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

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const url = new URL(_req.url);
  const clientIdFilter = url.searchParams.get("clientId");

  const assessmentWhere: any = { workspaceId: workspace.id };
  if (clientIdFilter) {
    assessmentWhere.clientId = clientIdFilter;
  }

  const assessments = await prisma.assessment.findMany({
    where: assessmentWhere,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { candidates: true } },
      client: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(assessments);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "assessments.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, description, location, startDate, endDate, status, designMode, autoDeleteDays, clientId, clientName, targetPosition, workflowConfig } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    let resolvedClientId: string | null = clientId || null;
    let resolvedClientName: string | null = clientName?.trim() || null;
    if (!resolvedClientId && resolvedClientName) {
      const existing = await prisma.client.findFirst({
        where: { workspaceId: workspace.id, name: resolvedClientName },
      });
      if (existing) {
        resolvedClientId = existing.id;
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

    const assessment = await prisma.assessment.create({
      data: {
        name,
        workspaceId: workspace.id,
        description: description ?? null,
        location: location ?? null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status ?? "draft",
        designMode: ["ai_full", "ai_supported", "classic"].includes(designMode) ? designMode : "classic",
        autoDeleteDays: autoDeleteDays != null ? parseInt(autoDeleteDays) : null,
        clientId: resolvedClientId,
        clientName: resolvedClientName,
        targetPosition: targetPosition || null,
        workflowConfig: workflowConfig || null,
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
