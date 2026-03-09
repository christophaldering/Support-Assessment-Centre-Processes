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

  const workspace = await prisma.workspace.findUnique({
    where: { slug: session.workspaceSlug },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const categories = await prisma.dataRoomCategory.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ categories });
}
