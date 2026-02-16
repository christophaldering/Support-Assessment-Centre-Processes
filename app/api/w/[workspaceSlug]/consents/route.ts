import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "workspace.manage")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const feature = searchParams.get("feature");

  const where: Record<string, unknown> = { workspaceId: workspace.id };
  if (userId) where.userId = userId;
  if (feature) where.feature = feature;

  const records = await prisma.consentRecord.findMany({
    where,
    include: { template: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "workspace.manage")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const body = await req.json();
    const { templateId, userId, feature, granted, ipAddress } = body;

    if (!templateId || !userId || !feature) {
      return NextResponse.json(
        { error: "templateId, userId und feature sind erforderlich" },
        { status: 400 }
      );
    }

    const template = await prisma.consentTemplate.findFirst({
      where: { id: templateId, workspaceId: workspace.id },
    });

    if (!template) {
      return NextResponse.json({ error: "Vorlage nicht gefunden" }, { status: 404 });
    }

    const actingUserId = session?.userId || "master";

    const record = await prisma.consentRecord.create({
      data: {
        workspaceId: workspace.id,
        templateId,
        userId,
        feature,
        granted: granted ?? false,
        grantedAt: granted ? new Date() : null,
        ipAddress: ipAddress || null,
      },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId: actingUserId,
      action: granted ? "consent.granted" : "consent.denied",
      entityType: "ConsentRecord",
      entityId: record.id,
      details: { templateId, targetUserId: userId, feature, granted },
      ipAddress: ipAddress || null,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("Consent record creation error:", err);
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
