import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/session";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  if (!session || session.workspaceSlug !== params.workspaceSlug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.roles.includes("CANDIDATE")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { assessmentId: true, roles: true, workspaceId: true },
  });

  if (!user || user.workspaceId !== workspace.id || !user.assessmentId) {
    return NextResponse.json({ error: "No assessment assigned" }, { status: 404 });
  }

  const assessment = await prisma.assessment.findFirst({
    where: {
      id: user.assessmentId,
      workspaceId: workspace.id,
    },
    include: {
      exercises: {
        where: { status: "active" },
        orderBy: { sortOrder: "asc" },
      },
      documents: {
        where: {
          visibleTo: { hasSome: user.roles },
        },
        select: {
          id: true,
          name: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          exerciseId: true,
          createdAt: true,
        },
      },
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  return NextResponse.json(assessment);
}
