import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const config = await prisma.bdpConfig.findFirst({ where: { workspace: session.workspaceSlug } });
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  let config = await prisma.bdpConfig.findFirst({ where: { workspace: session.workspaceSlug } });

  if (config) {
    config = await prisma.bdpConfig.update({ where: { id: config.id }, data: body });
  } else {
    config = await prisma.bdpConfig.create({ data: { ...body, workspace: session.workspaceSlug } });
  }

  return NextResponse.json(config);
}
