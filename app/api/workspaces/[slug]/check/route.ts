import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const workspace = await prisma.workspace.findFirst({
      where: { slug: params.slug.toLowerCase(), status: "active" },
      select: { slug: true, name: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ slug: workspace.slug, name: workspace.name });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
