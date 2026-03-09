import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; id: string };
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

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const category = await prisma.dataRoomCategory.findFirst({
    where: { id: params.id, workspaceId: workspace.id },
  });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const body = await req.json();
  const { slug, label, labelEn, icon, color, sortOrder } = body;

  const updateData: Record<string, unknown> = {};
  if (slug !== undefined) updateData.slug = slug;
  if (label !== undefined) updateData.label = label;
  if (labelEn !== undefined) updateData.labelEn = labelEn;
  if (icon !== undefined) updateData.icon = icon;
  if (color !== undefined) updateData.color = color;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  const updated = await prisma.dataRoomCategory.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
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

  const category = await prisma.dataRoomCategory.findFirst({
    where: { id: params.id, workspaceId: workspace.id },
  });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  await prisma.dataRoomCategory.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
