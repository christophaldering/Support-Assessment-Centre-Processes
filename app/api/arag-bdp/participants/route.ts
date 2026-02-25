import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const participants = await prisma.bdpParticipant.findMany({
    include: { teamParticipants: { include: { team: true } } },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(participants);
}

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const participant = await prisma.bdpParticipant.create({
    data: { code: body.code, displayName: body.displayName, environment: body.environment || "live" },
  });

  if (body.teamId) {
    await prisma.bdpTeamParticipant.create({
      data: { teamId: body.teamId, participantId: participant.id },
    });
  }

  return NextResponse.json(participant);
}

export async function PUT(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const { id, teamId, ...data } = await req.json();
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
