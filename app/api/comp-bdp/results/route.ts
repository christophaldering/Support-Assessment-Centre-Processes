import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const bdpSession = getBdpSession();
  if (!bdpSession) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId erforderlich" }, { status: 400 });

  const dbSession = await prisma.bdpSession.findUnique({
    where: { id: sessionId },
    include: { sessionTeams: { include: { team: true } } },
  });

  if (!dbSession) return NextResponse.json({ error: "Session nicht gefunden" }, { status: 404 });

  const isDemoEnv = bdpSession.environment === "demo";

  if (dbSession.state !== "RELEASED" && !bdpSession.isAdmin && !isDemoEnv) {
    return NextResponse.json({ error: "Die Auswertung wird sichtbar, sobald die Bewertung abgeschlossen ist" }, { status: 403 });
  }

  const scores = await prisma.bdpScore.findMany({
    where: { sessionId, environment: bdpSession.environment },
    include: { criterion: true, team: true, observer: true },
  });

  const criteria = await prisma.bdpCriterion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  const teamTotals: Record<string, { teamId: string; teamCode: string; total: number; byCriterion: Record<string, number> }> = {};

  for (const st of dbSession.sessionTeams) {
    teamTotals[st.team.id] = {
      teamId: st.team.id,
      teamCode: st.team.displayName ? `${st.team.displayName} (${st.team.code})` : st.team.code,
      total: 0,
      byCriterion: {},
    };
    for (const c of criteria) {
      teamTotals[st.team.id].byCriterion[c.id] = 0;
    }
  }

  for (const score of scores) {
    if (teamTotals[score.teamId]) {
      teamTotals[score.teamId].total += score.points;
      teamTotals[score.teamId].byCriterion[score.criterionId] =
        (teamTotals[score.teamId].byCriterion[score.criterionId] || 0) + score.points;
    }
  }

  const ranked = Object.values(teamTotals).sort((a, b) => b.total - a.total);

  let isTie = false;
  if (ranked.length >= 2 && ranked[0].total === ranked[1].total) {
    isTie = true;
  }

  const tieBreak = await prisma.bdpTieBreak.findUnique({ where: { sessionId } });

  let perObserver = null;
  if (bdpSession.isAdmin) {
    const grouped: Record<string, Record<string, Record<string, number>>> = {};
    for (const score of scores) {
      const obsKey = score.observer.displayName || score.observer.code;
      if (!grouped[obsKey]) grouped[obsKey] = {};
      if (!grouped[obsKey][score.teamId]) grouped[obsKey][score.teamId] = {};
      grouped[obsKey][score.teamId][score.criterionId] = score.points;
    }
    perObserver = grouped;
  }

  const teamIds = dbSession.sessionTeams.map(st => st.team.id);
  const teamFeedbacks: Record<string, string> = {};
  for (const st of dbSession.sessionTeams) {
    if (st.team.feedback) {
      const teamLabel = st.team.displayName || st.team.code;
      teamFeedbacks[teamLabel] = st.team.feedback;
    }
  }

  const participantIds = await prisma.bdpTeamParticipant.findMany({
    where: { teamId: { in: teamIds } },
    include: { participant: true, team: true },
  });

  const individualNotes = await prisma.bdpIndividualNote.findMany({
    where: { sessionId, environment: bdpSession.environment },
    include: { participant: true, observer: true },
  });

  const notesFormatted = individualNotes.map(n => ({
    participantName: n.participant.displayName || n.participant.code,
    observerName: n.observer.displayName || n.observer.code,
    note: n.note,
    generalNote: n.generalNote,
    contribution: n.contribution,
    presence: n.presence,
    teamName: participantIds.find(tp => tp.participantId === n.participantId)?.team?.displayName || "",
  }));

  return NextResponse.json({
    session: {
      id: dbSession.id,
      name: dbSession.name,
      state: dbSession.state,
      summary: dbSession.summary || null,
    },
    criteria: criteria.map(c => ({ id: c.id, name: c.name })),
    ranked,
    isTie,
    tieBreak: tieBreak ? { winnerTeamId: tieBreak.winnerTeamId, rationale: tieBreak.rationale, decidedById: tieBreak.decidedById } : null,
    perObserver,
    teamFeedbacks,
    individualNotes: notesFormatted,
  });
}
