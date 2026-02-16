import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasAnyPermission } from "@/lib/rbac";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface RouteContext {
  params: { workspaceSlug: string };
}

interface ExerciseSpec {
  name: string;
  type: string;
  duration: number;
  competencyMappings: string[];
  targetLevel: string;
  description: string;
  context?: string;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasAnyPermission(session.roles, ["exerciselibrary.upload", "exerciselibrary.manage"])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { spec, language = "DE", brandRuleSetId } = await req.json();

    if (!spec || !spec.name || !spec.type) {
      return NextResponse.json({ error: "Spezifikation mit mindestens 'name' und 'type' ist erforderlich" }, { status: 400 });
    }

    const exerciseSpec: ExerciseSpec = {
      name: spec.name,
      type: spec.type,
      duration: spec.duration || 30,
      competencyMappings: Array.isArray(spec.competencyMappings) ? spec.competencyMappings : (typeof spec.competencyMappings === "string" ? spec.competencyMappings.split(",").map((s: string) => s.trim()).filter(Boolean) : []),
      targetLevel: spec.targetLevel || "C-Level",
      description: spec.description || "",
      context: spec.context || "",
    };

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    let brandRules: any = null;
    if (brandRuleSetId) {
      const brandRuleSet = await prisma.brandRuleSet.findFirst({
        where: { id: brandRuleSetId, workspaceId: workspace.id },
      });
      if (brandRuleSet) {
        brandRules = brandRuleSet.rulesJson as any;
      }
    }

    const systemPrompt = `Du bist ein Experte für die Erstellung von Assessment-Center-Übungen auf Executive-Level.

Erstelle eine vollständige, einsatzbereite Assessment-Übung basierend auf den folgenden Spezifikationen.

Spezifikationen:
- Name: ${exerciseSpec.name}
- Typ: ${exerciseSpec.type}
- Dauer: ${exerciseSpec.duration} Minuten
- Ziel-Ebene: ${exerciseSpec.targetLevel}
- Zu messende Kompetenzen: ${exerciseSpec.competencyMappings.join(", ")}
- Beschreibung: ${exerciseSpec.description}
- Kontext: ${exerciseSpec.context}
${brandRules ? `\nCorporate Design Regeln:\n- Farben: ${JSON.stringify(brandRules.colors)}\n- Typografie: ${JSON.stringify(brandRules.typography)}\n- Tonalität: ${JSON.stringify(brandRules.toneOfVoice)}` : ""}

Antworte in validem JSON:
{
  "title": "Vollständiger Übungstitel",
  "exerciseType": "type",
  "scenario": "Detailliertes Szenario (mindestens 200 Wörter)",
  "instructions": {
    "forCandidates": "Anweisungen für Kandidaten",
    "forObservers": "Anweisungen für Beobachter",
    "forModerators": "Anweisungen für Moderatoren"
  },
  "materials": ["Material 1", "Material 2"],
  "tasks": [
    { "name": "Aufgabe 1", "description": "...", "duration": 10 }
  ],
  "evaluationCriteria": [
    { "competency": "Kompetenzname", "indicators": ["Indikator 1", "Indikator 2"], "ratingScale": "1-5" }
  ],
  "timing": {
    "preparation": 10,
    "execution": 30,
    "debriefing": 10,
    "total": 50
  },
  "difficultyLevel": "standard|erhöht|hoch",
  "tags": ["tag1", "tag2"],
  "designNotes": "Hinweise zur visuellen Gestaltung"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Erstelle die Assessment-Übung "${exerciseSpec.name}" in der Sprache: ${language}` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096,
    });

    const aiContent = response.choices[0]?.message?.content || "{}";
    let parsedContent;
    try {
      parsedContent = JSON.parse(aiContent);
    } catch {
      return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden. Bitte erneut versuchen." }, { status: 502 });
    }

    const item = await prisma.exerciseLibraryItem.create({
      data: {
        workspaceId: workspace.id,
        title: parsedContent.title || exerciseSpec.name,
        exerciseType: parsedContent.exerciseType || exerciseSpec.type,
        tags: parsedContent.tags || [],
        targetLevels: [exerciseSpec.targetLevel],
        languagesAvailable: [language],
        metadataJson: parsedContent,
        qualityStatus: "draft",
      },
    });

    const variant = await prisma.exerciseLibraryVariant.create({
      data: {
        libraryItemId: item.id,
        variantType: "ai_generated_new",
        language,
        version: "1.0",
        contentJson: parsedContent,
        analysisJson: {
          generatedFrom: "automation",
          model: "gpt-4o",
          spec: exerciseSpec as any,
        } as any,
      },
    });

    return NextResponse.json({
      item,
      variant,
      generatedContent: parsedContent,
    }, { status: 201 });
  } catch (err) {
    console.error("Generate exercise error:", err);
    return NextResponse.json({ error: "Fehler bei der Übungsgenerierung" }, { status: 500 });
  }
}
