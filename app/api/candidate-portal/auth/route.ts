import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const CANDIDATE_COOKIE = "candidate_portal_session";

export async function POST(req: NextRequest) {
  try {
    const { email, password, isSettingPassword } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        roles: { has: "CANDIDATE" },
      },
      include: {
        workspace: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "No candidate account found with this email." }, { status: 404 });
    }

    const isPlaceholderHash = user.passwordHash === "FIRST_ACCESS_NO_PASSWORD";
    const hasRealPassword = user.passwordHash && user.passwordHash.length > 0 && !isPlaceholderHash;

    if (isSettingPassword) {
      if (!password || password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
      }

      if (hasRealPassword) {
        return NextResponse.json({ error: "Password is already set. Please log in." }, { status: 400 });
      }

      const hash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hash },
      });

      const session = {
        userId: user.id,
        email: user.email,
        name: user.name,
        workspaceSlug: user.workspace.slug,
        assessmentId: user.assessmentId,
      };

      const response = NextResponse.json({
        success: true,
        firstAccess: true,
        user: { id: user.id, email: user.email, name: user.name },
      });

      response.cookies.set(CANDIDATE_COOKIE, JSON.stringify(session), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });

      return response;
    }

    if (!hasRealPassword) {
      return NextResponse.json({
        needsPassword: true,
        userName: user.name,
      });
    }

    if (!password) {
      return NextResponse.json({
        hasPassword: true,
        userName: user.name,
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      workspaceSlug: user.workspace.slug,
      assessmentId: user.assessmentId,
    };

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });

    response.cookies.set(CANDIDATE_COOKIE, JSON.stringify(session), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (err) {
    console.error("[candidate-auth]", err);
    return NextResponse.json({ error: "Could not process request." }, { status: 500 });
  }
}
