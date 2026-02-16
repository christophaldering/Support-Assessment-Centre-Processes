import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, workspaceSlug } = await req.json();

    if (!email || !workspaceSlug) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({
      where: { email_workspaceId: { email, workspaceId: workspace.id } },
    });

    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    console.log(`[Password Reset] Token for ${email}: ${token} (expires ${expiresAt.toISOString()})`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
