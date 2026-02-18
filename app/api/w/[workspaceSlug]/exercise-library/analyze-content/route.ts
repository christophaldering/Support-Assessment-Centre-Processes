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

const EXERCISE_TYPES = [
  "interview_guide",
  "case_study",
  "fact_finding",
  "presentation",
  "leadership_simulation",
  "peer_conversation",
  "group_exercise",
  "psychometric_test",
  "other",
];

const TARGET_LEVELS = [
  "C-Level / Vorstand",
  "HAL / Bereichsleiter",
  "Abteilungsleiter",
  "Gruppenleiter",
  "Fachfunktion",
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

    tmpFile = path.join(os.tmpdir(), `ex_analyze_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
    fs.writeFileSync(tmpFile, buffer);

    const extractedText = await extractTextFromFile(fileName, buffer, tmpFile);

    const truncatedText = extractedText.slice(0, 12000);

    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: `Du bist ein Experte für Assessment Center und Kompetenzdiagnostik. Analysiere den Inhalt eines Assessment-Bausteins (Übungsdokument) und klassifiziere ihn vollständig.

Antworte ausschließlich in validem JSON mit genau diesen Feldern:

{
  "exerciseType": "einer von: ${EXERCISE_TYPES.join(", ")}",
  "targetLevels": ["passende aus: ${TARGET_LEVELS.join(", ")}"],
  "author": "Name des Autors falls erkennbar, sonst leer",
  "sourceContext": "Für welchen Kunden/welches Unternehmen die Übung ursprünglich konzipiert wurde, falls erkennbar, sonst leer",
  "suggestedTitle": "Aussagekräftiger Titel im Format: [Übungstyp] – [Kontext/Unternehmen] – [Kurzbeschreibung]",
  "tags": ["5-10 relevante Tags auf Deutsch, z.B. Kompetenzen, Rollen, Methoden, Unternehmensnamen, Themen"],
  "description": "Eine prägnante Kurzbeschreibung (3-5 Sätze) des Bausteins: Was wird gemessen/simuliert? Welche Situation wird dargestellt? Was muss der Kandidat tun? Diese Beschreibung soll eine schnelle Entscheidung ermöglichen, ob der Baustein für einen bestimmten Bedarf geeignet ist."
}

Regeln:
- exerciseType MUSS einer der vorgegebenen Werte sein
- targetLevels MUSS aus der vorgegebenen Liste stammen (können mehrere sein)
- Die description soll informativ und entscheidungsrelevant sein – nicht zu lang, aber aussagekräftig
- Tags sollen das Matching mit Anforderungsprofilen unterstützen
- Bei Unsicherheit: Bestes Schätzung basierend auf dem Inhalt`,
        },
        {
          role: "user",
          content: `Dateiname: ${file.name}\n\nInhalt des Dokuments:\n\n${truncatedText}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const result = {
      exerciseType: EXERCISE_TYPES.includes(parsed.exerciseType) ? parsed.exerciseType : "other",
      targetLevels: Array.isArray(parsed.targetLevels)
        ? parsed.targetLevels.filter((l: string) => TARGET_LEVELS.includes(l))
        : [],
      author: typeof parsed.author === "string" ? parsed.author.trim() : "",
      sourceContext: typeof parsed.sourceContext === "string" ? parsed.sourceContext.trim() : "",
      suggestedTitle: typeof parsed.suggestedTitle === "string" ? parsed.suggestedTitle.trim() : file.name,
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((t: unknown) => typeof t === "string" && (t as string).trim().length > 0)
        : [],
      description: typeof parsed.description === "string" ? parsed.description.trim() : "",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Content analysis error:", error);
    return NextResponse.json({ error: "Inhaltsanalyse fehlgeschlagen" }, { status: 500 });
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
