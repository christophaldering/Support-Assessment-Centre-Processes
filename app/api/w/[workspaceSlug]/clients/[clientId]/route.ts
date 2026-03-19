import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; clientId: string };
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

    const client = await prisma.client.findFirst({
      where: { id: params.clientId, workspaceId: workspace.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.assessment.updateMany({
      where: { clientId: params.clientId },
      data: { clientId: null },
    });

    await prisma.client.delete({
      where: { id: params.clientId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen des Clients" }, { status: 500 });
  }
}
