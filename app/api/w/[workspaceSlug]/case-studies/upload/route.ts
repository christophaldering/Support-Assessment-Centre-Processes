import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

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

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: "Ungültiges Dateiformat. Erlaubt: PDF, DOCX, DOC, TXT",
      }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const text = await extractTextFromFile(file, arrayBuffer);

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
  }
}

async function extractTextFromFile(file: File, arrayBuffer: ArrayBuffer): Promise<string> {
  if (file.type === "text/plain") {
    return new TextDecoder().decode(arrayBuffer);
  }

  if (file.type === "application/pdf") {
    return `[PDF-Datei: ${file.name}]\n\nDer Inhalt dieser PDF-Datei wird für die KI-Analyse bereitgestellt. Bitte verwenden Sie den KI-Generierungsmodus mit einer manuellen Beschreibung der Fallstudie, da PDF-Extraktion serverseitig begrenzt ist.`;
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword"
  ) {
    try {
      const buffer = Buffer.from(arrayBuffer);
      const textParts: string[] = [];
      const str = buffer.toString("utf-8");
      const xmlMatches = str.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (xmlMatches) {
        for (const match of xmlMatches) {
          const textContent = match.replace(/<[^>]+>/g, "");
          if (textContent.trim()) {
            textParts.push(textContent);
          }
        }
      }
      if (textParts.length > 0) {
        return textParts.join(" ");
      }
      return `[Word-Datei: ${file.name}]\n\nBitte beschreiben Sie den Inhalt der Fallstudie manuell für die KI-Verarbeitung.`;
    } catch {
      return `[Word-Datei: ${file.name}]\n\nTextextraktion fehlgeschlagen. Bitte beschreiben Sie den Inhalt manuell.`;
    }
  }

  return `[Datei: ${file.name}]\n\nTextextraktion für dieses Format nicht unterstützt.`;
}
