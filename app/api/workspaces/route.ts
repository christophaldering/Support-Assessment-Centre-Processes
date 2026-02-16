import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasMasterAuth } from "@/lib/session";

export async function GET() {
  if (!hasMasterAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workspaces = await prisma.workspace.findMany({
      include: { theme: true },
      orderBy: { createdAt: "desc" },
    });

    console.log(`[workspaces] Found ${workspaces.length} workspace(s)`);

    const safe = workspaces.map(({ adminPasswordHash: _hash, ...w }) => w);
    return NextResponse.json(safe);
  } catch (err: any) {
    console.error("[workspaces] Database error:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to load workspaces", detail: err?.message },
      { status: 500 }
    );
  }
}
