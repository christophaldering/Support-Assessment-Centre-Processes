import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { uploadToObjectStorage } from "@/lib/object-storage";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const url = new URL(req.url);
  const assessmentId = url.searchParams.get("assessmentId");
  const categoryId = url.searchParams.get("categoryId");

  const where: Record<string, unknown> = { workspaceId: workspace.id };
  if (assessmentId) where.assessmentId = assessmentId;
  if (categoryId) where.categoryId = categoryId;

  const documents = await prisma.portalDocument.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      dataRoomCategory: { select: { id: true, slug: true, label: true, labelEn: true, color: true } },
      _count: { select: { views: true } },
    },
  });

  return NextResponse.json(documents);
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

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") || "";
  let body: Record<string, unknown>;
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    body = {};
    for (const [key, value] of formData.entries()) {
      if (key === "file") {
        file = value as File;
      } else {
        body[key] = value;
      }
    }
  } else {
    body = await req.json();
  }

  const title = body.title as string;
  const assessmentId = body.assessmentId as string;

  if (!title || !assessmentId) {
    return NextResponse.json({ error: "title and assessmentId are required" }, { status: 400 });
  }

  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, workspaceId: workspace.id },
  });
  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found in this workspace" }, { status: 400 });
  }

  if (body.categoryId) {
    const cat = await prisma.dataRoomCategory.findFirst({
      where: { id: body.categoryId as string, workspaceId: workspace.id },
    });
    if (!cat) {
      return NextResponse.json({ error: "Category not found in this workspace" }, { status: 400 });
    }
  }

  const slugBase = (body.slug as string) || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let slug = slugBase;
  let counter = 1;
  while (true) {
    const existing = await prisma.portalDocument.findUnique({
      where: { slug_assessmentId: { slug, assessmentId } },
    });
    if (!existing) break;
    slug = `${slugBase}-${counter++}`;
  }

  let objectPath: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let mimeType: string | null = null;

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    objectPath = `.private/portal/${assessmentId}/${Date.now()}_${file.name}`;
    fileName = file.name;
    fileSize = file.size;
    mimeType = file.type || "application/octet-stream";
    await uploadToObjectStorage(objectPath, buffer, mimeType);
  }

  const maxSort = await prisma.portalDocument.aggregate({
    where: { assessmentId },
    _max: { sortOrder: true },
  });

  const tags = body.tags
    ? (typeof body.tags === "string" ? JSON.parse(body.tags as string) : body.tags) as string[]
    : [];

  const doc = await prisma.portalDocument.create({
    data: {
      assessmentId,
      workspaceId: workspace.id,
      categoryId: (body.categoryId as string) || null,
      category: (body.category as string) || "general",
      slug,
      title,
      description: (body.description as string) || null,
      shortDescription: (body.shortDescription as string) || null,
      textSummary: (body.textSummary as string) || null,
      documentType: (body.documentType as string) || "pdf",
      confidentialityLabel: (body.confidentialityLabel as string) || null,
      tags,
      isImportant: body.isImportant === true || body.isImportant === "true",
      isNew: body.isNew === true || body.isNew === "true",
      readingTime: body.readingTime ? parseInt(body.readingTime as string, 10) : null,
      pageCount: body.pageCount ? parseInt(body.pageCount as string, 10) : null,
      sourceLabel: (body.sourceLabel as string) || null,
      releaseStatus: (body.releaseStatus as string) || "released",
      releasedAt: (body.releaseStatus as string) === "released" || !(body.releaseStatus) ? new Date() : null,
      alwaysAvailable: body.alwaysAvailable === true || body.alwaysAvailable === "true" || body.alwaysAvailable === undefined,
      releaseStart: body.releaseStart ? new Date(body.releaseStart as string) : null,
      releaseEnd: body.releaseEnd ? new Date(body.releaseEnd as string) : null,
      visibleFrom: body.visibleFrom ? new Date(body.visibleFrom as string) : null,
      visibleUntil: body.visibleUntil ? new Date(body.visibleUntil as string) : null,
      downloadAllowed: body.downloadAllowed === false || body.downloadAllowed === "false" ? false : true,
      objectPath,
      fileName,
      fileSize,
      mimeType,
      sortOrder: body.sortOrder !== undefined ? parseInt(body.sortOrder as string, 10) : (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
