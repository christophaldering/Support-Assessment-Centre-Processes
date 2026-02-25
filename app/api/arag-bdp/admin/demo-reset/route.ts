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
  await prisma.bdpUser.deleteMany({ where: { environment: ENV } });
}

async function seedDemo() {
  const criteria = await prisma.bdpCriterion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  if (criteria.length === 0) {
    return { error: "Keine aktiven Kriterien vorhanden — bitte zuerst Kriterien anlegen." };
  }

  const v1 = await prisma.bdpUser.create({
    data: { id: randomUUID(), code: "DV1", role: "BOARD", displayName: "Demo Vorstand 1", isAdmin: true, environment: ENV, username: "DV1", passwordHash: "Demo" },
  });
  const md1 = await prisma.bdpUser.create({
    data: { id: randomUUID(), code: "DMD1", role: "MANAGEMENT_DIAGNOSTICS", displayName: "Demo MD 1", isAdmin: true, environment: ENV, username: "DMD1", passwordHash: "Demo" },
  });
  const e1 = await prisma.bdpUser.create({
    data: { id: randomUUID(), code: "DE1", role: "EXPERT", displayName: "Demo Experte 1", isAdmin: false, environment: ENV, username: "DE1", passwordHash: "Demo" },
  });
  const observers = [v1, md1, e1];

  const teamCodes = ["DTeam1", "DTeam2", "DTeam3", "DTeam4", "DTeam5", "DTeam6"];
  const teams = [];
  for (const code of teamCodes) {
    const t = await prisma.bdpTeam.create({
      data: { id: randomUUID(), code, displayName: `Demo ${code}`, environment: ENV },
    });
    teams.push(t);
  }

  const participantNames = [
    "DTN01","DTN02","DTN03","DTN04","DTN05","DTN06","DTN07",
    "DTN08","DTN09","DTN10","DTN11","DTN12","DTN13","DTN14",
    "DTN15","DTN16","DTN17","DTN18","DTN19","DTN20","DTN21",
  ];
  const participants = [];
  for (const code of participantNames) {
    const p = await prisma.bdpParticipant.create({
      data: { id: randomUUID(), code, displayName: `Demo TN ${code}`, environment: ENV },
    });
    participants.push(p);
  }

  let pIdx = 0;
  for (const team of teams) {
    const count = team.code === "DTeam1" || team.code === "DTeam2" ? 4 : 3;
    for (let i = 0; i < count && pIdx < participants.length; i++) {
      await prisma.bdpTeamParticipant.create({
        data: { teamId: team.id, participantId: participants[pIdx].id },
      });
      pIdx++;
    }
  }

  const sessionNames = ["Demo Session Alpha", "Demo Session Beta", "Demo Session Gamma"];
  const sessions = [];
  for (const name of sessionNames) {
    const s = await prisma.bdpSession.create({
      data: {
        id: randomUUID(),
        name,
        state: "RELEASED",
        environment: ENV,
        transparencyMode: "show_per_observer_breakdown",
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        releasedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });
    sessions.push(s);
  }

  const sessionTeamAssignments = [
    [0, 1, 2],
    [2, 3, 4],
    [0, 4, 5],
  ];

  for (let si = 0; si < sessions.length; si++) {
    const teamIdxs = sessionTeamAssignments[si];
    for (const ti of teamIdxs) {
      await prisma.bdpSessionTeam.create({
        data: { sessionId: sessions[si].id, teamId: teams[ti].id },
      });
    }
    for (const obs of observers) {
      await prisma.bdpObserverAssignment.create({
        data: {
          sessionId: sessions[si].id,
          userId: obs.id,
          canScoreTeamIds: teamIdxs.map(ti => teams[ti].id),
        },
      });
    }
  }

  for (let si = 0; si < sessions.length; si++) {
    const teamIdxs = sessionTeamAssignments[si];
    const numTeams = teamIdxs.length;

    for (const obs of observers) {
      for (const crit of criteria) {
        const points = distributePoints(100, numTeams, si, obs.code, crit.id);
        for (let ti = 0; ti < numTeams; ti++) {
          await prisma.bdpScore.create({
            data: {
              sessionId: sessions[si].id,
              criterionId: crit.id,
              observerId: obs.id,
              teamId: teams[teamIdxs[ti]].id,
              points: points[ti],
              environment: ENV,
            },
          });
        }
      }
    }
  }

  const tieSessionIdx = 2;
  const tieTeamIdxs = sessionTeamAssignments[tieSessionIdx];
  for (const obs of observers) {
    for (const crit of criteria) {
      const equalPoints = distributeEqual(100, tieTeamIdxs.length);
      for (let ti = 0; ti < tieTeamIdxs.length; ti++) {
        await prisma.bdpScore.updateMany({
          where: {
            sessionId: sessions[tieSessionIdx].id,
            criterionId: crit.id,
            observerId: obs.id,
            teamId: teams[tieTeamIdxs[ti]].id,
          },
          data: { points: equalPoints[ti] },
        });
      }
    }
  }

  await prisma.bdpTieBreak.create({
    data: {
      sessionId: sessions[tieSessionIdx].id,
      winnerTeamId: teams[tieTeamIdxs[0]].id,
      decidedById: v1.id,
      rationale: "Demo Tie-Break: Team wurde aufgrund der stärkeren Gesamtpräsentation als Gewinner gewählt.",
    },
  });

  for (const obs of observers) {
    for (let si = 0; si < sessions.length; si++) {
      const teamIdxs = sessionTeamAssignments[si];
      for (const ti of teamIdxs) {
        await prisma.bdpSponsorFlag.create({
          data: {
            observerId: obs.id,
            teamId: teams[ti].id,
            sessionId: sessions[si].id,
            isSponsor: ti === teamIdxs[0],
            environment: ENV,
          },
        });
      }
    }
  }

  const noteParticipants = [participants[0], participants[3], participants[7]];
  for (const p of noteParticipants) {
    if (!p) continue;
    await prisma.bdpIndividualNote.create({
      data: {
        sessionId: sessions[0].id,
        participantId: p.id,
        observerId: v1.id,
        criterionId: criteria[0]?.id || null,
        note: `Demo-Notiz für ${p.code}: Sehr engagiert und strukturiert in der Gruppenarbeit.`,
        generalNote: `${p.code} zeigt Führungsqualitäten und bringt das Team voran.`,
        contribution: 4,
        presence: 5,
        environment: ENV,
      },
    });
  }

  return {
    observers: observers.length,
    teams: teams.length,
    participants: participants.length,
    sessions: sessions.length,
    criteria: criteria.length,
  };
}

function distributePoints(total: number, count: number, seed1: number, seed2: string, seed3: string): number[] {
  const hash = (seed1 * 31 + seed2.charCodeAt(0) * 17 + seed3.charCodeAt(0) * 13) % 100;
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  const points = Array(count).fill(base);
  for (let i = 0; i < remainder; i++) {
    points[(hash + i) % count]++;
  }
  const shift = (hash % 7) - 3;
  if (count >= 2 && Math.abs(shift) < base) {
    points[0] += shift;
    points[1] -= shift;
  }
  return points;
}

function distributeEqual(total: number, count: number): number[] {
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  const points = Array(count).fill(base);
  for (let i = 0; i < remainder; i++) {
    points[i]++;
  }
  return points;
}
