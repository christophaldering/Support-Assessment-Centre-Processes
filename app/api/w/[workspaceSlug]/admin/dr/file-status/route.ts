/**
 * GET /api/w/[workspaceSlug]/admin/dr/file-status
 *
 * Reads private/convia/ConVia_Datenraum.html and returns a diagnostic
 * snapshot used by the setup guide page.
 *
 * Note on tracking script:
 *   app/dr/view/route.ts auto-injects the canonical tracking script
 *   server-side whenever "window.drTrackOpen" is absent from the source
 *   HTML.  So `hasTrackingScript` being false is NOT a blocker — the
 *   server handles it.  The field is reported for informational purposes.
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

    isPlaceholder =
      html.includes("PLATZHALTER") ||
      html.includes("Ersetze den gesamten") ||
      html.includes("Platzhalter-Ansicht");

    hasHead = /<head[\s>]/i.test(html);

    // Tracking script: either embedded in file OR auto-injected by server.
    // We report what's in the file itself; the server always injects if absent.
    hasTrackingScript = html.includes("drTrackOpen") && html.includes("drTrackLeave");
    hasDrToken = html.includes("__DR_TOKEN");

    const hooks = ["drTrackOpen", "drTrackLeave", "drTrackSearch", "drTrackFlag", "drTrackNoteSave"];
    hasAllHooks = hooks.every((h) => html.includes(h));
  } catch {
    // file doesn't exist or can't be read
  }

  // Ready = file present + not placeholder + has <head> (tracking is auto-injected by server)
  const ready = exists && !isPlaceholder && hasHead;

  return NextResponse.json({
    ok: true,
    exists,
    isPlaceholder,
    hasHead,
    // trackingScript: whether the SOURCE file has the script (server auto-injects if false)
    hasTrackingScript,
    trackingAutoInjected: exists && !hasTrackingScript,
    hasDrToken,
    hasAllHooks,
    sizeBytes,
    ready,
    checkedAt: new Date().toISOString(),
  });
}
