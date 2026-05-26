/**
 * /dr/[token] — ConVia Datenraum entry point.
 *
 * Validates the magic-link token, records the visit, sets the `dr_session`
 * HTTP-only cookie, then redirects to /dr/view which is the protected viewer.
 *
 * Flow: magic-link URL → /dr/[token] (this) → sets cookie → /dr/view
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveLink } from "@/lib/dr/tokens";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

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
border-radius:999px;margin-bottom:20px}</style></head>
<body><div class="box">
<div class="badge">Executive Diagnostics Suite</div>
<h1>Dieser Zugang ist nicht mehr gültig</h1>
<p>Der Einladungslink ist abgelaufen oder wurde deaktiviert.<br>
Bitte wenden Sie sich an Ihre Ansprechpartnerin bzw. Ihren Ansprechpartner.</p>
</div></body></html>`;

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const link = await resolveLink(params.token);

  if (!link) {
    return new NextResponse(EXPIRED_HTML, {
      status: 410,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  await prisma.dataRoomAccessLink.update({
    where: { id: link.id },
    data: {
      useCount: { increment: 1 },
      lastUsedAt: new Date(),
      firstUsedAt: link.firstUsedAt ?? new Date(),
    },
  });

  cookies().set("dr_session", link.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });

  // Use the public base URL so the redirect goes to the real domain,
  // not the internal 0.0.0.0 address which Safari / browsers block.
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (req.headers.get("x-forwarded-host")
      ? `https://${req.headers.get("x-forwarded-host")}`
      : null) ||
    `https://${req.headers.get("host") || "www.diagnostic-suite.de"}`;

  return NextResponse.redirect(new URL("/dr/view", base));
}
