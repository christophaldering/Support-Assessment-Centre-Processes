import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGovernanceSettings, updateGovernanceSettings, getAuditLog } from "@/lib/llm/governance";
import { getUserSession, hasMasterAuth } from "@/lib/session";

async function getWorkspace(slug: string) {
  return prisma.workspace.findUnique({ where: { slug } });
}

async function requireAdmin(workspaceSlug: string) {
  const ws = await getWorkspace(workspaceSlug);
  if (!ws) return { error: "Workspace nicht gefunden", status: 404, workspace: null, actorName: null };

  const master = hasMasterAuth();
  const session = getUserSession();

  if (!master && (!session || session.workspaceSlug !== workspaceSlug)) {
    return { error: "Nicht autorisiert", status: 401, workspace: null, actorName: null };
  }

  let actorName = "admin";
  if (session?.userId && session.userId !== "dev-bypass-user") {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (user) {
      const adminRoles = ["MASTER_ADMIN", "ADMIN", "WORKSPACE_ADMIN"];
      if (!master && !adminRoles.includes(user.role)) {
        return { error: "Keine Berechtigung", status: 403, workspace: null, actorName: null };
      }
      actorName = user.email || user.name || "admin";
    }
  }

  return { error: null, status: 200, workspace: ws, actorName };
}

export async function GET(req: NextRequest, { params }: { params: { workspaceSlug: string } }) {
  const { error, status, workspace } = await requireAdmin(params.workspaceSlug);
  if (error || !workspace) return NextResponse.json({ error }, { status });

  const url = new URL(req.url);
  const view = url.searchParams.get("view");

  if (view === "audit") {
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const logs = await getAuditLog(workspace.id, limit);
    return NextResponse.json({ logs });
  }

  const settings = await getGovernanceSettings(workspace.id);
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest, { params }: { params: { workspaceSlug: string } }) {
  const { error, status, workspace, actorName } = await requireAdmin(params.workspaceSlug);
  if (error || !workspace) return NextResponse.json({ error }, { status });

  const body = await req.json();

  const validProviders = ["openai", "neuland", "azure_eu"];
  const validModes = ["innovation", "eu_secure", "hybrid"];

  const updates: Record<string, unknown> = {};
  if (body.activeLlmProvider && validProviders.includes(body.activeLlmProvider)) {
    updates.activeLlmProvider = body.activeLlmProvider;
  }
  if (typeof body.aiMasterDisabled === "boolean") {
    updates.aiMasterDisabled = body.aiMasterDisabled;
  }
  if (Array.isArray(body.aiFeaturesDisabled)) {
    updates.aiFeaturesDisabled = body.aiFeaturesDisabled;
  }
  if (body.complianceMode && validModes.includes(body.complianceMode)) {
    updates.complianceMode = body.complianceMode;
  }

  const result = await updateGovernanceSettings(
    workspace.id,
    updates as Parameters<typeof updateGovernanceSettings>[1],
    actorName || "admin"
  );

  return NextResponse.json({ settings: result });
}
