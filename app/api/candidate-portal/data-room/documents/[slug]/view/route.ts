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

export async function POST(req: NextRequest, { params }: RouteContext) {
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
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const now = new Date();

  const view = await prisma.dataRoomDocumentView.upsert({
    where: {
      documentId_userId: {
        documentId: doc.id,
        userId: session.userId,
      },
    },
    create: {
      documentId: doc.id,
      userId: session.userId,
      viewedAt: now,
      lastOpenedAt: now,
    },
    update: {
      lastOpenedAt: now,
    },
  });

  return NextResponse.json({ success: true, viewedAt: view.viewedAt, lastOpenedAt: view.lastOpenedAt });
}
