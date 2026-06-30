import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: { workspaceSlug: string; templateId: string };
}

function isAdmin(
  session: ReturnType<typeof getUserSession>,
  master: boolean,
  workspaceSlug: string
): boolean {
  if (master) return true;
  if (!session || session.workspaceSlug !== workspaceSlug) return false;
  return session.roles.some((r) => ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN"].includes(r));
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!isAdmin(session, master, params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const template = await prisma.reportTemplate.findFirst({
    where: { id: params.templateId, workspaceId: workspace.id },
  });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const userId = session?.userId ?? null;

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.reportTemplate.update({
      where: { id: params.templateId },
      data: { useForStyleGuidance: false },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId,
      action: "style_template_deactivated",
      entityType: "ReportTemplate",
      entityId: params.templateId,
      details: { templateName: template.name },
    });

    return t;
  });

  return NextResponse.json({ ok: true, template: updated });
}
