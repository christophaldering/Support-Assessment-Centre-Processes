import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, getWorkspaceAuth, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  const wsAuth = getWorkspaceAuth();

  const hasAccess =
    master ||
    wsAuth === params.workspaceSlug ||
    (session && session.workspaceSlug === params.workspaceSlug);

  if (!hasAccess) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    include: { theme: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(workspace.theme || null);
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "theme.manage")) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const body = await req.json();
    const {
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
      fontFamily,
      fontFamilyHeading,
      logoUrl,
    } = body;

    if (!primaryColor || !secondaryColor || !accentColor) {
      return NextResponse.json(
        { error: "primaryColor, secondaryColor und accentColor sind erforderlich" },
        { status: 400 }
      );
    }

    const userId = session?.userId || "master";

    const existing = await prisma.theme.findUnique({
      where: { workspaceId: workspace.id },
    });

    let theme;
    if (existing) {
      theme = await prisma.theme.update({
        where: { workspaceId: workspace.id },
        data: {
          primaryColor,
          secondaryColor,
          accentColor,
          backgroundColor: backgroundColor || "#ffffff",
          textColor: textColor || "#1a1a1a",
          fontFamily: fontFamily || "Inter",
          fontFamilyHeading: fontFamilyHeading || "Playfair Display",
          logoUrl: logoUrl || null,
        },
      });
    } else {
      theme = await prisma.theme.create({
        data: {
          workspaceId: workspace.id,
          primaryColor,
          secondaryColor,
          accentColor,
          backgroundColor: backgroundColor || "#ffffff",
          textColor: textColor || "#1a1a1a",
          fontFamily: fontFamily || "Inter",
          fontFamilyHeading: fontFamilyHeading || "Playfair Display",
          logoUrl: logoUrl || null,
        },
      });
    }

    await logAudit({
      workspaceId: workspace.id,
      userId,
      action: existing ? "theme.updated" : "theme.created",
      entityType: "Theme",
      entityId: theme.id,
      details: { primaryColor, secondaryColor, accentColor, fontFamily, fontFamilyHeading },
    });

    return NextResponse.json(theme);
  } catch (err) {
    console.error("Theme update error:", err);
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
