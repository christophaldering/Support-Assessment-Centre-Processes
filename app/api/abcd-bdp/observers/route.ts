import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getBdpSession } from "@/lib/bdp-auth";
import { z } from "zod";

const prisma = new PrismaClient();

const createSchema = z.object({
  code: z.string().min(1, "Code erforderlich"),
  role: z.enum(["BOARD", "MANAGEMENT_DIAGNOSTICS", "EXPERT"]),
  displayName: z.string().optional(),
  isAdmin: z.boolean().optional().default(false),
  environment: z.string().optional(),
});

export async function GET() {
  const session = getBdpSession();
  if (!session) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });

  const observers = await prisma.bdpUser.findMany({
    where: {
      role: { in: ["BOARD", "MANAGEMENT_DIAGNOSTICS", "EXPERT"] },
      environment: session.environment, workspace: session.workspaceSlug,
    },
    include: { observerAssignments: { include: { session: true } } },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(observers);
}

export async function POST(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten", details: parsed.error.flatten() }, { status: 400 });

  try {
    const user = await prisma.bdpUser.create({
      data: {
        code: parsed.data.code,
        role: parsed.data.role,
        displayName: parsed.data.displayName,
        isAdmin: parsed.data.isAdmin,
        environment: parsed.data.environment || session.environment,
        workspace: session.workspaceSlug,
      },
    });
    return NextResponse.json(user);
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Beobachter-Code existiert bereits" }, { status: 409 });
    throw e;
  }
}

export async function PUT(req: NextRequest) {
  const session = getBdpSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "ID erforderlich" }, { status: 400 });

  const updated = await prisma.bdpUser.update({ where: { id }, data });
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
