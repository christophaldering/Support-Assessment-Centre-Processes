import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

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
  const status = url.searchParams.get("status");

  const where: any = { workspaceId: workspace.id };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const caseStudies = await prisma.caseStudy.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
      companyName: true,
      description: true,
      type: true,
      difficulty: true,
      sourceType: true,
      status: true,
      aiGenerated: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(caseStudies);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
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

  try {
    const body = await req.json();
    const { title, subtitle, companyName, description, type, difficulty, dataJson, questionsJson } = body;

    if (!title || !companyName || !dataJson) {
      return NextResponse.json({ error: "Titel, Unternehmensname und Daten sind erforderlich" }, { status: 400 });
    }

    const caseStudy = await prisma.caseStudy.create({
      data: {
        workspaceId: workspace.id,
        title,
        subtitle: subtitle || null,
        companyName,
        description: description || null,
        type: type || "turnaround",
        difficulty: difficulty || "medium",
        dataJson,
        questionsJson: questionsJson || null,
        sourceType: "manual",
        status: "draft",
        aiGenerated: false,
        createdById: session?.userId || null,
      },
    });

    return NextResponse.json(caseStudy, { status: 201 });
  } catch (err) {
    console.error("Error creating case study:", err);
    return NextResponse.json({ error: "Fehler beim Erstellen der Fallstudie" }, { status: 500 });
  }
}
