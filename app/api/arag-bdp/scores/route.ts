import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

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
  const { sessionId, scores } = body;

  const dbSession = await prisma.bdpSession.findUnique({ where: { id: sessionId } });
  if (!dbSession) return NextResponse.json({ error: "Session nicht gefunden" }, { status: 404 });
  if (dbSession.state === "CLOSED" || dbSession.state === "RELEASED") {
    return NextResponse.json({ error: "Bewertung ist gesperrt (Session geschlossen)" }, { status: 403 });
  }
  if (dbSession.state !== "OPEN") {
    return NextResponse.json({ error: "Bewertung noch nicht geöffnet" }, { status: 403 });
  }

  const assignment = await prisma.bdpObserverAssignment.findUnique({
    where: { sessionId_userId: { sessionId, userId: bdpSession.userId } },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Sie sind dieser Session nicht zugewiesen" }, { status: 403 });
  }

  const criteria = await prisma.bdpCriterion.findMany({ where: { active: true } });
  const criterionIds = criteria.map(c => c.id);
  const assignedTeamIds = assignment.canScoreTeamIds;

  for (const criterionId of criterionIds) {
    const criterionScores = scores.filter((s: any) => s.criterionId === criterionId);
    const sum = criterionScores.reduce((acc: number, s: any) => acc + (s.points || 0), 0);

    const scoredTeamIds = criterionScores.map((s: any) => s.teamId);
    const allAssignedTeamsScored = assignedTeamIds.every((tid: string) => scoredTeamIds.includes(tid));

    if (allAssignedTeamsScored && sum !== 100) {
      const critName = criteria.find(c => c.id === criterionId)?.name || criterionId;
      return NextResponse.json({
        error: `Punkte für "${critName}" müssen genau 100 ergeben (aktuell: ${sum})`,
      }, { status: 400 });
    }
  }

  for (const score of scores) {
    if (!assignedTeamIds.includes(score.teamId)) {
      return NextResponse.json({ error: `Team ${score.teamId} ist Ihnen nicht zugewiesen` }, { status: 403 });
    }
    if (!criterionIds.includes(score.criterionId)) {
      return NextResponse.json({ error: "Ungültiges Kriterium" }, { status: 400 });
    }
    if (typeof score.points !== "number" || score.points < 0) {
      return NextResponse.json({ error: "Punkte müssen eine positive Zahl sein" }, { status: 400 });
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
