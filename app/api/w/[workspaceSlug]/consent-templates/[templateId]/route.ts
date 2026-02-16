import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: { workspaceSlug: string; templateId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
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

  const template = await prisma.consentTemplate.findFirst({
    where: { id: params.templateId, workspaceId: workspace.id },
  });

  if (!template) {
    return NextResponse.json({ error: "Vorlage nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
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

    const existing = await prisma.consentTemplate.findFirst({
      where: { id: params.templateId, workspaceId: workspace.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Vorlage nicht gefunden" }, { status: 404 });
    }

    const body = await req.json();
    const { name, language, category, content } = body;

    const contentChanged = content !== undefined && content !== existing.content;

    const userId = session?.userId || "master";

    const template = await prisma.consentTemplate.update({
      where: { id: params.templateId },
      data: {
        ...(name !== undefined && { name }),
        ...(language !== undefined && { language }),
        ...(category !== undefined && { category }),
        ...(content !== undefined && { content }),
        ...(contentChanged && { version: existing.version + 1 }),
      },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId,
      action: "consent_template.updated",
      entityType: "ConsentTemplate",
      entityId: template.id,
      details: { contentChanged, newVersion: template.version },
    });

    return NextResponse.json(template);
  } catch (err) {
    console.error("Consent template update error:", err);
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
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

  const existing = await prisma.consentTemplate.findFirst({
    where: { id: params.templateId, workspaceId: workspace.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Vorlage nicht gefunden" }, { status: 404 });
  }

  const userId = session?.userId || "master";

  const template = await prisma.consentTemplate.update({
    where: { id: params.templateId },
    data: { status: "archived" },
  });

  await logAudit({
    workspaceId: workspace.id,
    userId,
    action: "consent_template.archived",
    entityType: "ConsentTemplate",
    entityId: template.id,
  });

  return NextResponse.json({ success: true });
}
