import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { z } from "zod";

const prisma = new PrismaClient();

const upsertSchema = z.object({
  sessionId: z.string(),
  teamId: z.string(),
  isSponsor: z.boolean(),
});

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

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  const { sessionId, teamId, isSponsor } = parsed.data;

  const dbSession = await prisma.bdpSession.findUnique({ where: { id: sessionId } });
  if (!dbSession) return NextResponse.json({ error: "Session nicht gefunden" }, { status: 404 });
  if (dbSession.state !== "OPEN") {
    return NextResponse.json({ error: "Sponsor-Kennzeichnung nur bei offenen Sessions möglich" }, { status: 403 });
  }

  const flag = await prisma.bdpSponsorFlag.upsert({
    where: { observerId_teamId_sessionId: { observerId: bdpSession.userId, teamId, sessionId } },
    update: { isSponsor },
    create: { observerId: bdpSession.userId, teamId, sessionId, isSponsor, environment: bdpSession.environment },
  });

  return NextResponse.json(flag);
}
