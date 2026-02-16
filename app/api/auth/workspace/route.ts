import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setWorkspaceAuth } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, password } = await req.json();

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const match = await bcrypt.compare(password, workspace.adminPasswordHash);
    if (!match) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    setWorkspaceAuth(workspace.slug);
    return NextResponse.json({ success: true, slug: workspace.slug });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
