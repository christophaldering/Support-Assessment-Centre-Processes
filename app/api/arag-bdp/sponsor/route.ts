import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  const where: any = {};
  if (sessionId) where.sessionId = sessionId;
  if (!session.isAdmin) where.observerId = session.userId;

  const flags = await prisma.bdpSponsorFlag.findMany({ where, include: { team: true } });
  return NextResponse.json(flags);
}

export async function POST(req: NextRequest) {
  const bdpSession = getBdpSession();
  if (!bdpSession) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { sessionId, teamId, isSponsor } = await req.json();

  const flag = await prisma.bdpSponsorFlag.upsert({
    where: { observerId_teamId_sessionId: { observerId: bdpSession.userId, teamId, sessionId } },
    update: { isSponsor },
    create: { observerId: bdpSession.userId, teamId, sessionId, isSponsor, environment: bdpSession.environment },
  });

  return NextResponse.json(flag);
}
