import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { z } from "zod";

const prisma = new PrismaClient();

const upsertSchema = z.object({
  sessionId: z.string().uuid(),
  criterionId: z.string().uuid(),
  allocations: z.array(z.object({
    teamId: z.string().uuid(),
    points: z.number().int().min(0).max(100),
  })),
});

export async function POST(req: NextRequest) {
  const bdpSession = getBdpSession();
  if (!bdpSession) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  const { sessionId, criterionId, allocations } = parsed.data;

  const dbSession = await prisma.bdpSession.findUnique({
    where: { id: sessionId },
    include: { sessionTeams: true },
  });
  if (!dbSession) return NextResponse.json({ error: "Session nicht gefunden" }, { status: 404 });

  if (dbSession.state === "DRAFT") return NextResponse.json({ error: "Session noch nicht geöffnet" }, { status: 403 });
  if (dbSession.state === "CLOSED") return NextResponse.json({ error: "Session geschlossen – Bewertung gesperrt" }, { status: 403 });
  if (dbSession.state === "RELEASED") return NextResponse.json({ error: "Session freigegeben – Bewertung gesperrt" }, { status: 403 });

  const criterion = await prisma.bdpCriterion.findUnique({ where: { id: criterionId } });
  if (!criterion || !criterion.active) return NextResponse.json({ error: "Ungültiges Kriterium" }, { status: 400 });

  const assignment = await prisma.bdpObserverAssignment.findUnique({
    where: { sessionId_userId: { sessionId, userId: bdpSession.userId } },
  });
  if (!assignment) return NextResponse.json({ error: "Sie sind dieser Session nicht zugewiesen" }, { status: 403 });

  const sessionTeamIds = dbSession.sessionTeams.map(st => st.teamId);
  const scopeTeamIds = assignment.canScoreTeamIds.length > 0
    ? assignment.canScoreTeamIds.filter(id => sessionTeamIds.includes(id))
    : sessionTeamIds;

  for (const alloc of allocations) {
    if (!scopeTeamIds.includes(alloc.teamId)) {
      return NextResponse.json({ error: `Team ${alloc.teamId} ist nicht in Ihrem Bewertungsbereich` }, { status: 403 });
    }
  }

  const sum = allocations.reduce((a, b) => a + b.points, 0);
  if (sum !== 100) {
    return NextResponse.json({
      error: `Punkte müssen genau 100 ergeben (aktuell: ${sum})`,
      sum,
      expected: 100,
    }, { status: 400 });
  }

  const results = [];
  for (const alloc of allocations) {
    const result = await prisma.bdpScore.upsert({
      where: {
        sessionId_criterionId_observerId_teamId: {
          sessionId,
          criterionId,
          observerId: bdpSession.userId,
          teamId: alloc.teamId,
        },
      },
      update: { points: alloc.points },
      create: {
        sessionId,
        criterionId,
        observerId: bdpSession.userId,
        teamId: alloc.teamId,
        points: alloc.points,
        environment: bdpSession.environment,
      },
    });
    results.push(result);
  }

  return NextResponse.json({ success: true, scores: results });
}
