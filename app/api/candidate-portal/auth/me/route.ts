import { NextRequest, NextResponse } from "next/server";

const CANDIDATE_COOKIE = "candidate_portal_session";

export async function GET(req: NextRequest) {
  const raw = req.cookies.get(CANDIDATE_COOKIE)?.value;

  if (!raw) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const session = JSON.parse(raw);
    return NextResponse.json({
      authenticated: true,
      user: {
        userId: session.userId,
        email: session.email,
        name: session.name,
        workspaceSlug: session.workspaceSlug,
        assessmentId: session.assessmentId,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
