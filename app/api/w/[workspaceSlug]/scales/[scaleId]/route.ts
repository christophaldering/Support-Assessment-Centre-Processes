import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; scaleId: string };
}

const VALID_SCALE_TYPES = ["numeric", "likert", "custom"];

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "competencies.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const scale = await prisma.scaleDefinition.findFirst({
      where: { id: params.scaleId, workspaceId: workspace.id },
    });

    if (!scale) {
      return NextResponse.json({ error: "Skala nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(scale);
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

  if (session && !master && !hasPermission(session.roles, "competencies.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const existing = await prisma.scaleDefinition.findFirst({
      where: { id: params.scaleId, workspaceId: workspace.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Skala nicht gefunden" }, { status: 404 });
    }

    const { name, type, minValue, maxValue, points, status } = await req.json();

    if (type !== undefined && !VALID_SCALE_TYPES.includes(type)) {
      return NextResponse.json({ error: "Ungültiger Skalentyp" }, { status: 400 });
    }

    const scale = await prisma.scaleDefinition.update({
      where: { id: params.scaleId },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(minValue !== undefined && { minValue }),
        ...(maxValue !== undefined && { maxValue }),
        ...(points !== undefined && { points }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(scale);
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

  if (session && !master && !hasPermission(session.roles, "competencies.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const existing = await prisma.scaleDefinition.findFirst({
      where: { id: params.scaleId, workspaceId: workspace.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Skala nicht gefunden" }, { status: 404 });
    }

    await prisma.scaleDefinition.delete({
      where: { id: params.scaleId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
