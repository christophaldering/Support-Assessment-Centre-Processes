/**
 * GET /api/w/[workspaceSlug]/admin/dr/file-status
 *
 * Reads private/convia/ConVia_Datenraum.html and returns a diagnostic
 * snapshot: whether the file exists, is the placeholder, has the required
 * <head> tag, and contains the tracking script markers.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { readFile, stat } from "fs/promises";
import path from "path";

interface RouteContext {
  params: { workspaceSlug: string };
}

function isAdmin(
  session: ReturnType<typeof getUserSession>,
  master: boolean,
  workspaceSlug: string
): boolean {
  if (master) return true;
  if (!session || session.workspaceSlug !== workspaceSlug) return false;
  return session.roles.some((r) =>
    ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN"].includes(r)
  );
}

const HTML_PATH = path.join(process.cwd(), "private", "convia", "ConVia_Datenraum.html");

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!isAdmin(session, master, params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let exists = false;
  let sizeBytes = 0;
  let isPlaceholder = false;
  let hasHead = false;
  let hasTrackingScript = false;
  let hasDrToken = false;
  let hasAllHooks = false;

  try {
    const s = await stat(HTML_PATH);
    exists = true;
    sizeBytes = s.size;

    const html = await readFile(HTML_PATH, "utf-8");

    isPlaceholder = html.includes("PLATZHALTER") || html.includes("Ersetze den gesamten");
    hasHead = /<head[\s>]/i.test(html);
    hasTrackingScript = html.includes("drTrackOpen") && html.includes("drTrackLeave");
    hasDrToken = html.includes("__DR_TOKEN") || html.includes("DR_TOKEN");

    const hooks = ["drTrackOpen", "drTrackLeave", "drTrackSearch", "drTrackFlag", "drTrackNoteSave"];
    hasAllHooks = hooks.every((h) => html.includes(h));
  } catch {
    // file doesn't exist or can't be read
  }

  const ready = exists && !isPlaceholder && hasHead && hasTrackingScript;

  return NextResponse.json({
    ok: true,
    exists,
    isPlaceholder,
    hasHead,
    hasTrackingScript,
    hasDrToken,
    hasAllHooks,
    sizeBytes,
    ready,
    checkedAt: new Date().toISOString(),
  });
}
