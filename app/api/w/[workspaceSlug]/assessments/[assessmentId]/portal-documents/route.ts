import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { uploadToObjectStorage } from "@/lib/object-storage";

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

  const docs = await prisma.portalDocument.findMany({
    where: { assessmentId: params.assessmentId },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const category = (formData.get("category") as string) || "general";
  const description = (formData.get("description") as string) || null;
  const exerciseId = (formData.get("exerciseId") as string) || null;
  const releaseStatus = (formData.get("releaseStatus") as string) || "locked";
  const file = formData.get("file") as File | null;

  if (!title) {
    return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 });
  }

  let objectPath: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let mimeType: string | null = null;

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "bin";
    objectPath = `.private/portal/${params.assessmentId}/${Date.now()}_${file.name}`;
    fileName = file.name;
    fileSize = file.size;
    mimeType = file.type || `application/${ext}`;

    await uploadToObjectStorage(objectPath, buffer, mimeType);
  }

  const count = await prisma.portalDocument.count({ where: { assessmentId: params.assessmentId } });

  const doc = await prisma.portalDocument.create({
    data: {
      assessmentId: params.assessmentId,
      exerciseId,
      category,
      title,
      description,
      objectPath,
      fileName,
      fileSize,
      mimeType,
      releaseStatus,
      releasedAt: releaseStatus === "released" ? new Date() : null,
      sortOrder: count,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
