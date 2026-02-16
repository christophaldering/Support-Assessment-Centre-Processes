import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import OpenAI from "openai";
import { inflateRawSync } from "zlib";

interface RouteContext {
  params: { workspaceSlug: string };
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const STYLEGUIDE_SYSTEM_PROMPT = `Du bist ein Experte für Corporate Identity und Markenrichtlinien. Analysiere das folgende Dokument (ein Style Guide / Brand Manual / Corporate Design Handbuch) und extrahiere daraus strukturierte Markenregeln.

Antworte ausschließlich in validem JSON mit folgender Struktur:
{
  "colors": {
    "primary": "#hex oder null",
    "secondary": "#hex oder null",
    "accent": "#hex oder null",
    "background": "#hex oder null"
  },
  "typography": {
    "headingFont": "Schriftname oder null",
    "bodyFont": "Schriftname oder null",
    "headingSize": "z.B. 24px oder null",
    "bodySize": "z.B. 14px oder null"
  },
  "spacing": {
    "gridUnit": "z.B. 8px oder null",
    "margins": "z.B. 24px oder null"
  },
  "logoPlacement": {
    "position": "top-left|top-center|top-right oder null",
    "maxHeight": "z.B. 48px oder null"
  },
  "toneOfVoice": {
    "style": "formal|informal|mixed",
    "notes": "Beschreibung des Kommunikationsstils"
  },
  "documentRules": {
    "coverPage": true/false,
    "headerFooter": "Beschreibung oder null",
    "confidentialityNote": "Text oder null",
    "pageNumbers": true/false,
    "watermark": "Text oder null"
  },
  "slideRules": {
    "titleSlide": true/false,
    "sectionDividers": true/false,
    "footer": "Text oder null",
    "legalLine": "Text oder null"
  }
}

Extrahiere so viel wie möglich aus dem Dokument. Setze fehlende Werte auf null.
Alle Texte auf Deutsch.`;

function extractTextFromDocx(buffer: Buffer): string {
  try {
    const ZIP_LOCAL_HEADER = 0x04034b50;
    const texts: string[] = [];
    let offset = 0;

    while (offset + 30 < buffer.length) {
      const sig = buffer.readUInt32LE(offset);
      if (sig !== ZIP_LOCAL_HEADER) break;

      const compressionMethod = buffer.readUInt16LE(offset + 8);
      const compressedSize = buffer.readUInt32LE(offset + 18);
      const uncompressedSize = buffer.readUInt32LE(offset + 22);
      const fileNameLength = buffer.readUInt16LE(offset + 26);
      const extraFieldLength = buffer.readUInt16LE(offset + 28);
      const fileName = buffer.toString("utf-8", offset + 30, offset + 30 + fileNameLength);
      const dataStart = offset + 30 + fileNameLength + extraFieldLength;

      if (fileName === "word/document.xml" || fileName === "word/document2.xml") {
        let xmlData: Buffer;
        if (compressionMethod === 0) {
          xmlData = buffer.subarray(dataStart, dataStart + uncompressedSize);
        } else {
          try {
            xmlData = inflateRawSync(buffer.subarray(dataStart, dataStart + compressedSize));
          } catch {
            xmlData = buffer.subarray(dataStart, dataStart + compressedSize);
          }
        }
        const xmlString = xmlData.toString("utf-8");
        const textContent = xmlString.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        texts.push(textContent);
      }

      offset = dataStart + compressedSize;
    }

    return texts.join("\n\n") || "";
  } catch {
    return "";
  }
}

function extractTextFromPdf(buffer: Buffer): string {
  try {
    const text = buffer.toString("latin1");
    const textParts: string[] = [];

    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;
    while ((match = streamRegex.exec(text)) !== null) {
      const streamContent = match[1] || "";
      const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
      let btMatch;
      while ((btMatch = btEtRegex.exec(streamContent)) !== null) {
        const btContent = btMatch[1] || "";
        const tjRegex = /\(([^)]*)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(btContent)) !== null) {
          if (tjMatch[1]) textParts.push(tjMatch[1]);
        }
        const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
        let tjArrMatch;
        while ((tjArrMatch = tjArrayRegex.exec(btContent)) !== null) {
          const arrContent = tjArrMatch[1] || "";
          const strRegex = /\(([^)]*)\)/g;
          let strMatch;
          while ((strMatch = strRegex.exec(arrContent)) !== null) {
            if (strMatch[1]) textParts.push(strMatch[1]);
          }
        }
      }
    }

    if (textParts.length === 0) {
      const simpleTjRegex = /\(([^)]{2,})\)\s*Tj/g;
      let simpleMatch;
      while ((simpleMatch = simpleTjRegex.exec(text)) !== null) {
        if (simpleMatch[1]) textParts.push(simpleMatch[1]);
      }
    }

    return textParts.join(" ").replace(/\\n/g, "\n").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

