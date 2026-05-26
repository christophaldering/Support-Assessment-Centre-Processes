/**
 * /dr/view — Protected ConVia Datenraum viewer.
 *
 * Requires a valid `dr_session` cookie (set by /dr/[token]).
 * Middleware enforces this at the routing level; this handler double-checks
 * and serves the ConVia HTML with full tracking injection.
 *
 * Injection strategy (idempotent):
 *   1. window.__DR_TOKEN + window.__DR_LINK_ID — right after opening <head> tag
 *   2. Full tracking script block              — appended before </head>,
 *      ONLY when the source HTML does not already contain "window.drTrackOpen"
 *      (prevents double-injection if the real ConVia HTML bundles the script).
 *
 * This means any ConVia HTML that has a <head> tag will work — no manual
 * tracking-script copy/paste required.
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveLink } from "@/lib/dr/tokens";
import { cookies } from "next/headers";
import { readFile } from "fs/promises";
import path from "path";

// ── Fallback pages ──────────────────────────────────────────────────────────

const EXPIRED_HTML = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zugang abgelaufen</title>
<style>body{font-family:system-ui,sans-serif;background:#0f172a;color:#cdd8e6;
display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.box{max-width:440px;text-align:center;padding:40px}
h1{color:#fff;font-size:20px;margin-bottom:16px}
p{line-height:1.6;color:#94a3b8}
.badge{display:inline-block;background:#A6473B;color:#fff;font-size:11px;
font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 12px;
border-radius:999px;margin-bottom:20px}
a{color:#297587}</style></head>
<body><div class="box">
<div class="badge">Executive Diagnostics Suite</div>
<h1>Dieser Zugang ist nicht mehr gültig</h1>
<p>Der Einladungslink ist abgelaufen oder wurde deaktiviert.<br>
Bitte wenden Sie sich an Ihre Ansprechpartnerin bzw. Ihren Ansprechpartner.</p>
</div></body></html>`;

const MISSING_HTML = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Datenraum wird vorbereitet</title>
<style>body{font-family:system-ui,sans-serif;background:#0f172a;color:#cdd8e6;
display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.box{max-width:440px;text-align:center;padding:40px}
h1{color:#fff;font-size:20px;margin-bottom:16px}
p{line-height:1.6;color:#94a3b8}
.badge{display:inline-block;background:#297587;color:#fff;font-size:11px;
font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 12px;
border-radius:999px;margin-bottom:20px}</style></head>
<body><div class="box">
<div class="badge">Executive Diagnostics Suite</div>
<h1>Datenraum wird vorbereitet</h1>
<p>Die Datenraum-Datei wird noch eingerichtet.<br>
Bitte wenden Sie sich an den Administrator.</p>
</div></body></html>`;

// ── Canonical tracking script ───────────────────────────────────────────────
// Injected server-side before </head> when the source HTML does not already
// contain "window.drTrackOpen".  Assumes __DR_TOKEN is already set by the
// token-inject block inserted after <head>.
const TRACKING_SCRIPT = `
<!-- ── ConVia Datenraum Tracking Script (server-injected) ──────────────── -->
<script>
(function () {
  "use strict";
  var TRACK_URL   = "/api/dr/track";
  var HB_INTERVAL = 30000;
  var FLUSH_DELAY = 800;
  var MAX_BATCH   = 50;

  var token        = (typeof window.__DR_TOKEN !== "undefined") ? window.__DR_TOKEN : null;
  var queue        = [];
  var seq          = 0;
  var flushTimer   = null;
  var hbTimer      = null;
  var sessionStart = Date.now();
  var openTimes    = {};

  function enqueue(type, payload, durationMs) {
    if (!token) return;
    var ev = { type: type, seq: ++seq, clientTs: new Date().toISOString() };
    if (payload    != null) ev.payload    = typeof payload === "string" ? payload : JSON.stringify(payload);
    if (durationMs != null) ev.durationMs = Math.round(durationMs);
    queue.push(ev);
    scheduleFlush();
  }
  function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, FLUSH_DELAY);
  }
  function flush(useBeacon) {
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    if (!queue.length || !token) return;
    var batch = queue.splice(0, MAX_BATCH);
    var body  = JSON.stringify({ token: token, events: batch });
    if (useBeacon && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(TRACK_URL, new Blob([body], { type: "application/json" }));
    } else {
      fetch(TRACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true,
      }).catch(function () {});
    }
    if (queue.length) scheduleFlush();
  }
  function startHeartbeat() {
    hbTimer = setInterval(function () { enqueue("heartbeat", null, null); }, HB_INTERVAL);
  }

  enqueue("session_start", null, null);
  flush();
  startHeartbeat();

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      enqueue("session_end", null, Date.now() - sessionStart);
      flush(true);
    } else {
      sessionStart = Date.now();
      enqueue("session_start", null, null);
      flush();
    }
  });
  window.addEventListener("beforeunload", function () {
    if (hbTimer) clearInterval(hbTimer);
    enqueue("session_end", null, Date.now() - sessionStart);
    flush(true);
  });

  window.drTrackOpen = function (docId, label) {
    openTimes[docId] = Date.now();
    enqueue("open", { docId: docId, label: label || null }, null);
  };
  window.drTrackLeave = function (docId) {
    var opened   = openTimes[docId];
    var duration = opened ? (Date.now() - opened) : null;
    delete openTimes[docId];
    enqueue("leave", { docId: docId }, duration);
  };
  window.drTrackSearch = function (query) {
    enqueue("search", { query: String(query).slice(0, 500) }, null);
  };
  window.drTrackFlag = function (docId, flagged) {
    enqueue(flagged ? "flag" : "unflag", { docId: docId }, null);
  };
  window.drTrackNoteSave = function (docId, charCount) {
    enqueue("note_save", { docId: docId, charCount: charCount || null }, null);
  };
})();
</script>
<!-- ── End Tracking Script ────────────────────────────────────────────────── -->`;

// ── Route handler ───────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  const token = cookies().get("dr_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/landing", _req.url));
  }

  const link = await resolveLink(token);
  if (!link) {
    return new NextResponse(EXPIRED_HTML, {
      status: 410,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const htmlPath = path.join(process.cwd(), "private", "convia", "ConVia_Datenraum.html");
  let html: string;

  try {
    html = await readFile(htmlPath, "utf-8");
  } catch {
    return new NextResponse(MISSING_HTML, {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Step 1: inject token variables immediately after opening <head> tag
  const tokenBlock = `<script>window.__DR_TOKEN=${JSON.stringify(link.token)};window.__DR_LINK_ID=${JSON.stringify(link.id)};</script>`;
  html = html.replace(/<head([^>]*)>/i, (_m, attrs) => `<head${attrs}>${tokenBlock}`);

  // Step 2: if the file does not already define drTrackOpen, inject the full
  // canonical tracking script just before </head>.
  if (!html.includes("window.drTrackOpen = function")) {
    html = html.replace(/<\/head>/i, TRACKING_SCRIPT + "\n</head>");
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, must-revalidate",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
