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

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace nicht gefunden" }, { status: 404 });
    }

    const item = await prisma.exerciseLibraryItem.findFirst({
      where: { id: params.itemId, workspaceId: workspace.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Übung nicht gefunden" }, { status: 404 });
    }

    if (!item.originalFileKey) {
      return NextResponse.json({ error: "Keine Datei vorhanden" }, { status: 404 });
    }

    const client = getStorageClient();
    const { ok, value: buffer, error } = await client.downloadAsBytes(item.originalFileKey);

    if (!ok || !buffer) {
      console.error("Object storage preview error:", error);
      return NextResponse.json({ error: "Datei konnte nicht geladen werden" }, { status: 500 });
    }

    const fileName = (item.originalFileName || "").toLowerCase();
    const mimeType = item.originalMimeType || "";

    if (fileName.endsWith(".pdf") || mimeType === "application/pdf") {
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${encodeURIComponent(item.originalFileName || "preview.pdf")}"`,
          "Content-Length": buffer.length.toString(),
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
        return NextResponse.json({ error: "Vorschau konnte nicht erstellt werden" }, { status: 500 });
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
        return NextResponse.json({ error: "Vorschau konnte nicht erstellt werden" }, { status: 500 });
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
        return NextResponse.json({ error: "Vorschau konnte nicht erstellt werden" }, { status: 500 });
      }
    }

    return NextResponse.json(
      { error: "Vorschau für diesen Dateityp nicht verfügbar" },
      { status: 415 }
    );
  } catch (err) {
    console.error("Preview error:", err);
    return NextResponse.json({ error: "Fehler bei der Vorschau" }, { status: 500 });
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
