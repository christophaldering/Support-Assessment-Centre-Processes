import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { z } from "zod";

const prisma = new PrismaClient();

const NoteUpsertSchema = z.object({
  sessionId: z.string().uuid(),
  participantId: z.string().uuid(),
  criterionId: z.string().uuid().nullable().optional(),
  note: z.string().optional().default(""),
  generalNote: z.string().optional().default(""),
  contribution: z.number().int().min(1).max(5).nullable().optional(),
  presence: z.number().int().min(1).max(5).nullable().optional(),
  marker: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const bdpSession = getBdpSession();
  if (!bdpSession) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request Body" }, { status: 400 });
  }

  const parsed = NoteUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validierungsfehler", details: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionId, participantId, criterionId, note, generalNote, contribution, presence } = parsed.data;

  const dbSession = await prisma.bdpSession.findUnique({ where: { id: sessionId } });
  if (!dbSession) return NextResponse.json({ error: "Session nicht gefunden" }, { status: 404 });

  if (dbSession.state === "DRAFT") {
    return NextResponse.json({ error: "Session noch nicht geöffnet" }, { status: 403 });
  }

  const isDemoEnv = bdpSession.environment === "demo";
  if (!isDemoEnv) {
    const config = await prisma.bdpConfig.findFirst();
    const lockNotes = config?.lockNotesOnClose ?? true;

    if (lockNotes && (dbSession.state === "CLOSED" || dbSession.state === "RELEASED")) {
      return NextResponse.json({ error: "Notizen sind gesperrt (Session geschlossen)" }, { status: 403 });
    }

    if (!lockNotes && dbSession.state === "RELEASED") {
      return NextResponse.json({ error: "Notizen sind gesperrt (Session abgeschlossen)" }, { status: 403 });
    }
  }

  const result = await prisma.bdpIndividualNote.upsert({
    where: {
      sessionId_participantId_observerId_criterionId: {
        sessionId,
        participantId,
        observerId: bdpSession.userId,
        criterionId: criterionId ?? null,
      },
    },
    update: {
      note: note ?? "",
      generalNote: generalNote ?? "",
      contribution: contribution ?? null,
      presence: presence ?? null,
    },
    create: {
      sessionId,
      participantId,
      observerId: bdpSession.userId,
      criterionId: criterionId ?? null,
      note: note ?? "",
      generalNote: generalNote ?? "",
      contribution: contribution ?? null,
      presence: presence ?? null,
      environment: bdpSession.environment,
    },
  });

  return NextResponse.json({ success: true, id: result.id });
}
