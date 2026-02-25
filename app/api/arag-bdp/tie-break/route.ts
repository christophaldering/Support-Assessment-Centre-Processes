import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId erforderlich" }, { status: 400 });

  const tieBreak = await prisma.bdpTieBreak.findUnique({
    where: { sessionId },
    include: { winnerTeam: true, decidedBy: true },
  });

  return NextResponse.json(tieBreak);
}

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const { sessionId, winnerTeamId, decidedById, rationale } = await req.json();

  if (!sessionId || !winnerTeamId || !decidedById) {
    return NextResponse.json({ error: "sessionId, winnerTeamId und decidedById erforderlich" }, { status: 400 });
  }

  const bdpUser = await prisma.bdpUser.findUnique({ where: { id: decidedById } });
  if (!bdpUser) {
    const byCode = await prisma.bdpUser.findUnique({ where: { code: session.code } });
    if (!byCode) {
      return NextResponse.json({ error: "Entscheider nicht gefunden" }, { status: 404 });
    }
    const tieBreak = await prisma.bdpTieBreak.upsert({
      where: { sessionId },
      update: { winnerTeamId, decidedById: byCode.id, rationale },
      create: { sessionId, winnerTeamId, decidedById: byCode.id, rationale },
    });
    return NextResponse.json(tieBreak);
  }

  const tieBreak = await prisma.bdpTieBreak.upsert({
    where: { sessionId },
    update: { winnerTeamId, decidedById, rationale },
    create: { sessionId, winnerTeamId, decidedById, rationale },
  });

  return NextResponse.json(tieBreak);
}
