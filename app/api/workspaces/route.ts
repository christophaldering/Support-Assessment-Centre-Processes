import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasMasterAuth } from "@/lib/session";

export async function GET() {
  if (!hasMasterAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await prisma.workspace.findMany({
    include: { theme: true },
    orderBy: { createdAt: "desc" },
  });

  const safe = workspaces.map(({ adminPasswordHash: _hash, ...w }) => w);
  return NextResponse.json(safe);
}
