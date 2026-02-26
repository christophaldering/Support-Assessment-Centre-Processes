import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { z } from "zod";

const prisma = new PrismaClient();

const createSchema = z.object({
  entityType: z.enum(["observer", "participant", "team"]),
  entityId: z.string().min(1),
  realName: z.string().min(1, "Realname erforderlich"),
});

export async function GET() {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const mappings = await prisma.bdpNameMapping.findMany({ where: { workspace: session.workspaceSlug } });
  return NextResponse.json(mappings);
}

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  const mapping = await prisma.bdpNameMapping.upsert({
    where: { entityType_entityId: { entityType: parsed.data.entityType, entityId: parsed.data.entityId } },
    update: { realName: parsed.data.realName },
    create: { ...parsed.data, workspace: session.workspaceSlug },
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
