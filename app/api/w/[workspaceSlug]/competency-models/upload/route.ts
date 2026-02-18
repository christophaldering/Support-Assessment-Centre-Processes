import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import OpenAI from "openai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFile } from "child_process";

export const maxDuration = 120;

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface RouteContext {
  params: { workspaceSlug: string };
}

const COMPETENCY_PARSE_PROMPT = `Du bist ein Experte für Kompetenzmodelle in der Führungskräftediagnostik und im Human Resources Management.

Dir wird der Textinhalt eines hochgeladenen Dokuments gegeben, das ein Kompetenzmodell, Kompetenzkatalog oder ein ähnliches Framework enthält.

Analysiere den Text und extrahiere die Struktur in ein standardisiertes Format. Das Modell kann beliebig komplex sein - von einfachen Listen bis zu tief verschachtelten Hierarchien.

Antworte AUSSCHLIESSLICH mit validem JSON in diesem Format:

{
  "modelName": "<Name des Kompetenzmodells>",
  "modelDescription": "<Zusammenfassende Beschreibung des Modells>",
  "language": "<de|en|mixed>",
  "hierarchy": [
    {
      "name": "<Name des Clusters/der Gruppe>",
      "type": "cluster",
      "description": "<Beschreibung des Clusters>",
      "children": [
        {
          "name": "<Name der Kompetenz>",
          "type": "competency",
          "description": "<Definition/Beschreibung der Kompetenz>",
          "children": [
            {
              "name": "<Verhaltensanker oder Subkompetenz>",
              "type": "anchor",
              "description": "<Beschreibung des Verhaltensankers>",
              "children": []
            }
          ]
        }
      ]
    }
  ],
  "assessment": {
    "overallQuality": "<hoch|mittel|niedrig>",
    "qualityScore": <1-10>,
    "usability": "<Wofür ist das Modell besonders geeignet? z.B. Executive Assessment, Management Audit, Potenzialanalyse, 360°-Feedback, Development Center, etc.>",
    "targetGroups": ["<Zielgruppe 1>", "<Zielgruppe 2>"],
    "strengths": ["<Stärke 1>", "<Stärke 2>", "<Stärke 3>"],
    "weaknesses": ["<Schwäche 1>", "<Schwäche 2>"],
    "recommendations": ["<Empfehlung 1>", "<Empfehlung 2>"],
    "completeness": {
      "hasClusters": <true|false>,
      "hasCompetencies": <true|false>,
      "hasDefinitions": <true|false>,
      "hasAnchors": <true|false>,
      "hasLevels": <true|false>
    },
    "tags": ["<Tag 1>", "<Tag 2>", "<Tag 3>", "<Tag 4>", "<Tag 5>"]
  }
}

Wichtige Regeln:
- Erkenne die Struktur des Dokuments flexibel: Cluster/Gruppen, Kompetenzen/Kriterien, Definitionen/Beschreibungen, Operationalisierungen/Verhaltensanker
- Wenn keine klaren Cluster vorhanden sind, erstelle sinnvolle Gruppierungen
- Wenn Verhaltensanker fehlen, setze type "competency" ohne Kinder
- Bewerte die fachliche Qualität ehrlich und konstruktiv
- Schlage konkrete Verwendungszwecke vor
- Tags sollten Branche, Level, Methodik und Einsatzgebiet abdecken
- Behalte die Originalsprache der Kompetenznamen und Beschreibungen bei
- Antworte AUSSCHLIESSLICH mit validem JSON`;

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "competencies.manage")) {
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

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Datei ist zu groß. Maximale Größe: 20 MB" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isAllowed = fileName.endsWith(".pdf") || fileName.endsWith(".docx") || fileName.endsWith(".doc") || fileName.endsWith(".txt");

    if (!isAllowed) {
      return NextResponse.json({ error: "Ungültiges Dateiformat. Erlaubt: PDF, DOCX, DOC, TXT" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    tmpFile = path.join(os.tmpdir(), `cm_upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
    fs.writeFileSync(tmpFile, buffer);

    const text = await extractTextFromFile(fileName, buffer, tmpFile);

    if (text.trim().length < 50) {
      return NextResponse.json({ error: "Zu wenig Text extrahiert. Bitte prüfen Sie die Datei." }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: COMPETENCY_PARSE_PROMPT },
        { role: "user", content: `Datei: ${file.name}\n\nInhalt:\n${text.slice(0, 30000)}` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      textLength: text.length,
      ...parsed,
    });
  } catch (err) {
    console.error("Error uploading competency model:", err);
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
        console.error("PDF extraction error:", err.message, stderr);
        reject(new Error("PDF extraction failed"));
        return;
      }
      try {
        const result = JSON.parse(stdout);
        if (result.error) reject(new Error(result.error));
        else resolve(result.text || "");
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
      if (text.trim().length > 0) return text;
      return "[PDF] Kein extrahierbarer Text gefunden.";
    } catch (e: any) {
      console.error("PDF parse error:", e);
      return `[PDF] Fehler bei der Textextraktion: ${e.message}`;
    }
  }

  if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
    try {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 0) return result.value;
      return "[Word] Kein Text extrahiert.";
    } catch (e) {
      console.error("DOCX parse error:", e);
      return "[Word] Textextraktion fehlgeschlagen.";
    }
  }

  return "Textextraktion für dieses Format nicht unterstützt.";
}
