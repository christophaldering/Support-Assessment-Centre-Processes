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

  const tieBreak = await prisma.bdpTieBreak.upsert({
    where: { sessionId },
    update: { winnerTeamId, decidedById, rationale },
    create: { sessionId, winnerTeamId, decidedById, rationale },
  });

  return NextResponse.json(tieBreak);
}
