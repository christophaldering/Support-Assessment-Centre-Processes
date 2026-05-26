// ============================================================================
//  ConVia Datenraum — Server-Bausteine (Next.js App Router + Prisma)
//  Drei Dateien in einer zusammengefasst. Beim Einbau in die jeweiligen
//  Pfade aufteilen (siehe // ==== DATEI: ... ==== Marker).
//
//  Stellen mit  >>> ANPASSEN <<<  an dein echtes Projekt angleichen
//  (Prisma-Client-Import, Cookie-Helfer, Workspace-Filter, HTML-Auslieferung).
// ============================================================================


// ============================================================================
// ==== DATEI:  lib/dr/tokens.ts  (Hilfsfunktionen) ===========================
// ============================================================================
import { randomBytes } from "crypto";
// >>> ANPASSEN <<< — dein bestehender Prisma-Client-Import:
import { prisma } from "@/lib/prisma";

/** Erzeugt einen URL-sicheren Zufallstoken (Standard: 24 Bytes -> 32 Zeichen). */
export function makeToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

/** Prüft einen Token und gibt den Link zurück — oder null, wenn ungültig. */
export async function resolveLink(token: string) {
  if (!token) return null;
  const link = await prisma.dataRoomAccessLink.findUnique({ where: { token } });
  if (!link) return null;
  if (link.revoked) return null;
  if (link.expiresAt.getTime() < Date.now()) return null;   // festes Enddatum
  if (!link.multiUse && link.useCount > 0) return null;       // Einmal-Link verbraucht
  return link;
}


// ============================================================================
// ==== DATEI:  app/dr/[token]/route.ts  (Magic-Link-Einlösung) ===============
// ============================================================================
//  Der Kandidat öffnet  https://www.diagnostic-suite.de/dr/<token>
//  -> Token prüfen -> Session-Cookie setzen -> Datenraum-HTML ausliefern.
//  Verschleierung: Der Token ist zufällig & nicht ratbar. Optional kannst du
//  nach erfolgreicher Einlösung intern auf eine neutrale URL umleiten und den
//  Token NUR im Cookie halten (siehe Variante B unten).

