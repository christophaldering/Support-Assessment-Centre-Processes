import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedBdp() {
  const existing = await prisma.bdpUser.findFirst();
  if (existing) {
    console.log("[bdp-seed] BDP data already exists, skipping seed.");
    return;
  }

  console.log("[bdp-seed] Seeding COMP BDP data...");

  const users = await Promise.all([
    prisma.bdpUser.create({ data: { code: "V1", role: "BOARD", environment: "live" } }),
    prisma.bdpUser.create({ data: { code: "V2", role: "BOARD", environment: "live" } }),
    prisma.bdpUser.create({ data: { code: "V3", role: "BOARD", environment: "live" } }),
    prisma.bdpUser.create({ data: { code: "V4", role: "BOARD", environment: "live" } }),
    prisma.bdpUser.create({ data: { code: "V5", role: "BOARD", environment: "live" } }),
    prisma.bdpUser.create({ data: { code: "V6", role: "BOARD", environment: "live" } }),
    prisma.bdpUser.create({ data: { code: "MD1", role: "MANAGEMENT_DIAGNOSTICS", isAdmin: true, environment: "live" } }),
    prisma.bdpUser.create({ data: { code: "E1", role: "EXPERT", environment: "live" } }),
    prisma.bdpUser.create({ data: { code: "Demo", role: "BOARD", isAdmin: true, environment: "demo", username: "Demo", passwordHash: "Demo" } }),
  ]);

  const userMap: Record<string, string> = {};
  users.forEach(u => { userMap[u.code] = u.id; });

  const sessions = await Promise.all([
    prisma.bdpSession.create({ data: { name: "BDP Session 1", state: "DRAFT", environment: "live" } }),
    prisma.bdpSession.create({ data: { name: "BDP Session 2", state: "DRAFT", environment: "live" } }),
    prisma.bdpSession.create({ data: { name: "BDP Session 3", state: "DRAFT", environment: "live" } }),
  ]);

  const teams = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      prisma.bdpTeam.create({ data: { code: `Team${i + 1}`, environment: "live" } })
    )
  );

  const participants = await Promise.all(
    Array.from({ length: 21 }, (_, i) =>
      prisma.bdpParticipant.create({ data: { code: `TN${i + 1}`, environment: "live" } })
    )
  );

  const teamAssignments: [number, number[]][] = [
    [0, [0, 1, 2, 3]],
    [1, [4, 5, 6]],
    [2, [7, 8, 9, 10]],
    [3, [11, 12, 13]],
    [4, [14, 15, 16, 17]],
    [5, [18, 19, 20]],
  ];

  for (const [teamIdx, partIndices] of teamAssignments) {
    for (const pIdx of partIndices) {
      await prisma.bdpTeamParticipant.create({
        data: { teamId: teams[teamIdx].id, participantId: participants[pIdx].id },
      });
    }
  }

  const sessionTeamMap: [number, number[]][] = [
    [0, [0, 1]],
    [1, [2, 3]],
    [2, [4, 5]],
  ];

  for (const [sIdx, tIndices] of sessionTeamMap) {
    for (const tIdx of tIndices) {
      await prisma.bdpSessionTeam.create({
        data: { sessionId: sessions[sIdx].id, teamId: teams[tIdx].id },
      });
    }
  }

  const observerMap: [number, string[]][] = [
    [0, ["V1", "MD1", "E1"]],
    [1, ["V2", "MD1", "E1"]],
    [2, ["V3", "MD1", "E1"]],
  ];

  for (const [sIdx, codes] of observerMap) {
    const sessionTeams = sessionTeamMap[sIdx][1].map(tIdx => teams[tIdx].id);
    for (const code of codes) {
      await prisma.bdpObserverAssignment.create({
        data: {
          sessionId: sessions[sIdx].id,
          userId: userMap[code],
          canScoreTeamIds: sessionTeams,
        },
      });
    }
  }

  const criteriaNames = [
    "Strategische Kohärenz",
    "Ökonomische Stringenz & Business-Logik",
    "Umsetzungsfähigkeit & Operationalisierung",
    "Kollektive Führungsfähigkeit",
    "Souveränität im Defense / Q&A",
  ];

  for (let i = 0; i < criteriaNames.length; i++) {
    await prisma.bdpCriterion.create({
      data: { name: criteriaNames[i], sortOrder: i + 1, active: true },
    });
  }

  await prisma.bdpConfig.create({
    data: {
      projectKey: "COMP_BDP",
      enforceGatePassword: false,
      weightedAnalytics: false,
      lockNotesOnClose: true,
    },
  });

  console.log("[bdp-seed] COMP BDP seed complete.");
}
