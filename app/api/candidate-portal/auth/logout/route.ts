import { NextResponse } from "next/server";

const CANDIDATE_COOKIE = "candidate_portal_session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(CANDIDATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