import { NextRequest, NextResponse } from "next/server";
import { resolveLink } from "@/lib/dr/tokens";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const link = await resolveLink(params.token);

  if (!link) {
    // Abgelaufen, widerrufen oder unbekannt -> freundliche Sperrseite.
    return new NextResponse(EXPIRED_HTML, {
      status: 410, // Gone
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Nutzungs-Statistik fortschreiben.
  await prisma.dataRoomAccessLink.update({
    where: { id: link.id },
    data: {
      useCount: { increment: 1 },
      lastUsedAt: new Date(),
      firstUsedAt: link.firstUsedAt ?? new Date(),
    },
  });

  // --- Automatische Authentifizierung: HTTP-only Session-Cookie -----------
  // >>> ANPASSEN <<< — analog zu deinem candidate_portal_session-Muster.
  cookies().set("dr_session", link.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: link.expiresAt, // Cookie verfällt mit dem Link
  });

  // --- Datenraum-HTML ausliefern ------------------------------------------
  // Variante A (einfach): die statische ConVia_Datenraum.html ausliefern und
  // den Token als globale Variable injizieren, damit das Tracking-Snippet ihn
  // kennt, OHNE dass er in der sichtbaren Adresse stehen muss.
  // Lege die Datei z.B. unter  /private/convia/ConVia_Datenraum.html  ab.
  // >>> ANPASSEN <<< — Pfad zu deiner HTML-Datei.
  const htmlPath = path.join(process.cwd(), "private", "convia", "ConVia_Datenraum.html");
  let html = await readFile(htmlPath, "utf-8");

  // Token sicher injizieren (vor allen anderen Skripten).
  const inject = `<script>window.__DR_TOKEN=${JSON.stringify(link.token)};</script>`;
  html = html.replace(/<head[^>]*>/i, (m) => m + inject);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Verhindert Caching der personalisierten Seite.
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}

const EXPIRED_HTML = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zugang abgelaufen</title>
<style>body{font-family:system-ui,sans-serif;background:#11223a;color:#cdd8e6;
display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.box{max-width:440px;text-align:center;padding:40px}
h1{color:#fff;font-size:20px}a{color:#E0A458}</style></head>
<body><div class="box"><h1>Dieser Zugang ist nicht mehr gültig</h1>
<p>Der Einladungslink ist abgelaufen oder wurde deaktiviert. Bitte wenden Sie
sich an Ihre Ansprechpartnerin bzw. Ihren Ansprechpartner.</p></div></body></html>`;


// ============================================================================
// ==== DATEI:  app/api/dr/track/route.ts  (Event-Empfang) ====================
// ============================================================================
//  Empfängt die gebündelten Verhaltens-Events aus dem Tracking-Snippet.
//  Validiert den Token und schreibt die Events in die DB.

import { NextRequest as NextRequest2, NextResponse as NextResponse2 } from "next/server";
import { resolveLink as resolveLink2 } from "@/lib/dr/tokens";
import { prisma as prisma2 } from "@/lib/prisma";

const ALLOWED = new Set([
  "session_start", "session_end", "open", "leave",
  "search", "flag", "unflag", "note_save", "heartbeat",
]);

export async function POST(req: NextRequest2) {
  let data: any;
  try { data = await req.json(); } catch { return NextResponse2.json({ ok: false }, { status: 400 }); }

  const token = String(data?.token || "");
  const events = Array.isArray(data?.events) ? data.events : [];

  const link = await resolveLink2(token);
  if (!link) return NextResponse2.json({ ok: false, reason: "invalid_or_expired" }, { status: 403 });
  if (!events.length) return NextResponse2.json({ ok: true, stored: 0 });

  // Defensdriv begrenzen, damit niemand die DB flutet.
  const slice = events.slice(0, 200);

  await prisma2.dataRoomEvent.createMany({
    data: slice
      .filter((e: any) => ALLOWED.has(e?.type))
      .map((e: any) => ({
        linkId: link.id,
        type: String(e.type),
        payload: e.payload != null ? String(e.payload).slice(0, 20000) : null,
        durationMs: Number.isFinite(e.durationMs) ? Math.round(e.durationMs) : null,
        seq: Number.isFinite(e.seq) ? e.seq : null,
        clientTs: e.clientTs ? new Date(e.clientTs) : null,
      })),
  });

  return NextResponse2.json({ ok: true, stored: slice.length });
}


// ============================================================================
// ==== DATEI:  app/api/w/[workspaceSlug]/admin/dr/links/route.ts =============
// ====         (Admin: Einladungslinks erzeugen & auflisten) =================
// ============================================================================
//  >>> ANPASSEN <<< — mit deinem RBAC schützen (nur ADMIN/MASTER_ADMIN),
//  analog zu deinen bestehenden Admin-Routen.

import { NextRequest as Req3, NextResponse as Res3 } from "next/server";
import { prisma as prisma3 } from "@/lib/prisma";
import { makeToken } from "@/lib/dr/tokens";

export async function POST(req: Req3) {
  // >>> ANPASSEN <<< — hier deine Admin-Auth-Prüfung einsetzen.
  // const session = await requireAdmin(req); if (!session) return Res3.json({},{status:401});

  const body = await req.json();
  const { label, email, dataRoomSlug, expiresAt, multiUse = true } = body;

  if (!label || !dataRoomSlug || !expiresAt) {
    return Res3.json({ ok: false, error: "label, dataRoomSlug, expiresAt erforderlich" }, { status: 400 });
  }

  const link = await prisma3.dataRoomAccessLink.create({
    data: {
      token: makeToken(),
      label,
      email: email || null,
      dataRoomSlug,
      expiresAt: new Date(expiresAt),
      multiUse: !!multiUse,
      // workspace: "main", // >>> ANPASSEN <<< an dein Multi-Tenant-Feld
    },
  });

  const url = `https://www.diagnostic-suite.de/dr/${link.token}`;
  return Res3.json({ ok: true, id: link.id, url, expiresAt: link.expiresAt });
}

export async function GET(req: Req3) {
  // >>> ANPASSEN <<< — Admin-Auth + Workspace-Filter.
  const links = await prisma3.dataRoomAccessLink.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { events: true } } },
  });
  return Res3.json({ ok: true, links });
}
