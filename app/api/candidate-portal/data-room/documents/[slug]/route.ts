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

interface RouteContext {
  params: { slug: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getCandidateSessionFromReq(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.assessmentId) {
    return NextResponse.json({ error: "No assessment assigned" }, { status: 404 });
  }

  const doc = await prisma.portalDocument.findFirst({
    where: {
      slug: params.slug,
      assessmentId: session.assessmentId,
    },
    include: {
      dataRoomCategory: true,
      views: {
        where: { userId: session.userId },
        take: 1,
      },
    },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const now = new Date();
  let isReleased = false;
  if (doc.alwaysAvailable) {
    isReleased = true;
  } else if (doc.releaseStart || doc.releaseEnd) {
    const afterStart = !doc.releaseStart || now >= doc.releaseStart;
    const beforeEnd = !doc.releaseEnd || now <= doc.releaseEnd;
    isReleased = afterStart && beforeEnd;
  } else {
    isReleased = doc.releaseStatus === "released";
  }

  if (doc.visibleFrom && now < doc.visibleFrom) isReleased = false;
  if (doc.visibleUntil && now > doc.visibleUntil) isReleased = false;

  if (!isReleased) {
    return NextResponse.json({ error: "Document not available" }, { status: 403 });
  }

  return NextResponse.json({
    document: {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      shortDescription: doc.shortDescription,
      textSummary: doc.textSummary,
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
      sortOrder: doc.sortOrder,
      viewed: doc.views.length > 0,
      viewedAt: doc.views[0]?.viewedAt ?? null,
      lastOpenedAt: doc.views[0]?.lastOpenedAt ?? null,
      createdAt: doc.createdAt,
    },
  });
}
