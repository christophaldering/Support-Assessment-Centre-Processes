import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { z } from "zod";

const prisma = new PrismaClient();

const scoreItemSchema = z.object({
  criterionId: z.string(),
  teamId: z.string(),
  points: z.number().int().min(0).max(100),
});

const submitSchema = z.object({
  sessionId: z.string(),
  scores: z.array(scoreItemSchema),
});

export async function GET(req: NextRequest) {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  const where: any = { observerId: session.userId };
  if (sessionId) where.sessionId = sessionId;

  const scores = await prisma.bdpScore.findMany({
    where,
    include: { criterion: true, team: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(scores);
}

export async function POST(req: NextRequest) {
  const bdpSession = getBdpSession();
  if (!bdpSession) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  const { sessionId, scores } = parsed.data;

  const dbSession = await prisma.bdpSession.findUnique({
    where: { id: sessionId },
    include: { sessionTeams: true },
  });
  if (!dbSession) return NextResponse.json({ error: "Session nicht gefunden" }, { status: 404 });

  if (dbSession.state === "DRAFT") return NextResponse.json({ error: "Session noch nicht geöffnet" }, { status: 403 });
  if (dbSession.state === "CLOSED") return NextResponse.json({ error: "Session geschlossen – Bewertung gesperrt" }, { status: 403 });
  if (dbSession.state === "RELEASED") return NextResponse.json({ error: "Session freigegeben – Bewertung gesperrt" }, { status: 403 });

  const assignment = await prisma.bdpObserverAssignment.findUnique({
    where: { sessionId_userId: { sessionId, userId: bdpSession.userId } },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Sie sind dieser Session nicht zugewiesen" }, { status: 403 });
  }

  const sessionTeamIds = dbSession.sessionTeams.map(st => st.teamId);
  const assignedTeamIds = assignment.canScoreTeamIds.length > 0
    ? assignment.canScoreTeamIds.filter(id => sessionTeamIds.includes(id))
    : sessionTeamIds;

  const criteria = await prisma.bdpCriterion.findMany({ where: { active: true } });
  const criterionIds = criteria.map(c => c.id);

  for (const score of scores) {
    if (!assignedTeamIds.includes(score.teamId)) {
      return NextResponse.json({ error: `Team ${score.teamId} ist nicht in Ihrem Bewertungsbereich` }, { status: 403 });
    }
    if (!criterionIds.includes(score.criterionId)) {
      return NextResponse.json({ error: "Ungültiges Kriterium" }, { status: 400 });
    }
  }

  for (const criterionId of criterionIds) {
    const criterionScores = scores.filter(s => s.criterionId === criterionId);
    if (criterionScores.length === 0) continue;

    const scoredTeamIds = criterionScores.map(s => s.teamId);
    const allTeamsScored = assignedTeamIds.every(tid => scoredTeamIds.includes(tid));

    if (allTeamsScored) {
      const sum = criterionScores.reduce((acc, s) => acc + s.points, 0);
      if (sum !== 100) {
        const critName = criteria.find(c => c.id === criterionId)?.name || criterionId;
        return NextResponse.json({
          error: `Punkte für "${critName}" müssen genau 100 ergeben (aktuell: ${sum})`,
        }, { status: 400 });
      }
    }
  }

  const results = [];
  for (const score of scores) {
    const result = await prisma.bdpScore.upsert({
      where: {
        sessionId_criterionId_observerId_teamId: {
          sessionId,
          criterionId: score.criterionId,
          observerId: bdpSession.userId,
          teamId: score.teamId,
        },
      },
      update: { points: score.points },
      create: {
        sessionId,
        criterionId: score.criterionId,
        observerId: bdpSession.userId,
        teamId: score.teamId,
        points: score.points,
        environment: bdpSession.environment,
      },
    });
    results.push(result);
  }

  return NextResponse.json({ success: true, scores: results });
}
