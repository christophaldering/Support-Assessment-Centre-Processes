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

export async function GET(req: NextRequest) {
  const session = getCandidateSessionFromReq(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.assessmentId) {
    return NextResponse.json({ error: "No assessment assigned" }, { status: 404 });
  }

  const allDocs = await prisma.portalDocument.findMany({
    where: { assessmentId: session.assessmentId },
    select: {
      id: true,
      releaseStatus: true,
      alwaysAvailable: true,
      releaseStart: true,
      releaseEnd: true,
      visibleFrom: true,
      visibleUntil: true,
    },
  });

  const now = new Date();
  const visibleDocs = allDocs.filter((doc) => {
    if (doc.visibleFrom && now < doc.visibleFrom) return false;
    if (doc.visibleUntil && now > doc.visibleUntil) return false;
    if (doc.alwaysAvailable) return true;
    if (doc.releaseStart || doc.releaseEnd) {
      const afterStart = !doc.releaseStart || now >= doc.releaseStart;
      const beforeEnd = !doc.releaseEnd || now <= doc.releaseEnd;
      return afterStart && beforeEnd;
    }
    return doc.releaseStatus === "released";
  });

  const visibleIds = visibleDocs.map((d) => d.id);

  const viewedCount = visibleIds.length > 0
    ? await prisma.dataRoomDocumentView.count({
        where: {
          userId: session.userId,
          documentId: { in: visibleIds },
        },
      })
    : 0;

  return NextResponse.json({
    total: visibleIds.length,
    viewed: viewedCount,
    remaining: visibleIds.length - viewedCount,
  });
}
