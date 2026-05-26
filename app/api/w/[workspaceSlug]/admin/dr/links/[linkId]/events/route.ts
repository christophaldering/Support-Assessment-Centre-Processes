import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";

interface RouteContext {
  params: { workspaceSlug: string; linkId: string };
}

function isAdmin(session: ReturnType<typeof getUserSession>, master: boolean, workspaceSlug: string) {
  if (master) return true;
  if (!session || session.workspaceSlug !== workspaceSlug) return false;
  const adminRoles = ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN"];
  return session.roles.some((r) => adminRoles.includes(r));
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!isAdmin(session, master, params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const link = await prisma.dataRoomAccessLink.findUnique({
    where: { id: params.linkId },
  });

  if (!link || link.workspace !== params.workspaceSlug) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const events = await prisma.dataRoomEvent.findMany({
    where: { linkId: params.linkId },
    orderBy: [{ seq: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ ok: true, link, events });
}
