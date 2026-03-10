import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const CANDIDATE_COOKIE = "candidate_portal_session";

function getCandidateSessionFromReq(req: NextRequest) {
  const raw = req.cookies.get(CANDIDATE_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      userId: string;
      email: string;
      name: string;
      workspaceSlug: string;
      assessmentId: string | null;
    };
  } catch {
    return null;
  }
}

function isDocumentVisible(doc: {
  releaseStatus: string;
  alwaysAvailable: boolean;
  releaseStart: Date | null;
  releaseEnd: Date | null;
  visibleFrom: Date | null;
  visibleUntil: Date | null;
}): boolean {
  const now = new Date();

  if (doc.visibleFrom && now < doc.visibleFrom) return false;
  if (doc.visibleUntil && now > doc.visibleUntil) return false;

  if (doc.alwaysAvailable) return true;

  if (doc.releaseStart || doc.releaseEnd) {
    const afterStart = !doc.releaseStart || now >= doc.releaseStart;
    const beforeEnd = !doc.releaseEnd || now <= doc.releaseEnd;
    return afterStart && beforeEnd;
  }

  return doc.releaseStatus === "released";
}

export async function GET(req: NextRequest) {
  const session = getCandidateSessionFromReq(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.assessmentId) {
    return NextResponse.json({ error: "No assessment assigned" }, { status: 404 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: session.workspaceSlug },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const documents = await prisma.portalDocument.findMany({
    where: { assessmentId: session.assessmentId },
    include: {
      dataRoomCategory: true,
      views: {
        where: { userId: session.userId },
        take: 1,
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const visibleDocs = documents
    .filter(isDocumentVisible)
    .map((doc) => ({
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      shortDescription: doc.shortDescription,
      documentType: doc.documentType,
      category: doc.category,
      categoryId: doc.categoryId,
      categoryLabel: doc.dataRoomCategory?.label ?? null,
      categoryLabelEn: doc.dataRoomCategory?.labelEn ?? null,
      categoryColor: doc.dataRoomCategory?.color ?? null,
      categoryIcon: doc.dataRoomCategory?.icon ?? null,
      tags: doc.tags,
      isImportant: doc.isImportant,
      isNew: doc.isNew,
      readingTime: doc.readingTime,
      pageCount: doc.pageCount,
      sourceLabel: doc.sourceLabel,
      confidentialityLabel: doc.confidentialityLabel,
      hasFile: !!doc.objectPath,
      downloadAllowed: doc.downloadAllowed,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      hasTextSummary: !!doc.textSummary,
      sortOrder: doc.sortOrder,
      viewed: doc.views.length > 0,
      viewedAt: doc.views[0]?.viewedAt ?? null,
      lastOpenedAt: doc.views[0]?.lastOpenedAt ?? null,
      createdAt: doc.createdAt,
    }));

  return NextResponse.json({ documents: visibleDocs });
}
