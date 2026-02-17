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

const MIME_MAP: Record<string, string> = {
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

function getMimeType(fileName: string, storedMime?: string | null): string {
  if (storedMime) return storedMime;
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  return MIME_MAP[ext] || "application/octet-stream";
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
      console.error("Object storage download error:", error);
      return NextResponse.json({ error: "Datei konnte nicht geladen werden" }, { status: 500 });
    }

    const fileName = item.originalFileName || "download";
    const mimeType = getMimeType(fileName, item.originalMimeType);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json({ error: "Fehler beim Herunterladen" }, { status: 500 });
  }
}
