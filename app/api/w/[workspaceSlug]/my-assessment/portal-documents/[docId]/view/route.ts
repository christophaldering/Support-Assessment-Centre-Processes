import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { Client } from "@replit/object-storage";

interface RouteContext {
  params: { workspaceSlug: string; docId: string };
}

function getStorageClient() {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || process.env.REPLIT_DEFAULT_BUCKET_ID;
  if (!bucketId) throw new Error("Object storage bucket not configured");
  return new Client({ bucketId });
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  if (!session || session.workspaceSlug !== params.workspaceSlug) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isCandidate = session.roles.includes("CANDIDATE");
  const isAdmin = session.roles.some((r: string) => ["ADMIN", "WORKSPACE_ADMIN", "MASTER_ADMIN", "MODERATOR"].includes(r));

  if (!isCandidate && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { assessmentId: true, workspaceId: true },
  });
  if (!user || user.workspaceId !== workspace.id || !user.assessmentId) {
    return NextResponse.json({ error: "No assessment assigned" }, { status: 404 });
  }

  const doc = await prisma.portalDocument.findFirst({
    where: { id: params.docId, assessmentId: user.assessmentId },
  });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const now = new Date();
  let isReleased = false;
  if (doc.alwaysAvailable) {
    isReleased = true;
  } else if (doc.releaseStart || doc.releaseEnd) {
    const afterStart = !doc.releaseStart || now >= doc.releaseStart;
    const beforeEnd = !doc.releaseEnd || now <= doc.releaseEnd;
    isReleased = afterStart && beforeEnd;
  } else {
    isReleased = doc.releaseStatus === "released";
  }

  if (!isReleased) {
    return NextResponse.json({ error: "Dokument ist noch nicht freigegeben" }, { status: 403 });
  }

  if (!doc.objectPath) {
    return NextResponse.json({ error: "No file attached" }, { status: 404 });
  }

  const isPdf = doc.mimeType === "application/pdf" || doc.fileName?.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json({ error: "Inline-Vorschau nur für PDF-Dateien verfügbar" }, { status: 415 });
  }

  try {
    const storageClient = getStorageClient();
    const { ok, value: rawBuffer, error } = await storageClient.downloadAsBytes(doc.objectPath);

    if (!ok || !rawBuffer) {
      console.error("Object storage view error:", error);
      return NextResponse.json({ error: "Datei konnte nicht geladen werden" }, { status: 500 });
    }

    const buffer = Array.isArray(rawBuffer) ? Buffer.concat(rawBuffer) : Buffer.from(rawBuffer);
    const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    const headers: Record<string, string> = {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName || "document.pdf")}"`,
      "Content-Length": buffer.byteLength.toString(),
      "Cache-Control": "private, max-age=300",
    };

    if (!doc.downloadAllowed) {
      headers["Content-Security-Policy"] = "sandbox";
    }

    return new Response(bytes, { status: 200, headers });
  } catch (err) {
    console.error("PDF view error:", err);
    return NextResponse.json({ error: "Fehler beim Laden der Vorschau" }, { status: 500 });
  }
}
