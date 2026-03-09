import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSignedDownloadUrl, getSignedDownloadUrlForPath } from "@/lib/object-storage";

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

  if (!doc.objectPath) {
    return NextResponse.json({ error: "No file attached" }, { status: 404 });
  }

  if (!doc.downloadAllowed) {
    return NextResponse.json({ error: "Download not allowed for this document" }, { status: 403 });
  }

  try {
    const downloadUrl = doc.objectPath.startsWith("/objects/")
      ? await getSignedDownloadUrl(doc.objectPath)
      : await getSignedDownloadUrlForPath(doc.objectPath);

    return NextResponse.redirect(downloadUrl);
  } catch {
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }
}
