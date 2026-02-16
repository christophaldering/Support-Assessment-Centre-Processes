import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { getSignedDownloadUrl } from "@/lib/object-storage";

interface RouteContext {
  params: { workspaceSlug: string; documentId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  if (!session || session.workspaceSlug !== params.workspaceSlug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { roles: true, assessmentId: true, workspaceId: true },
  });

  if (!user || user.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const document = await prisma.document.findUnique({
    where: { id: params.documentId },
    include: {
      assessment: { select: { workspaceId: true } },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.assessment.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (user.assessmentId && document.assessmentId !== user.assessmentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const canAccess = document.visibleTo.some((role: string) => user.roles.includes(role));
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const downloadUrl = await getSignedDownloadUrl(document.objectPath);
    return NextResponse.json({
      id: document.id,
      name: document.name,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      downloadUrl,
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }
}
