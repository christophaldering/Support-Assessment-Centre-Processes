import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasMasterAuth, getUserSession } from "@/lib/session";

function checkAdminAccess(workspaceSlug: string): { authorized: boolean; error?: string } {
  const masterAuth = hasMasterAuth();
  if (masterAuth) return { authorized: true };

  const userSession = getUserSession();
  if (!userSession) return { authorized: false, error: "Nicht angemeldet" };

  if (userSession.workspaceSlug !== workspaceSlug) {
    return { authorized: false, error: "Keine Berechtigung für diesen Workspace" };
  }

  const isAdmin = userSession.roles?.some(r => ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN"].includes(r));
  if (!isAdmin) return { authorized: false, error: "Keine Berechtigung" };

  return { authorized: true };
}

export async function GET(req: NextRequest, { params }: { params: { workspaceSlug: string } }) {
  const access = checkAdminAccess(params.workspaceSlug);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    select: { featureFlags: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ featureFlags: workspace.featureFlags ?? {} });
}

export async function PUT(req: NextRequest, { params }: { params: { workspaceSlug: string } }) {
  const access = checkAdminAccess(params.workspaceSlug);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  const body = await req.json();
  const { featureFlags } = body;

  if (!featureFlags || typeof featureFlags !== "object") {
    return NextResponse.json({ error: "Ungültige Feature-Flags" }, { status: 400 });
  }

  const workspace = await prisma.workspace.update({
    where: { slug: params.workspaceSlug },
    data: { featureFlags },
    select: { featureFlags: true },
  });

  return NextResponse.json({ featureFlags: workspace.featureFlags });
}
