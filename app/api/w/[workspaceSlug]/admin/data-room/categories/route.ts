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

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const categories = await prisma.dataRoomCategory.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { documents: true } } },
  });

  return NextResponse.json(categories);
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

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const body = await req.json();
  const { slug, label, labelEn, icon, color, sortOrder } = body;

  if (!slug || !label) {
    return NextResponse.json({ error: "slug and label are required" }, { status: 400 });
  }

  const existing = await prisma.dataRoomCategory.findUnique({
    where: { slug_workspaceId: { slug, workspaceId: workspace.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Category with this slug already exists" }, { status: 409 });
  }

  const maxSort = await prisma.dataRoomCategory.aggregate({
    where: { workspaceId: workspace.id },
    _max: { sortOrder: true },
  });

  const category = await prisma.dataRoomCategory.create({
    data: {
      slug,
      label,
      labelEn: labelEn || null,
      icon: icon || null,
      color: color || null,
      sortOrder: sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1,
      workspaceId: workspace.id,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
