import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/session";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  if (!session || session.workspaceSlug !== params.workspaceSlug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.roles.includes("CANDIDATE")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const records = await prisma.consentRecord.findMany({
    where: {
      workspaceId: workspace.id,
      userId: session.userId,
    },
    include: { template: true },
    orderBy: { createdAt: "desc" },
  });

  const result = records.map((r) => ({
    id: r.id,
    templateId: r.templateId,
    templateName: r.template.name,
    status: r.granted ? "granted" : r.revokedAt ? "revoked" : "pending",
    grantedAt: r.grantedAt?.toISOString() || null,
  }));

  return NextResponse.json(result);
}
