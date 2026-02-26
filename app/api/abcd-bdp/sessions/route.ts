import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { notifyAllObserversInSession, notifyAllAdmins } from "@/lib/bdp-notifications";
import { z } from "zod";

const prisma = new PrismaClient();

const createSchema = z.object({
  name: z.string().min(1, "Name erforderlich"),
  environment: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  state: z.enum(["DRAFT", "OPEN", "CLOSED", "RELEASED"]).optional(),
  transparencyMode: z.enum(["aggregates_only", "show_per_observer_breakdown"]).optional(),
});

export async function GET() {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const sessions = await prisma.bdpSession.findMany({
    where: { environment: session.environment, workspace: session.workspaceSlug },
    include: {
      sessionTeams: { include: { team: true } },
      observerAssignments: { include: { user: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  const created = await prisma.bdpSession.create({
    data: { name: parsed.data.name, state: "DRAFT", environment: parsed.data.environment || session.environment, workspace: session.workspaceSlug },
  });
  return NextResponse.json(created);
}

export async function PUT(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  const { id, ...data } = parsed.data;
  const updateData: any = { ...data };

  const validTransitions: Record<string, string[]> = {
    DRAFT: ["OPEN"],
    OPEN: ["CLOSED"],
    CLOSED: ["RELEASED", "OPEN"],
    RELEASED: [],
  };

  if (updateData.state) {
    const current = await prisma.bdpSession.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Session nicht gefunden" }, { status: 404 });
    if (!validTransitions[current.state]?.includes(updateData.state)) {
      return NextResponse.json({ error: `Übergang von ${current.state} nach ${updateData.state} nicht erlaubt` }, { status: 400 });
    }
    if (updateData.state === "OPEN") updateData.startedAt = new Date();
    if (updateData.state === "CLOSED") updateData.closedAt = new Date();
    if (updateData.state === "RELEASED") updateData.releasedAt = new Date();
  }

  const updated = await prisma.bdpSession.update({ where: { id }, data: updateData });

  if (updateData.state) {
    const stateLabels: Record<string, string> = {
      OPEN: "geöffnet",
      CLOSED: "geschlossen",
      RELEASED: "abgeschlossen",
    };
    const stateTypes: Record<string, string> = {
      OPEN: "session_opened",
      CLOSED: "session_closed",
      RELEASED: "session_released",
    };
    const label = stateLabels[updateData.state];
    const type = stateTypes[updateData.state];
    if (label && type) {
      try {
        await notifyAllObserversInSession(
          id,
          type as any,
          `Session ${label}`,
          `Die Session "${updated.name}" wurde ${label}.`,
          `/abcd-bdp/sessions/${id}`,
          updated.environment,
        );
        await notifyAllAdmins(
          type as any,
          `Session ${label}`,
          `Die Session "${updated.name}" wurde ${label}.`,
          `/abcd-bdp/admin`,
          updated.environment,
          session.userId,
        );
      } catch {}
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  await prisma.bdpSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
