import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { Client } from "@replit/object-storage";

interface RouteContext {
  params: { workspaceSlug: string; itemId: string };
}

function getStorageClient() {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || process.env.REPLIT_DEFAULT_BUCKET_ID;
  if (!bucketId) throw new Error("Object storage bucket not configured");
  return new Client({ bucketId });
}

function errorHtml(title: string, message: string, status: number): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vorschau – ${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, sans-serif; color: #1e293b; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 40px 48px; max-width: 480px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .icon { font-size: 40px; margin-bottom: 16px; }
    h1 { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #0f172a; }
    p { font-size: 14px; color: #64748b; line-height: 1.6; }
    .code { font-size: 11px; color: #94a3b8; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <p class="code">Fehlercode: ${status}</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return errorHtml("Nicht autorisiert", "Bitte melden Sie sich an, um die Vorschau anzuzeigen.", 401);
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return errorHtml("Zugriff verweigert", "Sie haben keine Berechtigung, diese Datei anzuzeigen.", 403);
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return errorHtml("Workspace nicht gefunden", "Der angegebene Workspace existiert nicht.", 404);
    }

    const item = await prisma.exerciseLibraryItem.findFirst({
      where: { id: params.itemId, workspaceId: workspace.id },
    });

    if (!item) {
      return errorHtml("Übung nicht gefunden", "Die angeforderte Übung konnte nicht gefunden werden.", 404);
    }

    if (!item.originalFileKey) {
      return errorHtml("Keine Datei vorhanden", "Zu dieser Übung wurde keine Datei hochgeladen.", 404);
    }

    let client: Client;
    try {
      client = getStorageClient();
    } catch (e) {
      console.error("Object storage config error:", e);
      return errorHtml("Speicher nicht konfiguriert", "Der Dateispeicher ist nicht verfügbar. Bitte kontaktieren Sie den Administrator.", 500);
    }

    const { ok, value: rawBuffer, error } = await client.downloadAsBytes(item.originalFileKey);

    if (!ok || !rawBuffer) {
      console.error("Object storage preview error:", error, "key:", item.originalFileKey);
      return errorHtml(
        "Datei nicht verfügbar",
        `Die Datei "${item.originalFileName || "unbekannt"}" konnte nicht aus dem Speicher geladen werden. Möglicherweise wurde sie gelöscht oder der Speicherpfad ist ungültig.`,
        500
      );
    }

    const buffer = Array.isArray(rawBuffer) ? Buffer.concat(rawBuffer) : Buffer.from(rawBuffer);

    const fileName = (item.originalFileName || "").toLowerCase();
    const mimeType = item.originalMimeType || "";

    if (fileName.endsWith(".pdf") || mimeType === "application/pdf") {
      const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      return new Response(bytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${encodeURIComponent(item.originalFileName || "preview.pdf")}"`,
          "Content-Length": buffer.byteLength.toString(),
          "Cache-Control": "no-store",
        },
      });
    }

    if (
      fileName.endsWith(".docx") ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ buffer: Buffer.from(buffer) });
        const html = wrapHtml(result.value, item.originalFileName || "Dokument");
        return new NextResponse(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      } catch (convErr) {
        console.error("mammoth conversion error:", convErr);
        return errorHtml("Konvertierung fehlgeschlagen", "Die Word-Datei konnte nicht in eine Vorschau umgewandelt werden. Bitte versuchen Sie den Download.", 500);
      }
    }

    if (
      fileName.endsWith(".pptx") ||
      mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      try {
        const officeparser = await import("officeparser");
        const text = await officeparser.parseOfficeAsync(Buffer.from(buffer));
        const html = wrapHtml(
          `<pre style="white-space:pre-wrap;font-family:Inter,sans-serif;font-size:14px;line-height:1.7">${escapeHtml(text)}</pre>`,
          item.originalFileName || "Präsentation"
        );
        return new NextResponse(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      } catch (convErr) {
        console.error("officeparser conversion error:", convErr);
        return errorHtml("Konvertierung fehlgeschlagen", "Die PowerPoint-Datei konnte nicht in eine Vorschau umgewandelt werden. Bitte versuchen Sie den Download.", 500);
      }
    }

    if (
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel")
    ) {
      try {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(Buffer.from(buffer), { type: "buffer" });
        let tablesHtml = "";
        for (const sheetName of wb.SheetNames) {
          const sheet = wb.Sheets[sheetName];
          if (!sheet) continue;
          tablesHtml += `<h2 style="margin-top:24px;font-size:16px;font-weight:600">${escapeHtml(sheetName)}</h2>`;
          tablesHtml += XLSX.utils.sheet_to_html(sheet, { editable: false });
        }
        const html = wrapHtml(tablesHtml, item.originalFileName || "Tabelle");
        return new NextResponse(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      } catch (convErr) {
        console.error("xlsx conversion error:", convErr);
        return errorHtml("Konvertierung fehlgeschlagen", "Die Excel-Datei konnte nicht in eine Vorschau umgewandelt werden. Bitte versuchen Sie den Download.", 500);
      }
    }

    return errorHtml(
      "Dateityp nicht unterstützt",
      `Für den Dateityp "${item.originalFileName || "unbekannt"}" ist keine Vorschau verfügbar. Bitte verwenden Sie die Download-Funktion.`,
      415
    );
  } catch (err) {
    console.error("Preview error:", err);
    return errorHtml("Unerwarteter Fehler", "Bei der Vorschau ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut oder nutzen Sie die Download-Funktion.", 500);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapHtml(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, sans-serif; color: #1e293b; background: #fff; padding: 32px 48px; line-height: 1.6; max-width: 900px; margin: 0 auto; }
    h1, h2, h3 { margin: 18px 0 8px; }
    p { margin: 8px 0; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 10px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    img { max-width: 100%; height: auto; }
    ul, ol { padding-left: 24px; margin: 8px 0; }
    li { margin: 4px 0; }
  </style>
</head>
<body>${body}</body>
</html>`;
}
