import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { z } from "zod";

const prisma = new PrismaClient();

const createSchema = z.object({
  code: z.string().min(1, "Code erforderlich"),
  displayName: z.string().optional(),
  environment: z.string().optional(),
  teamId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).optional(),
  displayName: z.string().optional(),
  teamId: z.string().uuid().optional().nullable(),
});

export async function GET() {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const participants = await prisma.bdpParticipant.findMany({
    where: { environment: session.environment, workspace: session.workspaceSlug },
    include: { teamParticipants: { include: { team: true } } },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(participants);
}

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  try {
    const participant = await prisma.bdpParticipant.create({
      data: {
        code: parsed.data.code,
        displayName: parsed.data.displayName,
        environment: parsed.data.environment || session.environment,
        workspace: session.workspaceSlug,
      },
    });

    if (parsed.data.teamId) {
      await prisma.bdpTeamParticipant.create({
        data: { teamId: parsed.data.teamId, participantId: participant.id },
      });
    }

    return NextResponse.json(participant);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Teilnehmer-Code existiert bereits" }, { status: 409 });
    throw e;
  }
}

export async function PUT(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  const { id, teamId, ...data } = parsed.data;
  const updated = await prisma.bdpParticipant.update({ where: { id }, data });

  if (teamId !== undefined) {
    await prisma.bdpTeamParticipant.deleteMany({ where: { participantId: id } });
    if (teamId) {
      await prisma.bdpTeamParticipant.create({ data: { teamId, participantId: id } });
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

  await prisma.bdpParticipant.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
