import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string };
}

const VALID_EVENT_TYPES = [
  "assessment.created",
  "assessment.completed",
  "rating.submitted",
  "consolidation.run",
  "report.generated",
  "ai.request",
  "audio.transcribed",
  "audio.summarized",
  "export.generated",
  "user.login",
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
  const eventType = searchParams.get("eventType");
  const entityType = searchParams.get("entityType");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = { workspaceId: workspace.id };
  if (eventType) where.eventType = eventType;
  if (entityType) where.entityType = entityType;

  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.gte = new Date(from);
    if (to) createdAt.lte = new Date(to);
    where.createdAt = createdAt;
  }

  const events = await prisma.usageEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const body = await req.json();
    const { eventType, entityType, entityId, metadata, credits } = body;

    if (!eventType) {
      return NextResponse.json({ error: "eventType ist erforderlich" }, { status: 400 });
    }

    if (!VALID_EVENT_TYPES.includes(eventType)) {
      return NextResponse.json({ error: "Ungültiger eventType" }, { status: 400 });
    }

    const userId = session?.userId || "master";

    const event = await prisma.usageEvent.create({
      data: {
        workspaceId: workspace.id,
        userId,
        eventType,
        entityType: entityType || null,
        entityId: entityId || null,
        metadata: metadata || null,
        credits: credits ?? 0,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("Usage event creation error:", err);
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
