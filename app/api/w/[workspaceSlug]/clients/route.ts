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

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const clients = await prisma.client.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          assessments: true,
          exerciseLibraryItems: true,
        },
      },
    },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, industry, contactInfo } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const existing = await prisma.client.findFirst({
      where: { workspaceId: workspace.id, name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const client = await prisma.client.create({
      data: {
        workspaceId: workspace.id,
        name: name.trim(),
        industry: industry?.trim() || null,
        contactInfo: contactInfo?.trim() || null,
      },
      include: {
        _count: {
          select: { assessments: true, exerciseLibraryItems: true },
        },
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
