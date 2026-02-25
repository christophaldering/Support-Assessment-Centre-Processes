import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const sessions = await prisma.bdpSession.findMany({
    include: {
      sessionTeams: { include: { team: true } },
      observerAssignments: { include: { user: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const created = await prisma.bdpSession.create({
    data: { name: body.name, state: "DRAFT", environment: body.environment || "live" },
  });
  return NextResponse.json(created);
}

export async function PUT(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const { id, ...data } = body;

  const validTransitions: Record<string, string[]> = {
    DRAFT: ["OPEN"],
    OPEN: ["CLOSED"],
    CLOSED: ["RELEASED", "OPEN"],
    RELEASED: [],
  };

  if (data.state) {
    const current = await prisma.bdpSession.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Session nicht gefunden" }, { status: 404 });
    if (!validTransitions[current.state]?.includes(data.state)) {
      return NextResponse.json({ error: `Übergang von ${current.state} nach ${data.state} nicht erlaubt` }, { status: 400 });
    }
    if (data.state === "OPEN") data.startedAt = new Date();
    if (data.state === "CLOSED") data.closedAt = new Date();
    if (data.state === "RELEASED") data.releasedAt = new Date();
  }

  const updated = await prisma.bdpSession.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  await prisma.bdpSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
