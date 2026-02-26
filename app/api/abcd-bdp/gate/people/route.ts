import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { getUserSession } from "@/lib/session";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const gateCookie = cookies().get("abcd_gate_session");
  let authorized = gateCookie?.value === "authenticated";

  if (!authorized) {
    try {
      const session = await getUserSession();
      if (session) authorized = true;
    } catch {}
  }

  if (!authorized) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const environment = searchParams.get("environment");
  if (environment !== "live" && environment !== "demo") {
    return NextResponse.json({ error: "environment=live|demo erforderlich" }, { status: 400 });
  }

  const users = await prisma.bdpUser.findMany({
    where: { environment, workspace: "abcd" },
    orderBy: { code: "asc" },
  });

  const participants = await prisma.bdpParticipant.findMany({
    where: { environment, workspace: "abcd" },
    orderBy: { code: "asc" },
  });

  const userMappings = await prisma.bdpNameMapping.findMany({
    where: {
      entityType: "observer",
      entityId: { in: users.map(u => u.id) },
    },
  });

  const participantMappings = await prisma.bdpNameMapping.findMany({
    where: {
      entityType: "participant",
      entityId: { in: participants.map(p => p.id) },
    },
  });

  const userNameMap = new Map(userMappings.map(m => [m.entityId, m.realName]));
  const participantNameMap = new Map(participantMappings.map(m => [m.entityId, m.realName]));

  const observers: { code: string; realName: string; role: string }[] = [];
  const experts: { code: string; realName: string; role: string }[] = [];
  const admins: { code: string; realName: string; role: string }[] = [];

  for (const u of users) {
    const realName = userNameMap.get(u.id) || u.displayName || u.code;
    const entry = { code: u.code, realName, role: u.role };

    if (u.isAdmin) {
      admins.push(entry);
    }
    if (u.role === "BOARD") {
      observers.push(entry);
    } else if (u.role === "EXPERT") {
      experts.push(entry);
    } else if (u.role === "MANAGEMENT_DIAGNOSTICS") {
      if (!u.isAdmin) observers.push(entry);
    }
  }

  const participantList = participants.map(p => ({
    code: p.code,
    realName: participantNameMap.get(p.id) || p.displayName || p.code,
    role: "PARTICIPANT",
  }));

  return NextResponse.json({
    observers,
    experts,
    participants: participantList,
    admins,
  });
}
