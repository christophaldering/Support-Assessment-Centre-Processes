import { NextRequest, NextResponse } from "next/server";
import { resolveLink } from "@/lib/dr/tokens";
import { prisma } from "@/lib/db";

const ALLOWED = new Set([
  "session_start", "session_end", "open", "leave",
  "search", "flag", "unflag", "note_save", "heartbeat",
  "session_complete", "session_resume",
]);

export async function POST(req: NextRequest) {
  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const body = data as Record<string, unknown>;
  const token = String(body?.token || "");
  const events = Array.isArray(body?.events) ? body.events : [];

  const link = await resolveLink(token);
  if (!link) {
    return NextResponse.json({ ok: false, reason: "invalid_or_expired" }, { status: 403 });
  }
  if (!events.length) {
    return NextResponse.json({ ok: true, stored: 0 });
  }

  const slice = events.slice(0, 200);

  const rows = slice
    .filter((e: unknown) => {
      const ev = e as Record<string, unknown>;
      return typeof ev?.type === "string" && ALLOWED.has(ev.type);
    })
    .map((e: unknown) => {
      const ev = e as Record<string, unknown>;
      const rawTs = ev.clientTs ? new Date(String(ev.clientTs)) : null;
      return {
        linkId: link.id,
        type: String(ev.type),
        payload: ev.payload != null ? String(ev.payload).slice(0, 20000) : null,
        durationMs: typeof ev.durationMs === "number" && Number.isFinite(ev.durationMs)
          ? Math.round(ev.durationMs)
          : null,
        seq: typeof ev.seq === "number" && Number.isFinite(ev.seq) ? ev.seq : null,
        clientTs: rawTs && !isNaN(rawTs.getTime()) ? rawTs : null,
      };
    });

  await prisma.dataRoomEvent.createMany({ data: rows });

  return NextResponse.json({ ok: true, stored: rows.length });
}
