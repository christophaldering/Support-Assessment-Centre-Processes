import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const mappings = await prisma.bdpNameMapping.findMany();
  return NextResponse.json(mappings);
}

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const { entityType, entityId, realName } = await req.json();

  const mapping = await prisma.bdpNameMapping.upsert({
    where: { entityType_entityId: { entityType, entityId } },
    update: { realName },
    create: { entityType, entityId, realName },
  });

  return NextResponse.json(mapping);
}

export async function DELETE(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  await prisma.bdpNameMapping.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
