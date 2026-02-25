import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { z } from "zod";

const prisma = new PrismaClient();

const assignSchema = z.object({
  teamId: z.string().uuid(),
  participantId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");

  const where: any = teamId ? { teamId } : { team: { environment: session.environment } };
  const mappings = await prisma.bdpTeamParticipant.findMany({
    where,
    include: { team: true, participant: true },
    orderBy: { participant: { code: "asc" } },
  });
  return NextResponse.json(mappings);
}

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  try {
    const mapping = await prisma.bdpTeamParticipant.create({
      data: { teamId: parsed.data.teamId, participantId: parsed.data.participantId },
      include: { team: true, participant: true },
    });
    return NextResponse.json(mapping);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Teilnehmer bereits diesem Team zugeordnet" }, { status: 409 });
    throw e;
  }
}

export async function DELETE(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  await prisma.bdpTeamParticipant.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
