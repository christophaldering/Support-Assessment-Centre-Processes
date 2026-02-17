import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFile } from "child_process";

export const maxDuration = 120;

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  let tmpFile: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        error: "Datei ist zu groß. Maximale Größe: 50 MB",
      }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isAllowed =
      fileName.endsWith(".pdf") ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".doc") ||
      fileName.endsWith(".txt");

    if (!isAllowed) {
      return NextResponse.json({
        error: "Ungültiges Dateiformat. Erlaubt: PDF, DOCX, DOC, TXT",
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    tmpFile = path.join(os.tmpdir(), `cs_upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
    fs.writeFileSync(tmpFile, buffer);

    const text = await extractTextFromFile(fileName, buffer, tmpFile);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      textContent: text,
      textLength: text.length,
    });
  } catch (err) {
    console.error("Error uploading file:", err);
    return NextResponse.json({ error: "Fehler beim Verarbeiten der Datei" }, { status: 500 });
  } finally {
    if (tmpFile && fs.existsSync(tmpFile)) {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  }
}

function extractPdfText(tmpFile: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "lib", "pdf-extract.mjs");
    execFile("node", [scriptPath, tmpFile], { timeout: 60000, maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        console.error("PDF extraction process error:", err.message, stderr);
        reject(new Error("PDF extraction failed"));
        return;
      }
      try {
        const result = JSON.parse(stdout);
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result.text || "");
        }
      } catch {
        reject(new Error("Failed to parse PDF extraction result"));
      }
    });
  });
}

async function extractTextFromFile(fileName: string, buffer: Buffer, tmpFile: string): Promise<string> {
  if (fileName.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  if (fileName.endsWith(".pdf")) {
    try {
      const text = await extractPdfText(tmpFile);
      if (text.trim().length > 0) {
        return text;
      }
      return `[PDF-Datei]\n\nKein extrahierbarer Text gefunden. Das PDF enthält möglicherweise nur Bilder/Scans.`;
    } catch (e: any) {
      console.error("PDF parse error:", e);
      return `[PDF-Datei]\n\nFehler bei der Textextraktion: ${e.message}`;
    }
  }

  if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
    try {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 0) {
        return result.value;
      }
      return `[Word-Datei]\n\nKein Text extrahiert. Bitte prüfen Sie die Datei.`;
    } catch (e) {
      console.error("DOCX parse error:", e);
      return `[Word-Datei]\n\nTextextraktion fehlgeschlagen.`;
    }
  }

  return `Textextraktion für dieses Format nicht unterstützt.`;
}
