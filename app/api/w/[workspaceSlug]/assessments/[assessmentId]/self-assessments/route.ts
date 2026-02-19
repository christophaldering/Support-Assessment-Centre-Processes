import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await prisma.selfAssessment.findMany({
    where: { assessmentId: params.assessmentId },
    include: { responses: { select: { id: true, candidateId: true, status: true, submittedAt: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, schemaJson, releaseStatus } = body;

  if (!title || !schemaJson) {
    return NextResponse.json({ error: "Titel und Schema sind erforderlich" }, { status: 400 });
  }

  const count = await prisma.selfAssessment.count({ where: { assessmentId: params.assessmentId } });

  const sa = await prisma.selfAssessment.create({
    data: {
      assessmentId: params.assessmentId,
      title,
      description: description || null,
      schemaJson,
      releaseStatus: releaseStatus || "locked",
      releasedAt: releaseStatus === "released" ? new Date() : null,
      sortOrder: count,
    },
  });

  return NextResponse.json(sa, { status: 201 });
}
