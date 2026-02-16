import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setUserSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password, workspaceSlug } = await req.json();

    if (!email || !password || !workspaceSlug) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email_workspaceId: { email, workspaceId: workspace.id } },
    });

    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    setUserSession({
      userId: user.id,
      workspaceSlug: workspace.slug,
      roles: user.roles,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        forcePasswordChange: user.forcePasswordChange,
        workspaceSlug: workspace.slug,
        assessmentId: user.assessmentId,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
