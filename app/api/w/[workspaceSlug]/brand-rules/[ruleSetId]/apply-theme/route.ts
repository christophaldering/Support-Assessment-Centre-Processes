import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; ruleSetId: string };
}

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "brandrules.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const brandRuleSet = await prisma.brandRuleSet.findFirst({
      where: { id: params.ruleSetId, workspaceId: workspace.id },
    });

    if (!brandRuleSet) {
      return NextResponse.json({ error: "Brand rule set not found" }, { status: 404 });
    }

    const rules = brandRuleSet.rulesJson as Record<string, any>;
    const colors = rules?.colors || {};
    const typography = rules?.typography || {};

    const theme = await prisma.theme.upsert({
      where: { workspaceId: workspace.id },
      create: {
        workspaceId: workspace.id,
        primaryColor: colors.primary || "#1a1a2e",
        secondaryColor: colors.secondary || "#16213e",
        accentColor: colors.accent || "#e94560",
        backgroundColor: colors.background || "#ffffff",
        fontFamily: typography.bodyFont || "Inter",
        fontFamilyHeading: typography.headingFont || "Playfair Display",
      },
      update: {
        primaryColor: colors.primary || "#1a1a2e",
        secondaryColor: colors.secondary || "#16213e",
        accentColor: colors.accent || "#e94560",
        backgroundColor: colors.background || "#ffffff",
        fontFamily: typography.bodyFont || "Inter",
        fontFamilyHeading: typography.headingFont || "Playfair Display",
      },
    });

    return NextResponse.json(theme);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
