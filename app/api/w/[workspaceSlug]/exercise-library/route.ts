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

  const where: any = { workspaceId: workspace.id };

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

  const items = await prisma.exerciseLibraryItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { variants: true } },
    },
  });

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
    const { title, description, exerciseType, tags, targetLevels, languagesAvailable, metadataJson, sourceProjectId, sourceContext, basedOnId } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 });
    }

    if (!exerciseType) {
      return NextResponse.json({ error: "Übungstyp ist erforderlich" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
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
