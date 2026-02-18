import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { getSignedDownloadUrl } from "@/lib/object-storage";

interface RouteContext {
  params: { workspaceSlug: string; docId: string };
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  if (!session || session.workspaceSlug !== params.workspaceSlug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.roles.includes("CANDIDATE")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { assessmentId: true, workspaceId: true },
  });
  if (!user || user.workspaceId !== workspace.id || !user.assessmentId) {
    return NextResponse.json({ error: "No assessment assigned" }, { status: 404 });
  }

  const doc = await prisma.portalDocument.findFirst({
    where: { id: params.docId, assessmentId: user.assessmentId },
  });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  if (doc.releaseStatus !== "released") {
    return NextResponse.json({ error: "Dokument ist noch nicht freigegeben" }, { status: 403 });
  }

  if (!doc.objectPath) {
    return NextResponse.json({ error: "No file attached" }, { status: 404 });
  }

  try {
    const downloadUrl = await getSignedDownloadUrl(doc.objectPath);
    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      downloadUrl,
    });
  } catch {
    return NextResponse.json({ error: "Download fehlgeschlagen" }, { status: 500 });
  }
}
