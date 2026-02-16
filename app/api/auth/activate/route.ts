import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setUserSession } from "@/lib/session";

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
      return NextResponse.json({ error: "Workspace nicht gefunden." }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email_workspaceId: { email: email.toLowerCase().trim(), workspaceId: workspace.id } },
    });

    if (!user || user.status !== "active") {
      return NextResponse.json(
        { error: "Kein Konto mit dieser E-Mail-Adresse gefunden." },
        { status: 404 }
      );
    }

    if (!user.forcePasswordChange) {
      return NextResponse.json(
        { error: "Ihr Konto wurde bereits aktiviert. Bitte melden Sie sich mit Ihrem Passwort an." },
        { status: 400 }
      );
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
        name: user.name,
        workspaceSlug: workspace.slug,
      },
    });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }
}
