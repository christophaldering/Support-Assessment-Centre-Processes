import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const observers = await prisma.bdpUser.findMany({
    where: { role: { in: ["BOARD", "MANAGEMENT_DIAGNOSTICS", "EXPERT"] } },
    include: { observerAssignments: { include: { session: true } } },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(observers);
}

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const user = await prisma.bdpUser.create({
    data: { code: body.code, role: body.role, displayName: body.displayName, isAdmin: body.isAdmin || false, environment: body.environment || "live" },
  });

  if (body.sessionId && body.canScoreTeamIds) {
    await prisma.bdpObserverAssignment.create({
      data: { sessionId: body.sessionId, userId: user.id, canScoreTeamIds: body.canScoreTeamIds },
    });
  }

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const { id, sessionId, canScoreTeamIds, ...data } = body;
  const updated = await prisma.bdpUser.update({ where: { id }, data });

  if (sessionId && canScoreTeamIds) {
    await prisma.bdpObserverAssignment.upsert({
      where: { sessionId_userId: { sessionId, userId: id } },
      update: { canScoreTeamIds },
      create: { sessionId, userId: id, canScoreTeamIds },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  await prisma.bdpUser.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
