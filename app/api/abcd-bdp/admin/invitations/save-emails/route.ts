import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { z } from "zod";

const prisma = new PrismaClient();

const schema = z.object({
  emails: z.record(z.string(), z.string().email().or(z.literal(""))),
});

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });
  if (session.workspaceSlug && session.workspaceSlug !== "abcd") return NextResponse.json({ error: "Workspace nicht erlaubt" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  const { emails } = parsed.data;

  for (const [code, email] of Object.entries(emails)) {
    if (email) {
      await prisma.bdpNameMapping.upsert({
        where: { entityType_entityId: { entityType: "email", entityId: code } },
        update: { realName: email },
        create: { entityType: "email", entityId: code, realName: email },
      });
    } else {
      await prisma.bdpNameMapping.deleteMany({
        where: { entityType: "email", entityId: code },
      });
    }
  }

  return NextResponse.json({ success: true, saved: Object.keys(emails).length });
}
