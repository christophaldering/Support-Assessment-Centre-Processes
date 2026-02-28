import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setUserSession } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { email, password, workspaceSlug } = await req.json();

    if (!email || !password || !workspaceSlug) {
      return NextResponse.json({ error: "Bitte alle Felder ausfüllen." }, { status: 400 });
    }

    if (workspaceSlug.toLowerCase() === "comp" || workspaceSlug.toLowerCase() === "abcd") {
      const bdpResult = await tryBdpLogin(email.toLowerCase().trim(), password, workspaceSlug.toLowerCase());
      if (bdpResult) return bdpResult;
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: workspaceSlug.toLowerCase().trim() },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden. Bitte den Workspace-Namen prüfen." }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email_workspaceId: { email: email.toLowerCase().trim(), workspaceId: workspace.id } },
    });

    if (!user) {
      return NextResponse.json({ error: "Kein Konto mit dieser E-Mail-Adresse in diesem Workspace gefunden." }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json({ error: "Dieses Konto ist derzeit deaktiviert. Bitte den Workspace-Administrator kontaktieren." }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Falsches Passwort. Bitte erneut versuchen." }, { status: 401 });
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
    return NextResponse.json({ error: "Anfrage konnte nicht verarbeitet werden." }, { status: 400 });
  }
}

async function tryBdpLogin(email: string, password: string, ws: string = "comp"): Promise<NextResponse | null> {
  try {
    const emailMapping = await prisma.bdpNameMapping.findFirst({
      where: { entityType: "email", realName: email, workspace: ws },
    });

    if (!emailMapping) return null;

    const bdpUser = await prisma.bdpUser.findUnique({
      where: { id: emailMapping.entityId },
    });

    if (!bdpUser) return null;

    if (bdpUser.passwordHash !== password) return null;

    const sessionData = JSON.stringify({
      userId: bdpUser.id,
      code: bdpUser.code,
      role: bdpUser.role,
      isAdmin: bdpUser.isAdmin,
      environment: bdpUser.environment,
      workspaceSlug: ws,
    });

    cookies().set("bdp_session", sessionData, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });

    cookies().set("bdp_environment", bdpUser.environment, {
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: bdpUser.id,
        email,
        name: bdpUser.displayName || bdpUser.code,
        roles: [bdpUser.role],
        forcePasswordChange: false,
        workspaceSlug: ws,
      },
    });
  } catch {
    return null;
  }
}
