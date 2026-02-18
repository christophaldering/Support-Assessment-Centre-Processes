import { NextRequest, NextResponse } from "next/server";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasAnyPermission } from "@/lib/rbac";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFile } from "child_process";
import OpenAI from "openai";

export const maxDuration = 120;

interface RouteContext {
  params: { workspaceSlug: string };
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const TEMPLATE_TYPES = [
  "verhaltensanker-bogen",
  "kompetenzmatrix",
  "freitext-bogen",
  "kombinierter-bogen",
];

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasAnyPermission(session.roles, ["exerciselibrary.upload", "exerciselibrary.manage"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let tmpFile: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Datei ist erforderlich" }, { status: 400 });
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Datei darf maximal 50 MB groß sein" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    tmpFile = path.join(os.tmpdir(), `obs_analyze_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
    fs.writeFileSync(tmpFile, buffer);

    const extractedText = await extractTextFromFile(fileName, buffer, tmpFile);
    const truncatedText = extractedText.slice(0, 12000);

    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: `Du bist ein Experte für Assessment Center und Beobachtungsbögen. Analysiere den hochgeladenen Beobachtungsbogen und extrahiere strukturierte Informationen.

Antworte ausschließlich in validem JSON mit genau diesen Feldern:

{
  "suggestedType": "einer von: ${TEMPLATE_TYPES.join(", ")}",
  "suggestedName": "Aussagekräftiger Name für den Beobachtungsbogen",
  "description": "Kurzbeschreibung (2-3 Sätze) des Bogens",
  "ratingScale": "Erkannte Bewertungsskala (z.B. '1-5', '1-4', '1-7', 'a-e') oder 'custom'",
  "competencies": ["Liste der im Bogen enthaltenen Kompetenzen/Dimensionen"],
  "exerciseContext": "Falls erkennbar: für welche Übung(en) der Bogen konzipiert ist",
  "targetLevel": "Erkanntes Zielniveau (SE-Level / Vorstand, Director / Bereichsleitung, Manager, Expert) oder leer",
  "sections": [
    {
      "title": "Abschnittstitel",
      "type": "anchors|matrix|freetext|mixed",
      "competency": "Zugehörige Kompetenz",
      "items": [
        {
          "label": "Beobachtungskriterium/Verhaltensanker",
          "type": "rating|text|checkbox",
          "anchors": ["Ankerbeispiele falls vorhanden"],
          "helpText": "Erläuterung falls vorhanden"
        }
      ]
    }
  ],
  "tags": ["5-8 relevante Tags"],
  "qualityNotes": "Kurze Einschätzung der Qualität und ggf. Verbesserungsvorschläge"
}

Regeln:
- suggestedType MUSS einer der vorgegebenen Werte sein
- Kompetenzen möglichst genau extrahieren
- Verhaltensanker und Bewertungsskala genau identifizieren
- Bei Unsicherheit: Beste Schätzung basierend auf dem Inhalt`,
        },
        {
          role: "user",
          content: `Dateiname: ${file.name}\n\nInhalt des Beobachtungsbogens:\n\n${truncatedText}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const result = {
      suggestedType: TEMPLATE_TYPES.includes(parsed.suggestedType) ? parsed.suggestedType : "kombinierter-bogen",
      suggestedName: typeof parsed.suggestedName === "string" ? parsed.suggestedName.trim() : file.name,
      description: typeof parsed.description === "string" ? parsed.description.trim() : "",
      ratingScale: typeof parsed.ratingScale === "string" ? parsed.ratingScale.trim() : "1-5",
      competencies: Array.isArray(parsed.competencies)
        ? parsed.competencies.filter((c: unknown) => typeof c === "string")
        : [],
      exerciseContext: typeof parsed.exerciseContext === "string" ? parsed.exerciseContext.trim() : "",
      targetLevel: typeof parsed.targetLevel === "string" ? parsed.targetLevel.trim() : "",
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((t: unknown) => typeof t === "string")
        : [],
      qualityNotes: typeof parsed.qualityNotes === "string" ? parsed.qualityNotes.trim() : "",
      extractedText: truncatedText,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Observation sheet analysis error:", error);
    return NextResponse.json({ error: "Analyse fehlgeschlagen" }, { status: 500 });
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
      if (text.trim().length > 0) return text;
      return "[PDF-Datei] Kein extrahierbarer Text gefunden.";
    } catch (e: any) {
      console.error("PDF parse error:", e);
      return `[PDF-Datei] Fehler: ${e.message}`;
    }
  }

  if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
    try {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 0) return result.value;
      return "[Word-Datei] Kein Text extrahiert.";
    } catch (e) {
      console.error("DOCX parse error:", e);
      return "[Word-Datei] Textextraktion fehlgeschlagen.";
    }
  }

  if (fileName.endsWith(".pptx")) {
    try {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 0) return result.value;
    } catch {}
    return `[PowerPoint-Datei] ${fileName}`;
  }

  return `Dateiname: ${fileName}`;
}
