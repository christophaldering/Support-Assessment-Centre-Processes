import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const ENV = "demo";

export async function POST() {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  await deleteDemo();
  const result = await seedDemo();
  return NextResponse.json({ success: true, ...result });
}

async function deleteDemo() {
  await prisma.bdpTieBreak.deleteMany({ where: { session: { environment: ENV } } });
  await prisma.bdpIndividualNote.deleteMany({ where: { environment: ENV } });
  await prisma.bdpSponsorFlag.deleteMany({ where: { environment: ENV } });
  await prisma.bdpScore.deleteMany({ where: { environment: ENV } });
  await prisma.bdpObserverAssignment.deleteMany({ where: { session: { environment: ENV } } });
  await prisma.bdpSessionTeam.deleteMany({ where: { session: { environment: ENV } } });
  await prisma.bdpTeamParticipant.deleteMany({ where: { team: { environment: ENV } } });
  await prisma.bdpSession.deleteMany({ where: { environment: ENV } });
  await prisma.bdpTeam.deleteMany({ where: { environment: ENV } });
  await prisma.bdpParticipant.deleteMany({ where: { environment: ENV } });
  await prisma.bdpNotification.deleteMany({ where: { environment: ENV } });
  await prisma.bdpUser.deleteMany({ where: { environment: ENV } });
  const demoEntities = await prisma.bdpNameMapping.findMany();
  const demoIds = demoEntities.filter(e => e.entityType.startsWith("demo_") || e.realName.includes("@arag-demo.eu") || e.realName.includes("@participants-demo.eu")).map(e => e.id);
  if (demoIds.length > 0) {
    await prisma.bdpNameMapping.deleteMany({ where: { id: { in: demoIds } } });
  }
}

