import { NextRequest, NextResponse } from "next/server";

const MASTER_COOKIE = "edp_master_auth";
const WORKSPACE_COOKIE = "edp_workspace_auth";
const USER_COOKIE = "edp_user_session";
const CANDIDATE_COOKIE = "candidate_portal_session";
const BDP_COOKIE = "bdp_session";
const AUTH_TOKEN = "authenticated";

function toLanding(req: NextRequest) {
  return NextResponse.redirect(new URL("/landing", req.url));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── /master and /master/* ──────────────────────────────────────────────────
  if (pathname === "/master" || pathname.startsWith("/master/")) {
    const ok = req.cookies.get(MASTER_COOKIE)?.value === AUTH_TOKEN;
    return ok ? NextResponse.next() : toLanding(req);
  }

  // ── /w/[slug]/* ───────────────────────────────────────────────────────────
  if (pathname.startsWith("/w/")) {
    const parts = pathname.split("/"); // ["", "w", slug, area?, ...]
    const area = parts[3];

    // Public workspace pages — no auth needed
    const publicAreas = new Set([
      "login",
      "change-password",
      "reset-password",
      "request-access",
    ]);
    if (!area || publicAreas.has(area)) {
      return NextResponse.next();
    }

    // Everything else in /w/* requires a valid session
    const hasMaster = req.cookies.get(MASTER_COOKIE)?.value === AUTH_TOKEN;
    const hasWorkspace = !!req.cookies.get(WORKSPACE_COOKIE)?.value;
    const hasUser = !!req.cookies.get(USER_COOKIE)?.value;

    if (!hasMaster && !hasWorkspace && !hasUser) {
      return toLanding(req);
    }
    return NextResponse.next();
  }

  // ── /candidate/* ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/candidate/")) {
    const ok = !!req.cookies.get(CANDIDATE_COOKIE)?.value;
    return ok ? NextResponse.next() : toLanding(req);
  }

  // ── /comp-bdp/* ───────────────────────────────────────────────────────────
  if (pathname.startsWith("/comp-bdp/")) {
    const publicCompPaths = ["/comp-bdp/login", "/comp-bdp/gate"];
    if (publicCompPaths.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    const ok = !!req.cookies.get(BDP_COOKIE)?.value;
    if (!ok) {
      return NextResponse.redirect(new URL("/comp-bdp/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/master/:path*",
    "/w/:path*",
    "/candidate/:path*",
    "/comp-bdp/:path*",
  ],
};
