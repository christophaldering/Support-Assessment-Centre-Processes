import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { PROMPT_SLOTS, PROMPT_SLOT_KEYS, type PromptSlotKey } from "@/lib/prompt-library";

interface RouteContext {
  params: { workspaceSlug: string };
}

function requireAdminAccess(session: ReturnType<typeof getUserSession>, master: boolean, slug: string) {
  if (master) return null;
  if (!session || session.workspaceSlug !== slug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(session.roles, "workspace.manage")) {
    return NextResponse.json({ error: "Forbidden — Admin or Master required" }, { status: 403 });
  }
  return null;
}

/** GET /api/w/[workspaceSlug]/prompt-templates
 *  Returns all slots with their customized body (if any) and isCustomized flag. */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  const deny = requireAdminAccess(session, master, params.workspaceSlug);
  if (deny) return deny;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    select: { id: true },
  });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const stored = await prisma.promptTemplate.findMany({
    where: { workspaceId: workspace.id },
  });

  const byKey = Object.fromEntries(stored.map((t) => [t.slotKey, t]));

  const slots = PROMPT_SLOT_KEYS.map((key) => {
    const custom = byKey[key];
    return {
      key,
      label: PROMPT_SLOTS[key].label,
      description: PROMPT_SLOTS[key].description,
      defaultPrompt: PROMPT_SLOTS[key].defaultPrompt,
      customBody: custom?.active ? custom.body : null,
      isCustomized: !!(custom?.active),
      updatedAt: custom?.updatedAt ?? null,
    };
  });

  return NextResponse.json({ slots });
}

/** PUT /api/w/[workspaceSlug]/prompt-templates
 *  Body: { slotKey: string; body: string }
 *  Upserts a custom prompt for the given slot. */
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  const deny = requireAdminAccess(session, master, params.workspaceSlug);
  if (deny) return deny;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    select: { id: true },
  });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const body = await req.json();
  const { slotKey, body: promptBody } = body;

  if (!slotKey || !PROMPT_SLOT_KEYS.includes(slotKey as PromptSlotKey)) {
    return NextResponse.json({ error: "Ungültiger slotKey" }, { status: 400 });
  }
  if (typeof promptBody !== "string" || promptBody.trim().length < 10) {
    return NextResponse.json({ error: "Prompt-Text zu kurz (min. 10 Zeichen)" }, { status: 400 });
  }

  const updatedBy = session?.userId ?? (master ? "master" : "unknown");

  const template = await prisma.promptTemplate.upsert({
    where: { workspaceId_slotKey: { workspaceId: workspace.id, slotKey } },
    create: {
      workspaceId: workspace.id,
      slotKey,
      body: promptBody.trim(),
      active: true,
      updatedBy,
    },
    update: {
      body: promptBody.trim(),
      active: true,
      updatedBy,
    },
  });

  // Optional audit log (best-effort)
  try {
    await prisma.aiAuditLog.create({
      data: {
        workspaceId: workspace.id,
        action: "prompt_template_updated",
        newValue: { slotKey, length: promptBody.trim().length },
        actor: session?.userId ?? (master ? "master" : null),
      },
    });
  } catch { /* non-blocking */ }

  return NextResponse.json({ success: true, template });
}

/** DELETE /api/w/[workspaceSlug]/prompt-templates
 *  Body: { slotKey: string }
 *  Removes custom prompt → slot falls back to default. */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  const deny = requireAdminAccess(session, master, params.workspaceSlug);
  if (deny) return deny;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    select: { id: true },
  });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const body = await req.json();
  const { slotKey } = body;

  if (!slotKey || !PROMPT_SLOT_KEYS.includes(slotKey as PromptSlotKey)) {
    return NextResponse.json({ error: "Ungültiger slotKey" }, { status: 400 });
  }

  await prisma.promptTemplate.deleteMany({
    where: { workspaceId: workspace.id, slotKey },
  });

  return NextResponse.json({ success: true, message: "Auf Standard zurückgesetzt" });
}