async function seedDemo() {
  let criteria = await prisma.bdpCriterion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  if (criteria.length === 0) {
    const critNames = [
      "Strategische Kohärenz",
      "Ökonomische Stringenz & Business-Logik",
      "Umsetzungsfähigkeit & Operationalisierung",
      "Kollektive Führungsfähigkeit",
      "Souveränität im Defense / Q&A",
    ];
    for (let i = 0; i < critNames.length; i++) {
      await prisma.bdpCriterion.create({
        data: { id: randomUUID(), name: critNames[i], sortOrder: i, active: true },
      });
    }
    criteria = await prisma.bdpCriterion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  }

  const observerDefs = [
    { code: "D-V1", role: "BOARD", displayName: "Marie Curie (V1)", realName: "Marie Curie", email: "curie@arag-demo.eu", isAdmin: false },
    { code: "D-V2", role: "BOARD", displayName: "Alan Turing (V2)", realName: "Alan Turing", email: "turing@arag-demo.eu", isAdmin: false },
    { code: "D-V3", role: "BOARD", displayName: "Hannah Arendt (V3)", realName: "Hannah Arendt", email: "arendt@arag-demo.eu", isAdmin: false },
    { code: "D-V4", role: "BOARD", displayName: "Ada Lovelace (V4)", realName: "Ada Lovelace", email: "lovelace@arag-demo.eu", isAdmin: false },
    { code: "D-V5", role: "BOARD", displayName: "Nikola Tesla (V5)", realName: "Nikola Tesla", email: "tesla@arag-demo.eu", isAdmin: false },
    { code: "D-V6", role: "BOARD", displayName: "Simone de Beauvoir (V6)", realName: "Simone de Beauvoir", email: "beauvoir@arag-demo.eu", isAdmin: false },
    { code: "D-MD1", role: "MANAGEMENT_DIAGNOSTICS", displayName: "Virginia Woolf (MD1)", realName: "Virginia Woolf", email: "woolf@arag-demo.eu", isAdmin: true },
    { code: "D-E1", role: "EXPERT", displayName: "Peter Drucker (E1)", realName: "Peter Drucker", email: "drucker@arag-demo.eu", isAdmin: false },
  ];

  const users: Record<string, any> = {};
  for (const def of observerDefs) {
    const u = await prisma.bdpUser.create({
      data: {
        id: randomUUID(),
        code: def.code,
        role: def.role,
        displayName: def.displayName,
        isAdmin: def.isAdmin,
        environment: ENV,
        username: def.code,
        passwordHash: "Demo",
      },
    });
    users[def.code] = u;
    await prisma.bdpNameMapping.create({ data: { entityType: "observer", entityId: u.id, realName: def.realName } });
    await prisma.bdpNameMapping.create({ data: { entityType: "email", entityId: u.id, realName: def.email } });
  }

  const teamDefs = [
    { code: "D-Team1", displayName: "Amsterdam", city: "Amsterdam" },
    { code: "D-Team2", displayName: "Barcelona", city: "Barcelona" },
    { code: "D-Team3", displayName: "Berlin", city: "Berlin" },
    { code: "D-Team4", displayName: "Kopenhagen", city: "Kopenhagen" },
    { code: "D-Team5", displayName: "Mailand", city: "Mailand" },
    { code: "D-Team6", displayName: "Paris", city: "Paris" },
  ];

  const teams: any[] = [];
  for (const def of teamDefs) {
    const t = await prisma.bdpTeam.create({
      data: { id: randomUUID(), code: def.code, displayName: def.displayName, environment: ENV },
    });
    teams.push(t);
    await prisma.bdpNameMapping.create({ data: { entityType: "team", entityId: t.id, realName: def.city } });
  }

  const participantDefs = [
    { code: "D-TN1", realName: "Elizabeth Bennet", email: "bennet@participants-demo.eu" },
    { code: "D-TN2", realName: "Mr. Darcy", email: "darcy@participants-demo.eu" },
    { code: "D-TN3", realName: "Sherlock Holmes", email: "holmes@participants-demo.eu" },
    { code: "D-TN4", realName: "Dr. Watson", email: "watson@participants-demo.eu" },
    { code: "D-TN5", realName: "Anna Karenina", email: "karenina@participants-demo.eu" },
    { code: "D-TN6", realName: "Gregor Samsa", email: "samsa@participants-demo.eu" },
    { code: "D-TN7", realName: "Don Quijote", email: "quijote@participants-demo.eu" },
    { code: "D-TN8", realName: "Sancho Panza", email: "panza@participants-demo.eu" },
    { code: "D-TN9", realName: "Jay Gatsby", email: "gatsby@participants-demo.eu" },
    { code: "D-TN10", realName: "Atticus Finch", email: "finch@participants-demo.eu" },
    { code: "D-TN11", realName: "Hermione Granger", email: "granger@participants-demo.eu" },
    { code: "D-TN12", realName: "Jean Valjean", email: "valjean@participants-demo.eu" },
    { code: "D-TN13", realName: "Cosette Fauchelevent", email: "cosette@participants-demo.eu" },
    { code: "D-TN14", realName: "Odysseus", email: "odysseus@participants-demo.eu" },
    { code: "D-TN15", realName: "Penelope", email: "penelope@participants-demo.eu" },
    { code: "D-TN16", realName: "Hamlet", email: "hamlet@participants-demo.eu" },
    { code: "D-TN17", realName: "Ophelia", email: "ophelia@participants-demo.eu" },
    { code: "D-TN18", realName: "Huckleberry Finn", email: "huck@participants-demo.eu" },
    { code: "D-TN19", realName: "Winston Smith", email: "smith@participants-demo.eu" },
    { code: "D-TN20", realName: "Clarissa Dalloway", email: "dalloway@participants-demo.eu" },
    { code: "D-TN21", realName: "Gandalf", email: "gandalf@participants-demo.eu" },
  ];

  const participants: any[] = [];
  for (const def of participantDefs) {
    const p = await prisma.bdpParticipant.create({
      data: { id: randomUUID(), code: def.code, displayName: `${def.realName} (${def.code})`, environment: ENV },
    });
    participants.push(p);
    await prisma.bdpNameMapping.create({ data: { entityType: "participant", entityId: p.id, realName: def.realName } });
    await prisma.bdpNameMapping.create({ data: { entityType: "email", entityId: p.id, realName: def.email } });
  }

  const teamParticipantMap: Record<number, number[]> = {
    0: [0, 1, 2, 3],
    1: [4, 5, 6],
    2: [7, 8, 9, 10],
    3: [11, 12, 13],
    4: [14, 15, 16, 17],
    5: [18, 19, 20],
  };

  for (const [teamIdx, pIdxs] of Object.entries(teamParticipantMap)) {
    for (const pIdx of pIdxs) {
      await prisma.bdpTeamParticipant.create({
        data: { teamId: teams[Number(teamIdx)].id, participantId: participants[pIdx].id },
      });
    }
  }

  const sessions: any[] = [];
  const sessionDefs = [
    { name: "BDP Session 1 — Amsterdam vs Barcelona", teamIdxs: [0, 1] },
    { name: "BDP Session 2 — Berlin vs Kopenhagen", teamIdxs: [2, 3] },
    { name: "BDP Session 3 — Mailand vs Paris", teamIdxs: [4, 5] },
  ];

  for (const def of sessionDefs) {
    const s = await prisma.bdpSession.create({
      data: {
        id: randomUUID(),
        name: def.name,
        state: "RELEASED",
        environment: ENV,
        transparencyMode: "show_per_observer_breakdown",
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        releasedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });
    sessions.push(s);

    for (const ti of def.teamIdxs) {
      await prisma.bdpSessionTeam.create({ data: { sessionId: s.id, teamId: teams[ti].id } });
    }
  }

  const sessionObserverMap: Record<number, string[]> = {
    0: ["D-V1", "D-MD1", "D-E1"],
    1: ["D-V2", "D-MD1", "D-E1"],
    2: ["D-V3", "D-MD1", "D-E1"],
  };

  for (const [si, obsCodes] of Object.entries(sessionObserverMap)) {
    const sIdx = Number(si);
    const teamIdxs = sessionDefs[sIdx].teamIdxs;
    for (const obsCode of obsCodes) {
      await prisma.bdpObserverAssignment.create({
        data: {
          sessionId: sessions[sIdx].id,
          userId: users[obsCode].id,
          canScoreTeamIds: teamIdxs.map(ti => teams[ti].id),
        },
      });
    }
  }

  const sponsorMap: Record<number, { obsCode: string; teamIdx: number }> = {
    0: { obsCode: "D-V1", teamIdx: 0 },
    1: { obsCode: "D-V2", teamIdx: 2 },
    2: { obsCode: "D-V3", teamIdx: 5 },
  };

  for (let si = 0; si < sessions.length; si++) {
    const teamIdxs = sessionDefs[si].teamIdxs;
    const obsCodes = sessionObserverMap[si];
    for (const obsCode of obsCodes) {
      for (const ti of teamIdxs) {
        const isSponsor = sponsorMap[si]?.obsCode === obsCode && sponsorMap[si]?.teamIdx === ti;
        await prisma.bdpSponsorFlag.create({
          data: {
            observerId: users[obsCode].id,
            teamId: teams[ti].id,
            sessionId: sessions[si].id,
            isSponsor,
            environment: ENV,
          },
        });
      }
    }
  }

  const scorePatterns: Record<number, Record<string, number[][]>> = {
    0: {
      "D-V1":  [[65,35],[55,45],[60,40],[50,50],[70,30]],
      "D-MD1": [[60,40],[52,48],[58,42],[55,45],[62,38]],
      "D-E1":  [[57,43],[49,51],[54,46],[52,48],[59,41]],
    },
    2: {
      "D-V3":  [[58,42],[53,47],[61,39],[48,52],[55,45]],
      "D-MD1": [[54,46],[50,50],[56,44],[52,48],[58,42]],
      "D-E1":  [[52,48],[47,53],[55,45],[50,50],[53,47]],
    },
  };

  const s2V2  = [[55,45],[50,50],[52,48],[48,52],[55,45]];
  const s2MD1 = [[52,48],[50,50],[55,45],[48,52],[50,50]];
  const s2E1  = [[53,47],[50,50],[53,47],[54,46],[45,55]];

  function sumCol(patterns: number[][], col: number): number {
    return patterns.reduce((s, row) => s + row[col], 0);
  }

  const v2Total0 = sumCol(s2V2, 0);
  const md1Total0 = sumCol(s2MD1, 0);
  const e1Total0 = sumCol(s2E1, 0);
  const v2Total1 = sumCol(s2V2, 1);
  const md1Total1 = sumCol(s2MD1, 1);
  const e1Total1 = sumCol(s2E1, 1);
  const berlin = v2Total0 + md1Total0 + e1Total0;
  const kopenh = v2Total1 + md1Total1 + e1Total1;
  const diff = berlin - kopenh;

  if (diff !== 0) {
    const half = diff / 2;
    s2V2[0][0] -= half;
    s2V2[0][1] += half;
  }

  scorePatterns[1] = {
    "D-V2": s2V2,
    "D-MD1": s2MD1,
    "D-E1": s2E1,
  };

  for (let si = 0; si < sessions.length; si++) {
    const teamIdxs = sessionDefs[si].teamIdxs;
    const obsCodes = Object.keys(scorePatterns[si]);
    for (const obsCode of obsCodes) {
      const patterns = scorePatterns[si][obsCode];
      for (let ci = 0; ci < criteria.length && ci < patterns.length; ci++) {
        for (let ti = 0; ti < teamIdxs.length; ti++) {
          await prisma.bdpScore.create({
            data: {
              sessionId: sessions[si].id,
              criterionId: criteria[ci].id,
              observerId: users[obsCode].id,
              teamId: teams[teamIdxs[ti]].id,
              points: patterns[ci][ti],
              environment: ENV,
            },
          });
        }
      }
    }
  }

  await prisma.bdpTieBreak.create({
    data: {
      sessionId: sessions[1].id,
      winnerTeamId: teams[2].id,
      decidedById: users["D-V2"].id,
      rationale: "Entscheidung nach inhaltlicher Zuspitzung im Q&A.",
    },
  });

  const notesDefs = [
    { si: 0, pIdx: 0, obsCode: "D-V1", note: "Sehr klare Rollenübernahme in der Strukturierung; im Q&A punktuell defensiv.", general: "Führt das Team souverän, sollte im Defense noch stärker auf Rückfragen eingehen.", contribution: 5, presence: 4 },
    { si: 0, pIdx: 1, obsCode: "D-V1", note: "Analytisch stark, bringt fundierte Argumente ein. Kommunikation könnte pointierter sein.", general: "Solide Leistung mit Potenzial zur strategischen Führung.", contribution: 4, presence: 4 },
    { si: 0, pIdx: 2, obsCode: "D-MD1", note: "Exzellente Recherche und Datenaufbereitung. Präsentation noch ausbaufähig.", general: "Starker Teamplayer mit analytischer Tiefe.", contribution: 4, presence: 3 },
    { si: 1, pIdx: 7, obsCode: "D-V2", note: "Hohe Kundenorientierung, starke Zahlenlogik; noch mehr Priorisierung im Maßnahmenplan.", general: "Überzeugt durch strukturiertes Vorgehen und klare Kommunikation.", contribution: 5, presence: 5 },
    { si: 1, pIdx: 8, obsCode: "D-MD1", note: "Kreative Ansätze in der Strategieentwicklung; gelegentlich zu detailverliebt.", general: "Bringt frische Perspektiven ein, sollte den Fokus stärker priorisieren.", contribution: 4, presence: 4 },
    { si: 2, pIdx: 14, obsCode: "D-V3", note: "Ruhige, aber bestimmte Führung. Baut Konsens effektiv auf.", general: "Natürliche Autorität gepaart mit diplomatischem Geschick.", contribution: 5, presence: 5 },
    { si: 2, pIdx: 15, obsCode: "D-V3", note: "Starker Auftritt im Q&A, konnte kritische Fragen souverän beantworten.", general: "Überzeugende Präsenz und argumentative Stärke.", contribution: 4, presence: 5 },
    { si: 2, pIdx: 18, obsCode: "D-MD1", note: "Gute Teamintegration, achtet auf Zeitmanagement. Inhaltlich noch vertiefbar.", general: "Verlässlicher Teamplayer mit Organisationstalent.", contribution: 3, presence: 4 },
  ];

  for (const nd of notesDefs) {
    await prisma.bdpIndividualNote.create({
      data: {
        sessionId: sessions[nd.si].id,
        participantId: participants[nd.pIdx].id,
        observerId: users[nd.obsCode].id,
        criterionId: criteria[0]?.id || null,
        note: nd.note,
        generalNote: nd.general,
        contribution: nd.contribution,
        presence: nd.presence,
        environment: ENV,
      },
    });
  }

  for (const crit of criteria) {
    for (const role of ["BOARD", "MANAGEMENT_DIAGNOSTICS", "EXPERT"]) {
      const existing = await prisma.bdpRoleWeight.findFirst({ where: { role, criterionId: crit.id } });
      if (!existing) {
        await prisma.bdpRoleWeight.create({
          data: { role, criterionId: crit.id, weight: 1.0, enabled: false },
        });
      }
    }
  }

  return {
    demoDatasetVersion: "D1.1",
    observers: Object.keys(users).length,
    teams: teams.length,
    participants: participants.length,
    sessions: sessions.length,
    criteria: criteria.length,
  };
}
