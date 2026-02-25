import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { createNotification } from "@/lib/bdp-notifications";
import { z } from "zod";

const prisma = new PrismaClient();

const assignSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  canScoreTeamIds: z.array(z.string().uuid()).optional().default([]),
});

export async function GET(req: NextRequest) {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  const where: any = sessionId ? { sessionId } : { session: { environment: session.environment } };
  const assignments = await prisma.bdpObserverAssignment.findMany({
    where,
    include: { session: true, user: true },
    orderBy: { user: { code: "asc" } },
  });
  return NextResponse.json(assignments);
}

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  try {
    const assignment = await prisma.bdpObserverAssignment.create({
      data: {
        sessionId: parsed.data.sessionId,
        userId: parsed.data.userId,
        canScoreTeamIds: parsed.data.canScoreTeamIds,
      },
      include: { session: true, user: true },
    });

    try {
      await createNotification({
        userId: parsed.data.userId,
        type: "observer_assigned",
        title: "Neue Session-Zuordnung",
        message: `Sie wurden der Session "${assignment.session.name}" als Beobachter zugeordnet.`,
        link: `/arag-bdp/sessions/${parsed.data.sessionId}`,
        environment: assignment.session.environment,
        metadata: { sessionId: parsed.data.sessionId },
      });
    } catch {}

    return NextResponse.json(assignment);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Beobachter bereits dieser Session zugeordnet" }, { status: 409 });
    throw e;
  }
}

export async function PUT(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const { id, canScoreTeamIds } = body;
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  const updated = await prisma.bdpObserverAssignment.update({
    where: { id },
    data: { canScoreTeamIds: canScoreTeamIds || [] },
    include: { session: true, user: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  await prisma.bdpObserverAssignment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
