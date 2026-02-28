import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });
  if (session.workspaceSlug && session.workspaceSlug !== "comp") return NextResponse.json({ error: "Workspace nicht erlaubt" }, { status: 403 });

  const users = await prisma.bdpUser.findMany({ orderBy: { code: "asc" } });
  const participants = await prisma.bdpParticipant.findMany({ orderBy: { code: "asc" } });
  const nameMappings = await prisma.bdpNameMapping.findMany();

  const nameMap: Record<string, string> = {};
  const emailMap: Record<string, string> = {};

  nameMappings.forEach(nm => {
    if (nm.entityType === "email") {
      emailMap[nm.entityId] = nm.realName;
    } else {
      nameMap[`${nm.entityType}:${nm.entityId}`] = nm.realName;
    }
  });

  const observers = users
    .filter(u => u.role === "BOARD" || u.role === "MANAGEMENT_DIAGNOSTICS")
    .map(u => ({
      code: u.code,
      id: u.id,
      type: "observer" as const,
      role: u.role,
      displayName: u.displayName || null,
      realName: nameMap[`observer:${u.id}`] || null,
      email: emailMap[u.code] || "",
    }));

  const experts = users
    .filter(u => u.role === "EXPERT")
    .map(u => ({
      code: u.code,
      id: u.id,
      type: "expert" as const,
      role: u.role,
      displayName: u.displayName || null,
      realName: nameMap[`observer:${u.id}`] || null,
      email: emailMap[u.code] || "",
    }));

  const teilnehmer = participants.map(p => ({
    code: p.code,
    id: p.id,
    type: "participant" as const,
    role: "PARTICIPANT",
    displayName: p.displayName || null,
    realName: nameMap[`participant:${p.id}`] || null,
    email: emailMap[p.code] || "",
  }));

  const sessions = await prisma.bdpSession.findMany({ orderBy: { createdAt: "desc" } });

  return NextResponse.json({ observers, experts, participants: teilnehmer, sessions });
}
