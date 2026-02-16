import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; ruleSetId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "brandrules.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  return NextResponse.json(brandRuleSet);
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
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

    const existing = await prisma.brandRuleSet.findFirst({
      where: { id: params.ruleSetId, workspaceId: workspace.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Brand rule set not found" }, { status: 404 });
    }

    const {
      name,
      rulesJson,
      appliesToWorkspaceUi,
      appliesToDocuments,
      appliesToPptExports,
      appliesToExerciseMaterials,
      status,
    } = await req.json();

    if (status === "active") {
      await prisma.brandRuleSet.updateMany({
        where: {
          workspaceId: workspace.id,
          status: "active",
          id: { not: params.ruleSetId },
        },
        data: { status: "archived" },
      });
    }

    const updated = await prisma.brandRuleSet.update({
      where: { id: params.ruleSetId },
      data: {
        ...(name !== undefined && { name }),
        ...(rulesJson !== undefined && { rulesJson }),
        ...(appliesToWorkspaceUi !== undefined && { appliesToWorkspaceUi }),
        ...(appliesToDocuments !== undefined && { appliesToDocuments }),
        ...(appliesToPptExports !== undefined && { appliesToPptExports }),
        ...(appliesToExerciseMaterials !== undefined && { appliesToExerciseMaterials }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
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

    const existing = await prisma.brandRuleSet.findFirst({
      where: { id: params.ruleSetId, workspaceId: workspace.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Brand rule set not found" }, { status: 404 });
    }

    await prisma.brandRuleSet.delete({
      where: { id: params.ruleSetId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
