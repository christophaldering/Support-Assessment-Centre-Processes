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

  const categories = await prisma.dataRoomCategory.findMany({
    where: { caseStudyId: params.caseStudyId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { documents: true } } },
  });

  return NextResponse.json(categories);
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
  const { slug, label, labelEn, icon, color, sortOrder } = body;
  if (!slug || !label) return NextResponse.json({ error: "slug and label required" }, { status: 400 });

  const category = await prisma.dataRoomCategory.create({
    data: {
      slug,
      label,
      labelEn: labelEn ?? null,
      icon: icon ?? null,
      color: color ?? null,
      sortOrder: sortOrder ?? 0,
      workspaceId: ctx.workspace.id,
      caseStudyId: params.caseStudyId,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
