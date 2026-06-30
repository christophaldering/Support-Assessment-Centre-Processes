import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission, hasAnyPermission } from "@/lib/rbac";
import { generateTags } from "@/lib/ai";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search");
  const type = url.searchParams.get("type");
  const level = url.searchParams.get("level");
  const language = url.searchParams.get("language");
  const status = url.searchParams.get("status");
  const tag = url.searchParams.get("tag");
  const clientId = url.searchParams.get("clientId");
  const clientFilter = url.searchParams.get("client");
  const scopeFilter = url.searchParams.get("scope");
  const scenarioIdFilter = url.searchParams.get("scenarioId");
  const showArchived = url.searchParams.get("archived") === "true";

  const where: any = { workspaceId: workspace.id };

  if (showArchived) {
    if (!master) {
      return NextResponse.json({ error: "Nur Master-Admin kann archivierte Übungen sehen" }, { status: 403 });
    }
    where.archivedAt = { not: null };
  } else {
    where.archivedAt = null;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }

  if (type) {
    where.exerciseType = type;
  }

  if (level) {
    where.targetLevels = { has: level };
  }

  if (language) {
    where.languagesAvailable = { has: language };
  }

  if (status) {
    where.qualityStatus = status;
  }

  if (tag) {
    where.tags = { has: tag };
  }

  if (scopeFilter) {
    where.scope = scopeFilter;
  }

  if (scenarioIdFilter) {
    where.scenarioId = scenarioIdFilter;
  }

  if (clientId) {
    where.clientId = clientId;
  } else if (clientFilter === "neutral") {
    where.clientId = null;
  } else if (clientFilter) {
    where.clientName = { contains: clientFilter, mode: "insensitive" };
  }

  const items = await prisma.exerciseLibraryItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { variants: true } },
    },
  });

  const existingCaseStudyIds = new Set(
    items.filter((i) => i.exerciseType === "case_study" && i.metadataJson && (i.metadataJson as any).caseStudyId)
      .map((i) => (i.metadataJson as any).caseStudyId)
  );

  if (!type || type === "case_study") {
    const activeCaseStudies = await prisma.caseStudy.findMany({
      where: { workspaceId: workspace.id, status: "active" },
      orderBy: { createdAt: "desc" },
    });

    for (const cs of activeCaseStudies) {
      if (existingCaseStudyIds.has(cs.id)) continue;
      items.push({
        id: `cs-${cs.id}`,
        title: cs.title || `Fallstudie: ${cs.companyName}`,
        description: cs.description,
        exerciseType: "case_study",
        workspaceId: workspace.id,
        tags: ["Fallstudie", cs.type || "strategy", cs.aiGenerated ? "KI-generiert" : "manuell"],
        targetLevels: [cs.difficulty === "high" ? "SE-Level" : cs.difficulty === "medium" ? "Director" : "Manager"],
        languagesAvailable: [],
        qualityStatus: "approved",
        metadataJson: { caseStudyId: cs.id, companyName: cs.companyName, logoUrl: cs.logoUrl },
        sourceProjectId: null,
        sourceContext: cs.sourceType === "ai_generated" ? "KI-generiert" : cs.sourceType === "upload" ? "Upload" : "Manuell",
        basedOnId: null,
        sourceFileName: null,
        objectStoragePath: null,
        createdAt: cs.createdAt,
        updatedAt: cs.updatedAt,
        createdById: cs.createdById,
        _count: { variants: 0 },
      } as any);
    }
  }

  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasAnyPermission(session.roles, ["exerciselibrary.upload", "exerciselibrary.manage"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { title, description, exerciseType, tags, targetLevels, languagesAvailable, metadataJson, sourceProjectId, sourceContext, basedOnId, clientName, projectName, scope, scenarioId } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 });
    }

    if (!exerciseType) {
      return NextResponse.json({ error: "Übungstyp ist erforderlich" }, { status: 400 });
    }

    if (!scope || scope.trim() === "") {
      return NextResponse.json({ error: "scope ist erforderlich (general | client | project | candidate)" }, { status: 400 });
    }

    if (scope !== "general" && !clientName?.trim()) {
      return NextResponse.json({ error: "clientName ist erforderlich wenn scope nicht general" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    let clientId: string | null = null;
    if (clientName?.trim()) {
      const existing = await prisma.client.findFirst({
        where: { workspaceId: workspace.id, name: clientName.trim() },
      });
      if (existing) {
        clientId = existing.id;
      } else {
        const newClient = await prisma.client.create({
          data: { workspaceId: workspace.id, name: clientName.trim() },
        });
        clientId = newClient.id;
      }
    }

    const item = await prisma.exerciseLibraryItem.create({
      data: {
        title,
        description: description ?? null,
        exerciseType,
        workspaceId: workspace.id,
        tags: tags ?? [],
        targetLevels: targetLevels ?? [],
        languagesAvailable: languagesAvailable ?? [],
        metadataJson: metadataJson ?? null,
        sourceProjectId: sourceProjectId ?? null,
        sourceContext: sourceContext ?? null,
        basedOnId: basedOnId ?? null,
        clientId,
        clientName: clientName?.trim() || null,
        projectName: projectName?.trim() || null,
        scope: scope,
        scenarioId: scenarioId || null,
      },
      include: {
        _count: { select: { variants: true } },
      },
    });

    generateTags({
      title,
      description: description ?? null,
      type: exerciseType,
    }).then(async (aiTags) => {
      if (aiTags.length > 0) {
        const existingTags = tags ?? [];
        const mergedTags = Array.from(new Set([...existingTags, ...aiTags]));
        await prisma.exerciseLibraryItem.update({
          where: { id: item.id },
          data: { tags: mergedTags },
        });
      }
    }).catch((err) => {
      console.error("Async AI tag generation failed for exercise:", item.id, err);
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
