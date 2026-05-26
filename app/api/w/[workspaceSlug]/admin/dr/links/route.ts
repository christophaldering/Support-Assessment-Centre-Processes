import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { makeToken } from "@/lib/dr/tokens";

interface RouteContext {
  params: { workspaceSlug: string };
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

  const links = await prisma.dataRoomAccessLink.findMany({
    where: { workspace: params.workspaceSlug },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { events: true } } },
  });

  return NextResponse.json({ ok: true, links });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!isAdmin(session, master, params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { label, email, dataRoomSlug, expiresAt, multiUse = true } = body as {
    label?: string;
    email?: string;
    dataRoomSlug?: string;
    expiresAt?: string;
    multiUse?: boolean;
  };

  if (!label || !dataRoomSlug || !expiresAt) {
    return NextResponse.json(
      { ok: false, error: "label, dataRoomSlug, expiresAt erforderlich" },
      { status: 400 }
    );
  }

  const link = await prisma.dataRoomAccessLink.create({
    data: {
      token: makeToken(),
      label,
      email: email || null,
      dataRoomSlug,
      expiresAt: new Date(expiresAt),
      multiUse: !!multiUse,
      workspace: params.workspaceSlug,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.diagnostic-suite.de";
  const url = `${baseUrl}/dr/${link.token}`;

  return NextResponse.json({ ok: true, id: link.id, url, expiresAt: link.expiresAt });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!isAdmin(session, master, params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ ok: false, error: "id erforderlich" }, { status: 400 });

  const result = await prisma.dataRoomAccessLink.updateMany({
    where: { id, workspace: params.workspaceSlug },
    data: { revoked: true },
  });

  if (result.count === 0) {
    return NextResponse.json({ ok: false, error: "Not found or access denied" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
