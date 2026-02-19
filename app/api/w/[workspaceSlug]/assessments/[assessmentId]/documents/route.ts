import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { getUploadUrl } from "@/lib/object-storage";

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

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.assessmentId, workspaceId: workspace.id },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const documents = await prisma.document.findMany({
    where: { assessmentId: assessment.id },
    include: {
      uploadedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
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

  if (!session && !master) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, fileName, fileSize, mimeType, exerciseId, visibleTo, watermark } =
      await req.json();

    if (!name || !fileName || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: "name, fileName, fileSize, and mimeType are required" },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const { uploadURL, objectPath } = await getUploadUrl();

    let uploadedById = session?.userId ?? null;
    if (!uploadedById) {
      const systemUser = await prisma.user.findFirst({
        where: { email: { contains: "admin" } },
        select: { id: true },
      });
      if (systemUser) {
        uploadedById = systemUser.id;
      } else {
        const firstUser = await prisma.user.findFirst({ select: { id: true } });
        uploadedById = firstUser?.id ?? "system";
      }
    }

    const document = await prisma.document.create({
      data: {
        assessmentId: assessment.id,
        exerciseId: exerciseId ?? null,
        name,
        fileName,
        fileSize,
        mimeType,
        objectPath,
        visibleTo: visibleTo ?? [],
        watermark: watermark ?? false,
        uploadedById,
      },
    });

    return NextResponse.json({ uploadURL, document }, { status: 201 });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
