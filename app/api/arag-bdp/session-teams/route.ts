import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { z } from "zod";

const prisma = new PrismaClient();

const assignSchema = z.object({
  sessionId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  const where = sessionId ? { sessionId } : {};
  const mappings = await prisma.bdpSessionTeam.findMany({
    where,
    include: { session: true, team: true },
    orderBy: { team: { code: "asc" } },
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
    const mapping = await prisma.bdpSessionTeam.create({
      data: { sessionId: parsed.data.sessionId, teamId: parsed.data.teamId },
      include: { session: true, team: true },
    });
    return NextResponse.json(mapping);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Team bereits dieser Session zugeordnet" }, { status: 409 });
    throw e;
  }
}

export async function DELETE(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  await prisma.bdpSessionTeam.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
