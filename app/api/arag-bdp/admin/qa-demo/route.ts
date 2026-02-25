import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

const ENV = "demo";

interface QACheck {
  name: string;
  status: "PASS" | "FAIL";
  detail: string;
}

export async function GET() {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const checks: QACheck[] = [];

  const sessions = await prisma.bdpSession.findMany({
    where: { environment: ENV },
    include: {
      sessionTeams: { include: { team: true } },
      observerAssignments: { include: { user: true } },
    },
  });

  checks.push({
    name: "Sessions vorhanden (3)",
    status: sessions.length === 3 ? "PASS" : "FAIL",
    detail: `${sessions.length} Sessions gefunden`,
  });

  const allReleased = sessions.every(s => s.state === "RELEASED");
  checks.push({
    name: "Alle Sessions RELEASED",
    status: allReleased ? "PASS" : "FAIL",
    detail: allReleased ? "Alle 3 Sessions sind RELEASED" : sessions.map(s => `${s.name}: ${s.state}`).join(", "),
  });

  for (const s of sessions) {
    const teamCount = s.sessionTeams.length;
    checks.push({
      name: `Session "${s.name}" — 2 Teams`,
      status: teamCount === 2 ? "PASS" : "FAIL",
      detail: `${teamCount} Teams zugeordnet`,
    });

    const obsCount = s.observerAssignments.length;
    checks.push({
      name: `Session "${s.name}" — 3 Beobachter`,
      status: obsCount === 3 ? "PASS" : "FAIL",
      detail: `${obsCount} Beobachter zugeordnet`,
    });
  }

  const teams = await prisma.bdpTeam.findMany({ where: { environment: ENV } });
  checks.push({
    name: "Teams vorhanden (6)",
    status: teams.length === 6 ? "PASS" : "FAIL",
    detail: `${teams.length} Teams gefunden`,
  });

  const teamsWithDisplayName = teams.filter(t => t.displayName && t.displayName.length > 0);
  checks.push({
    name: "Alle Teams haben displayName",
    status: teamsWithDisplayName.length === teams.length ? "PASS" : "FAIL",
    detail: teamsWithDisplayName.length === teams.length
      ? teams.map(t => `${t.code}=${t.displayName}`).join(", ")
      : `${teamsWithDisplayName.length}/${teams.length} haben displayName`,
  });

  const participants = await prisma.bdpParticipant.findMany({ where: { environment: ENV } });
  checks.push({
    name: "Teilnehmer vorhanden (21)",
    status: participants.length === 21 ? "PASS" : "FAIL",
    detail: `${participants.length} Teilnehmer gefunden`,
  });

  const pWithDisplayName = participants.filter(p => p.displayName && p.displayName.length > 0);
  checks.push({
    name: "Alle TN haben displayName",
    status: pWithDisplayName.length === participants.length ? "PASS" : "FAIL",
    detail: `${pWithDisplayName.length}/${participants.length} haben displayName`,
  });

  for (const team of teams) {
    const tps = await prisma.bdpTeamParticipant.findMany({ where: { teamId: team.id } });
    checks.push({
      name: `Team ${team.displayName || team.code} — TN zugeordnet`,
      status: tps.length > 0 ? "PASS" : "FAIL",
      detail: `${tps.length} Teilnehmer`,
    });
  }

  const users = await prisma.bdpUser.findMany({ where: { environment: ENV } });
  checks.push({
    name: "Beobachter vorhanden (≥3)",
    status: users.length >= 3 ? "PASS" : "FAIL",
    detail: `${users.length} Beobachter gefunden`,
  });

  const usersWithDisplayName = users.filter(u => u.displayName && u.displayName.length > 0);
  checks.push({
    name: "Alle Beobachter haben displayName",
    status: usersWithDisplayName.length === users.length ? "PASS" : "FAIL",
    detail: `${usersWithDisplayName.length}/${users.length} haben displayName`,
  });

  const nameMappings = await prisma.bdpNameMapping.findMany();
  const entityIds = [...users.map(u => u.id), ...participants.map(p => p.id), ...teams.map(t => t.id)];
  const mappedIds = new Set(nameMappings.map(m => m.entityId));
  const unmappedEntities = entityIds.filter(id => !mappedIds.has(id));
  checks.push({
    name: "NameMappings für alle Codes",
    status: unmappedEntities.length === 0 ? "PASS" : "FAIL",
    detail: unmappedEntities.length === 0
      ? `${nameMappings.length} Mappings vorhanden`
      : `${unmappedEntities.length} Entitäten ohne Mapping`,
  });

  const emailMappings = nameMappings.filter(m => m.entityType === "email");
  const emailEntityIds = new Set(emailMappings.map(m => m.entityId));
  const allUserAndParticipantIds = [...users.map(u => u.id), ...participants.map(p => p.id)];
  const missingEmails = allUserAndParticipantIds.filter(id => !emailEntityIds.has(id));
  checks.push({
    name: "Emails für alle Codes",
    status: missingEmails.length === 0 ? "PASS" : "FAIL",
    detail: missingEmails.length === 0
      ? `${emailMappings.length} Email-Mappings vorhanden`
      : `${missingEmails.length} ohne Email-Mapping`,
  });

  const criteria = await prisma.bdpCriterion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  checks.push({
    name: "Kriterien vorhanden (5)",
    status: criteria.length === 5 ? "PASS" : "FAIL",
    detail: criteria.map(c => c.name).join(", "),
  });

  let allScoresValid = true;
  let scoreDetail = "";
  for (const s of sessions) {
    for (const oa of s.observerAssignments) {
      for (const crit of criteria) {
        const scores = await prisma.bdpScore.findMany({
          where: { sessionId: s.id, observerId: oa.userId, criterionId: crit.id, environment: ENV },
        });
        const sum = scores.reduce((acc, sc) => acc + sc.points, 0);
        if (sum !== 100) {
          allScoresValid = false;
          scoreDetail += `${s.name}/${oa.user.code}/${crit.name}: sum=${sum} ≠ 100; `;
        }
      }
    }
  }
  checks.push({
    name: "Alle Score-Summen = 100",
    status: allScoresValid ? "PASS" : "FAIL",
    detail: allScoresValid ? "Alle Kombinationen korrekt" : scoreDetail.slice(0, 300),
  });

  let tieFound = false;
  let tieBreakRecordFound = false;
  for (const s of sessions) {
    const teamTotals: Record<string, number> = {};
    for (const st of s.sessionTeams) {
      const scores = await prisma.bdpScore.findMany({ where: { sessionId: s.id, teamId: st.teamId, environment: ENV } });
      teamTotals[st.teamId] = scores.reduce((acc, sc) => acc + sc.points, 0);
    }
    const totals = Object.values(teamTotals);
    if (totals.length === 2 && totals[0] === totals[1]) {
      tieFound = true;
      const tb = await prisma.bdpTieBreak.findFirst({ where: { sessionId: s.id } });
      if (tb) tieBreakRecordFound = true;
    }
  }
  checks.push({
    name: "Tie-Break Szenario vorhanden",
    status: tieFound ? "PASS" : "FAIL",
    detail: tieFound ? "Gleichstand gefunden" : "Kein Gleichstand in den Sessions",
  });
  checks.push({
    name: "TieBreak-Record vorhanden",
    status: tieBreakRecordFound ? "PASS" : "FAIL",
    detail: tieBreakRecordFound ? "TieBreak-Entscheidung gespeichert" : "Kein TieBreak-Record",
  });

  const notes = await prisma.bdpIndividualNote.findMany({ where: { environment: ENV } });
  checks.push({
    name: "Individual Notes vorhanden (≥6)",
    status: notes.length >= 6 ? "PASS" : "FAIL",
    detail: `${notes.length} Notizen gefunden`,
  });

  const passCount = checks.filter(c => c.status === "PASS").length;
  const failCount = checks.filter(c => c.status === "FAIL").length;

  return NextResponse.json({ checks, passCount, failCount, total: checks.length });
}