function mapAiResponseToRulesJson(parsed: Record<string, any>): Record<string, any> {
  return {
    colors: {
      primary: parsed.colors?.primary || null,
      secondary: parsed.colors?.secondary || null,
      accent: parsed.colors?.accent || null,
      background: parsed.colors?.background || null,
    },
    typography: {
      headingFont: parsed.typography?.headingFont || null,
      bodyFont: parsed.typography?.bodyFont || null,
      headingSize: parsed.typography?.headingSize || null,
      bodySize: parsed.typography?.bodySize || null,
    },
    spacing: {
      gridUnit: parsed.spacing?.gridUnit || null,
      margins: parsed.spacing?.margins || null,
    },
    logo: {
      position: parsed.logoPlacement?.position || null,
      maxHeight: parsed.logoPlacement?.maxHeight || null,
    },
    tone: {
      style: parsed.toneOfVoice?.style || "formal",
      notes: parsed.toneOfVoice?.notes || null,
    },
    document: {
      coverPage: parsed.documentRules?.coverPage ?? false,
      headerFooter: parsed.documentRules?.headerFooter || null,
      confidentialityNote: parsed.documentRules?.confidentialityNote || null,
      pageNumbers: parsed.documentRules?.pageNumbers ?? false,
      watermark: parsed.documentRules?.watermark || null,
    },
    slides: {
      titleSlide: parsed.slideRules?.titleSlide ?? false,
      sectionDividers: parsed.slideRules?.sectionDividers ?? false,
      footer: parsed.slideRules?.footer || null,
      legalLine: parsed.slideRules?.legalLine || null,
    },
  };
}

function assessConfidence(extractedText: string, rulesJson: Record<string, any>): "high" | "medium" | "low" {
  if (extractedText.length < 50) return "low";

  let filledFields = 0;
  let totalFields = 0;

  const checkObj = (obj: Record<string, any>) => {
    for (const val of Object.values(obj)) {
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        checkObj(val);
      } else {
        totalFields++;
        if (val !== null && val !== false && val !== "") filledFields++;
      }
    }
  };
  checkObj(rulesJson);

  const ratio = totalFields > 0 ? filledFields / totalFields : 0;
  if (ratio > 0.5 && extractedText.length > 500) return "high";
  if (ratio > 0.25) return "medium";
  return "low";
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "brandrules.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen." }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Datei ist zu groß. Maximale Größe: 10 MB." }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isDocx = fileName.endsWith(".docx");
    const isPdf = fileName.endsWith(".pdf");

    if (!isDocx && !isPdf) {
      return NextResponse.json({ error: "Nur .pdf und .docx Dateien werden unterstützt." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = "";
    if (isDocx) {
      extractedText = extractTextFromDocx(buffer);
    } else if (isPdf) {
      extractedText = extractTextFromPdf(buffer);
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        { error: "Konnte keinen Text aus der Datei extrahieren. Bitte stellen Sie sicher, dass die Datei Text enthält und nicht nur Bilder." },
        { status: 422 }
      );
    }

    const truncatedText = extractedText.slice(0, 15000);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: STYLEGUIDE_SYSTEM_PROMPT },
        { role: "user", content: truncatedText },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096,
    });

    const aiContent = response.choices[0]?.message?.content || "{}";
    let parsedAi: Record<string, any>;
    try {
      parsedAi = JSON.parse(aiContent);
    } catch {
      return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden." }, { status: 500 });
    }

    const rulesJson = mapAiResponseToRulesJson(parsedAi);
    const confidence = assessConfidence(extractedText, rulesJson);

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const ruleSetName = name.trim() || `Style Guide Import – ${new Date().toLocaleDateString("de-DE")}`;

    const brandRuleSet = await prisma.brandRuleSet.create({
      data: {
        workspaceId: workspace.id,
        name: ruleSetName,
        rulesJson,
        status: "draft",
      },
    });

    return NextResponse.json({
      brandRuleSet,
      extractedText: extractedText.slice(0, 500),
      confidence,
    });
  } catch (err: any) {
    console.error("Style guide parsing error:", err);
    return NextResponse.json(
      { error: "Fehler bei der Verarbeitung des Style Guides." },
      { status: 500 }
    );
  }
}
