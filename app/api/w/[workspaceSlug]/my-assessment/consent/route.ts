import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  if (!session || session.workspaceSlug !== params.workspaceSlug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isCandidate = session.roles.includes("CANDIDATE");
  const isAdmin = session.roles.some((r: string) => ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN", "MODERATOR"].includes(r));

  if (!isCandidate && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (isAdmin && !isCandidate) {
    return NextResponse.json({ templates: [], records: [], allConsented: true });
  }

  const templates = await prisma.consentTemplate.findMany({
    where: {
      workspaceId: workspace.id,
      status: "active",
      category: { in: ["general", "assessment_participation"] },
    },
    orderBy: { createdAt: "desc" },
  });

  const records = await prisma.consentRecord.findMany({
    where: {
      workspaceId: workspace.id,
      userId: session.userId,
    },
    include: { template: true },
    orderBy: { createdAt: "desc" },
  });

  const grantedTemplateIds = new Set(
    records
      .filter((r) => r.granted && !r.revokedAt)
      .map((r) => r.templateId)
  );

  const allConsented =
    templates.length > 0 &&
    templates.every((t) => grantedTemplateIds.has(t.id));

  return NextResponse.json({ templates, records, allConsented });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  if (!session || session.workspaceSlug !== params.workspaceSlug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.roles.includes("CANDIDATE")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await req.json();
    const { templateId, granted } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    const template = await prisma.consentTemplate.findFirst({
      where: { id: templateId, workspaceId: workspace.id },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const allowedCategories = ["general", "assessment_participation"];
    if (template.category && !allowedCategories.includes(template.category)) {
      return NextResponse.json({ error: "Template category not allowed for candidate consent" }, { status: 403 });
    }

    const existing = await prisma.consentRecord.findFirst({
      where: {
        workspaceId: workspace.id,
        templateId,
        userId: session.userId,
      },
      orderBy: { createdAt: "desc" },
    });

    let record;
    if (existing && existing.granted === (granted ?? false)) {
      record = existing;
    } else {
      record = await prisma.consentRecord.create({
        data: {
          workspaceId: workspace.id,
          templateId,
          userId: session.userId,
          feature: template.category || "assessment_participation",
          granted: granted ?? false,
          grantedAt: granted ? new Date() : null,
        },
      });
    }

    await logAudit({
      workspaceId: workspace.id,
      userId: session.userId,
      action: granted ? "consent.granted" : "consent.denied",
      entityType: "ConsentRecord",
      entityId: record.id,
      details: { templateId, feature: "assessment_participation", granted },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("Candidate consent record creation error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
