import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: { workspaceSlug: string };
}

const VALID_CATEGORIES = [
  "audio_recording",
  "ai_processing",
  "hr_sharing",
  "data_export",
  "transcription",
  "general",
];

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
  const language = searchParams.get("language");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {
    workspaceId: workspace.id,
    status: { not: "archived" },
  };
  if (language) where.language = language;
  if (category) where.category = category;

  const templates = await prisma.consentTemplate.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
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
    const { name, language, category, content } = body;

    if (!name || !content) {
      return NextResponse.json({ error: "Name und Inhalt sind erforderlich" }, { status: 400 });
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Ungültige Kategorie" }, { status: 400 });
    }

    const userId = session?.userId || "master";

    const template = await prisma.consentTemplate.create({
      data: {
        workspaceId: workspace.id,
        name,
        language: language || "de",
        category: category || "general",
        content,
      },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId,
      action: "consent_template.created",
      entityType: "ConsentTemplate",
      entityId: template.id,
      details: { name, language: language || "de", category: category || "general" },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error("Consent template creation error:", err);
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
