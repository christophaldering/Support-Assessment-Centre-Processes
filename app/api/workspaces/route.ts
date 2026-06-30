import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { hasMasterAuth } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { MODULE_REGISTRY } from "@/lib/feature-flags";

export async function GET() {
  if (!hasMasterAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workspaces = await prisma.workspace.findMany({
      include: {
        theme: true,
        _count: { select: { accessRequests: { where: { status: "pending" } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`[workspaces] Found ${workspaces.length} workspace(s)`);

    const safe = workspaces.map(({ adminPasswordHash: _hash, _count, ...w }) => ({
      ...w,
      pendingAccessRequests: _count?.accessRequests ?? 0,
    }));
    return NextResponse.json(safe);
  } catch (err: any) {
    console.error("[workspaces] Database error:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to load workspaces", detail: err?.message },
      { status: 500 }
    );
  }
}

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

const RESERVED_SLUGS = new Set([
  "master", "api", "w", "comp-bdp", "abcd-bdp",
  "candidate", "candidate-access", "dr", "data-room",
  "landing", "tour",
]);

export async function POST(req: NextRequest) {
  if (!hasMasterAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; slug?: string; adminPassword?: string; dataResidency?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, slug, adminPassword, dataResidency } = body;

  // a) Required fields
  if (!name || !slug || !adminPassword) {
    return NextResponse.json(
      { error: "name, slug und adminPassword sind Pflichtfelder." },
      { status: 400 }
    );
  }

  // b) Slug format
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      {
        error:
          "Ungültiger Slug. Erlaubt: Kleinbuchstaben, Ziffern und Bindestriche; 3–50 Zeichen; kein führender oder abschließender Bindestrich.",
      },
      { status: 400 }
    );
  }

  // c) Reserved slug check
  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json(
      { error: `Der Slug „${slug}" ist reserviert und kann nicht verwendet werden.` },
      { status: 400 }
    );
  }

  // d) Slug uniqueness
  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: `Ein Workspace mit dem Slug „${slug}" existiert bereits.` },
      { status: 409 }
    );
  }

  // e) Password length
  if (adminPassword.length < 8) {
    return NextResponse.json(
      { error: "adminPassword muss mindestens 8 Zeichen lang sein." },
      { status: 400 }
    );
  }

  // Build featureFlags from MODULE_REGISTRY (same format as all other workspaces)
  const featureFlags: Record<string, boolean> = {};
  for (const [key, config] of Object.entries(MODULE_REGISTRY)) {
    featureFlags[key] = config.defaultReleased;
  }

  try {
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        adminPasswordHash,
        dataResidency: dataResidency ?? "EU",
        status: "active",
        featureFlags,
      },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId: null,
      action: "workspace_created",
      entityType: "Workspace",
      entityId: workspace.id,
      details: { name, slug },
    });

    console.log(`[workspaces] Created workspace: ${slug} (${workspace.id})`);

    // Return without adminPasswordHash (same pattern as GET)
    const { adminPasswordHash: _hash, ...safe } = workspace;
    return NextResponse.json(safe, { status: 201 });
  } catch (err: any) {
    console.error("[workspaces] Create error:", err?.message || err);
    return NextResponse.json(
      { error: "Workspace konnte nicht erstellt werden.", detail: err?.message },
      { status: 500 }
    );
  }
}
