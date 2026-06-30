/**
 * GET /api/w/[workspaceSlug]/admin/dr/links/live
 *
 * Returns active sessions: links that sent a heartbeat within the last 60s.
 * Per active link: candidate name, current document (last "open"), session
 * start time, and last heartbeat.
 *
 * Designed for polling every 15s from the admin dashboard.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";

interface RouteContext {
  params: { workspaceSlug: string };
}

function isAdmin(
  session: ReturnType<typeof getUserSession>,
  master: boolean,
  workspaceSlug: string
): boolean {
  if (master) return true;
  if (!session || session.workspaceSlug !== workspaceSlug) return false;
  return session.roles.some((r) =>
    ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN"].includes(r)
  );
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!isAdmin(session, master, params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ACTIVE_WINDOW_MS = 60_000; // heartbeat within 60s = active
  const since = new Date(Date.now() - ACTIVE_WINDOW_MS);

  // Find all link IDs in this workspace that have a recent heartbeat
  const recentHeartbeats = await prisma.dataRoomEvent.findMany({
    where: {
      type: "heartbeat",
      createdAt: { gte: since },
      link: { workspace: params.workspaceSlug },
    },
    select: { linkId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  // Deduplicate: keep only the latest heartbeat per linkId
  const latestHbByLink = new Map<string, Date>();
  for (const hb of recentHeartbeats) {
    if (!latestHbByLink.has(hb.linkId)) {
      latestHbByLink.set(hb.linkId, hb.createdAt);
    }
  }

  if (latestHbByLink.size === 0) {
    return NextResponse.json({ ok: true, active: [], checkedAt: new Date().toISOString() });
  }

  const activeLinkIds = Array.from(latestHbByLink.keys());

  // Load link metadata
  const linkMeta = await prisma.dataRoomAccessLink.findMany({
    where: { id: { in: activeLinkIds }, workspace: params.workspaceSlug },
    select: { id: true, label: true, email: true, dataRoomSlug: true },
  });

  // For each active link: most recent "open" event (current doc) + session_start
  const [lastOpens, sessionStarts] = await Promise.all([
    prisma.dataRoomEvent.findMany({
      where: { linkId: { in: activeLinkIds }, type: "open" },
      orderBy: { createdAt: "desc" },
      select: { linkId: true, payload: true, createdAt: true },
    }),
    prisma.dataRoomEvent.findMany({
      where: { linkId: { in: activeLinkIds }, type: "session_start" },
      orderBy: { createdAt: "desc" },
      select: { linkId: true, createdAt: true },
    }),
  ]);

  const lastOpenByLink = new Map<string, { doc: string | null; at: Date }>();
  for (const ev of lastOpens) {
    if (!lastOpenByLink.has(ev.linkId)) {
      lastOpenByLink.set(ev.linkId, { doc: ev.payload, at: ev.createdAt });
    }
  }

  const sessionStartByLink = new Map<string, Date>();
  for (const ev of sessionStarts) {
    if (!sessionStartByLink.has(ev.linkId)) {
      sessionStartByLink.set(ev.linkId, ev.createdAt);
    }
  }

  const metaById = new Map(linkMeta.map((l) => [l.id, l]));
  const now = Date.now();

  const active = activeLinkIds
    .map((linkId) => {
      const meta = metaById.get(linkId);
      if (!meta) return null;
      const lastHeartbeat = latestHbByLink.get(linkId)!;
      const openInfo = lastOpenByLink.get(linkId) ?? null;
      const sessionStart = sessionStartByLink.get(linkId) ?? null;
      const sessionDurationMs = sessionStart ? now - sessionStart.getTime() : null;

      return {
        linkId,
        label: meta.label,
        email: meta.email,
        dataRoomSlug: meta.dataRoomSlug,
        currentDoc: openInfo?.doc ?? null,
        currentDocOpenedAt: openInfo?.at.toISOString() ?? null,
        sessionStartedAt: sessionStart?.toISOString() ?? null,
        sessionDurationMs,
        lastHeartbeat: lastHeartbeat.toISOString(),
        secondsSinceHeartbeat: Math.floor((now - lastHeartbeat.getTime()) / 1000),
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    ok: true,
    active,
    checkedAt: new Date().toISOString(),
  });
}
