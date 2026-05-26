/**
 * /dr/view — Protected ConVia Datenraum viewer.
 *
 * Requires a valid `dr_session` cookie (set by /dr/[token]).
 * Middleware enforces this at the routing level; this handler double-checks
 * and serves the ConVia HTML with the tracking-token injection.
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveLink } from "@/lib/dr/tokens";
import { cookies } from "next/headers";
import { readFile } from "fs/promises";
import path from "path";

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

  const inject = `<script>window.__DR_TOKEN=${JSON.stringify(link.token)};window.__DR_LINK_ID=${JSON.stringify(link.id)};</script>`;
  html = html.replace(/<head[^>]*>/i, (m) => m + inject);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, must-revalidate",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
