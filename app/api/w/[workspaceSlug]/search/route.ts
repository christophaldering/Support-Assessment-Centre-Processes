import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const wsAuth = getWorkspaceAuth();
  const masterAuth = hasMasterAuth();
  const userSession = getUserSession();

  const authorized =
    masterAuth ||
    wsAuth === params.workspaceSlug ||
    (userSession?.workspaceSlug === params.workspaceSlug);

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    select: { id: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (!q || q.length < 1) {
    const recent = await prisma.assessment.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, status: true },
    });
    return NextResponse.json({
      assessments: recent.map((a) => ({ id: a.id, title: a.name, status: a.status })),
      candidates: [],
      competencyModels: [],
    });
  }

  const [assessments, candidates, competencyModels] = await Promise.all([
    prisma.assessment.findMany({
      where: {
        workspaceId: workspace.id,
        name: { contains: q, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, name: true, status: true },
    }),
    prisma.user.findMany({
      where: {
        workspaceId: workspace.id,
        roles: { has: "CANDIDATE" },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, email: true },
    }),
    prisma.competencyModel.findMany({
      where: {
        workspaceId: workspace.id,
        name: { contains: q, mode: "insensitive" },
      },
      take: 3,
      select: { id: true, name: true },
    }).catch(() => []),
  ]);

  return NextResponse.json({
    assessments: assessments.map((a) => ({ id: a.id, title: a.name, status: a.status })),
    candidates,
    competencyModels,
  });
}
