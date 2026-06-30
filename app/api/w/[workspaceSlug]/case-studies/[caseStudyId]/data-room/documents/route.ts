import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

interface RouteContext {
  params: { workspaceSlug: string; caseStudyId: string };
}

async function resolveWorkspaceAndCase(slug: string, caseStudyId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) return null;
  const cs = await prisma.caseStudy.findFirst({ where: { id: caseStudyId, workspaceId: workspace.id } });
  if (!cs) return null;
  return { workspace, caseStudy: cs };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await resolveWorkspaceAndCase(params.workspaceSlug, params.caseStudyId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const categoryId = url.searchParams.get("categoryId");

  const where: Record<string, unknown> = { caseStudyId: params.caseStudyId };
  if (categoryId) where.categoryId = categoryId;

  const documents = await prisma.portalDocument.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { dataRoomCategory: { select: { label: true, icon: true, color: true } } },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ctx = await resolveWorkspaceAndCase(params.workspaceSlug, params.caseStudyId);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, description, categoryId, documentType, isImportant, isNew, sortOrder, assessmentId } = body;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const aidToUse = assessmentId ?? (
    await prisma.assessment.findFirst({ where: { workspaceId: ctx.workspace.id } })
  )?.id;
  if (!aidToUse) return NextResponse.json({ error: "No assessment found for workspace" }, { status: 422 });

  const doc = await prisma.portalDocument.create({
    data: {
      title,
      description: description ?? null,
      categoryId: categoryId ?? null,
      documentType: documentType ?? "pdf",
      isImportant: isImportant ?? false,
      isNew: isNew ?? false,
      sortOrder: sortOrder ?? 0,
      assessmentId: aidToUse,
      workspaceId: ctx.workspace.id,
      caseStudyId: params.caseStudyId,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
