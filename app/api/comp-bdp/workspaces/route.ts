import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const workspaces = await prisma.workspace.findMany({
    where: { status: "active" },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(workspaces);
}
