import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const participantId = searchParams.get("participantId");

  const where: any = { observerId: session.userId, environment: session.environment };
  if (sessionId) where.sessionId = sessionId;
  if (participantId) where.participantId = participantId;

  const notes = await prisma.bdpIndividualNote.findMany({
    where,
    include: { participant: true, criterion: true },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const bdpSession = getBdpSession();
  if (!bdpSession) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const body = await req.json();
  const { sessionId, participantId, criterionId, note, generalNote, contribution, presence } = body;

  const dbSession = await prisma.bdpSession.findUnique({ where: { id: sessionId } });
  if (!dbSession) return NextResponse.json({ error: "Session nicht gefunden" }, { status: 404 });

  const config = await prisma.bdpConfig.findFirst();
  const lockNotes = config?.lockNotesOnClose ?? true;

  if (lockNotes && (dbSession.state === "CLOSED" || dbSession.state === "RELEASED")) {
    return NextResponse.json({ error: "Notizen sind gesperrt (Session geschlossen)" }, { status: 403 });
  }

  const result = await prisma.bdpIndividualNote.upsert({
    where: {
      sessionId_participantId_observerId_criterionId: {
        sessionId,
        participantId,
        observerId: bdpSession.userId,
        criterionId: criterionId || null,
      },
    },
    update: {
      note: note ?? "",
      generalNote: generalNote ?? "",
      contribution,
      presence,
    },
    create: {
      sessionId,
      participantId,
      observerId: bdpSession.userId,
      criterionId: criterionId || null,
      note: note ?? "",
      generalNote: generalNote ?? "",
      contribution,
      presence,
      environment: bdpSession.environment,
    },
  });

  return NextResponse.json(result);
}
