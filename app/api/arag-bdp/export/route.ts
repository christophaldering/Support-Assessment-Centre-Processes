import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";
  const includeDemo = searchParams.get("include_demo") === "true";
  const named = searchParams.get("named") === "true";

  const envFilter = includeDemo ? {} : { environment: { not: "demo" } };

  const sessions = await prisma.bdpSession.findMany({
    include: {
      sessionTeams: { include: { team: true } },
      observerAssignments: { include: { user: true } },
    },
  });

  const scores = await prisma.bdpScore.findMany({
    where: envFilter as any,
    include: { criterion: true, team: true, observer: true, session: true },
  });

  const criteria = await prisma.bdpCriterion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const notes = await prisma.bdpIndividualNote.findMany({
    where: envFilter as any,
    include: { participant: true, criterion: true, observer: true },
  });
  const nameMappings = named ? await prisma.bdpNameMapping.findMany() : [];
  const tieBreaks = await prisma.bdpTieBreak.findMany({ include: { winnerTeam: true, decidedBy: true } });

  const nameMap: Record<string, string> = {};
  nameMappings.forEach(m => { nameMap[`${m.entityType}:${m.entityId}`] = m.realName; });

  const getDisplayName = (type: string, id: string, code: string) => {
    if (!named) return code;
    return nameMap[`${type}:${id}`] || code;
  };

  if (format === "csv") {
    const lines: string[] = [];
    lines.push("Session,Team,Kriterium,Gesamt-Punkte");

    for (const s of sessions) {
      for (const st of s.sessionTeams) {
        for (const c of criteria) {
          const total = scores
            .filter(sc => sc.sessionId === s.id && sc.teamId === st.teamId && sc.criterionId === c.id)
            .reduce((sum, sc) => sum + sc.points, 0);
          lines.push(`"${s.name}","${getDisplayName("team", st.teamId, st.team.code)}","${c.name}",${total}`);
        }
      }
    }

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="arag-bdp-export.csv"`,
      },
    });
  }

  const exportData = {
    exportDate: new Date().toISOString(),
    includesDemo: includeDemo,
    sessions: sessions.map(s => ({
      id: s.id,
      name: s.name,
      state: s.state,
      teams: s.sessionTeams.map(st => ({
        id: st.teamId,
        code: getDisplayName("team", st.teamId, st.team.code),
      })),
      observers: s.observerAssignments.map(oa => ({
        code: getDisplayName("observer", oa.userId, oa.user.code),
        role: oa.user.role,
      })),
    })),
    criteria: criteria.map(c => ({ id: c.id, name: c.name })),
    scores: scores.map(sc => ({
      session: sc.session.name,
      observer: getDisplayName("observer", sc.observerId, sc.observer.code),
      team: getDisplayName("team", sc.teamId, sc.team.code),
      criterion: sc.criterion.name,
      points: sc.points,
    })),
    notes: notes.map(n => ({
      session: n.sessionId,
      participant: getDisplayName("participant", n.participantId, n.participant.code),
      observer: getDisplayName("observer", n.observerId, n.observer.code),
      criterion: n.criterion?.name || "Allgemein",
      note: n.note,
      generalNote: n.generalNote,
      contribution: n.contribution,
      presence: n.presence,
    })),
    tieBreaks: tieBreaks.map(tb => ({
      sessionId: tb.sessionId,
      winner: getDisplayName("team", tb.winnerTeamId, tb.winnerTeam.code),
      decidedBy: getDisplayName("observer", tb.decidedById, tb.decidedBy.code),
      rationale: tb.rationale,
    })),
    poweredBy: "aestimamus",
  };

  return NextResponse.json(exportData);
}
