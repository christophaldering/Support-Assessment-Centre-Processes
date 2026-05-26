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

// Workspace login-area pages that must stay publicly reachable
const PUBLIC_WORKSPACE_AREAS = new Set([
  "login",
  "change-password",
  "reset-password",
  "request-access",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Always public ──────────────────────────────────────────────────────────
  if (
    pathname === "/" ||
    pathname === "/landing" ||
    pathname.startsWith("/landing/")
  ) {
    return NextResponse.next();
  }

  // CompBDP login + gate — public so observers/participants can authenticate
  if (
    pathname.startsWith("/comp-bdp/login") ||
    pathname.startsWith("/comp-bdp/gate")
  ) {
    return NextResponse.next();
  }

  // Workspace-specific login pages — public per workspace
  if (pathname.startsWith("/w/")) {
    const area = pathname.split("/")[3];
    if (area && PUBLIC_WORKSPACE_AREAS.has(area)) {
      return NextResponse.next();
    }
  }

  // ── /dr/[token] — ConVia Datenraum entry: token IS the credential, always public ──
  if (/^\/dr\/[^/]+\/?$/.test(pathname)) {
    return NextResponse.next();
  }

  // ── Cookie helpers ─────────────────────────────────────────────────────────
  const hasMaster = req.cookies.get(MASTER_COOKIE)?.value === AUTH_TOKEN;
  const hasWorkspace = !!req.cookies.get(WORKSPACE_COOKIE)?.value;
  const hasUser = !!req.cookies.get(USER_COOKIE)?.value;
  const hasCandidate = !!req.cookies.get(CANDIDATE_COOKIE)?.value;
  const hasBdp = !!req.cookies.get(BDP_COOKIE)?.value;

  // ── /master and /master/* — master cookie required ─────────────────────────
  if (pathname === "/master" || pathname.startsWith("/master/")) {
    return hasMaster ? NextResponse.next() : toLanding(req);
  }

  // ── /w/* — workspace or user or master session required ───────────────────
  if (pathname.startsWith("/w/")) {
    return hasMaster || hasWorkspace || hasUser
      ? NextResponse.next()
      : toLanding(req);
  }

  // ── /candidate/* — candidate session required ──────────────────────────────
  if (pathname.startsWith("/candidate/")) {
    return hasCandidate ? NextResponse.next() : toLanding(req);
  }

  // ── /comp-bdp/* — BDP session required ────────────────────────────────────
  if (pathname.startsWith("/comp-bdp/")) {
    return hasBdp
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/comp-bdp/login", req.url));
  }

  // ── Everything else (tour, data-room, …) — any valid session required ─────
  if (hasMaster || hasWorkspace || hasUser || hasCandidate || hasBdp) {
    return NextResponse.next();
  }
  return toLanding(req);
}

export const config = {
  // Catch every route except Next.js internals, static assets, and API routes
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)"],
};
