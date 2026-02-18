import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import OpenAI from "openai";

export const maxDuration = 120;

interface RouteContext {
  params: { workspaceSlug: string };
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const TEMPLATE_TYPES: Record<string, string> = {
  "verhaltensanker-bogen": "Verhaltensanker-Bogen (behavioral anchors with rating scale per competency)",
  "kompetenzmatrix": "Kompetenzmatrix (exercise × competency matrix with rating cells)",
  "freitext-bogen": "Freitext-Bogen (open-ended observation notes per competency/dimension)",
  "kombinierter-bogen": "Kombinierter Bogen (mix of anchors, ratings, and free text sections)",
};

const RATING_SCALES: Record<string, string> = {
  "1-5": "1 bis 5 (1=deutlich unter Anforderungen, 5=deutlich über Anforderungen)",
  "1-4": "1 bis 4 (1=nicht erfüllt, 4=übertrifft Anforderungen)",
  "1-7": "1 bis 7 (1=sehr schwach, 7=herausragend)",
  "a-e": "A bis E (A=herausragend, E=unzureichend)",
  "custom": "benutzerdefiniert",
};

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      type,
      ratingScale,
      competencies,
      exerciseNames,
      targetLevel,
      language,
      additionalInstructions,
    } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Name und Typ sind erforderlich" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const typeDescription = TEMPLATE_TYPES[type] || type;
    const scaleDescription = ratingScale ? (RATING_SCALES[ratingScale] || ratingScale) : "1-5 (Standard)";
    const competencyList = Array.isArray(competencies) && competencies.length > 0
      ? competencies.join(", ")
      : "allgemeine Führungskompetenzen (bitte passende vorschlagen)";
    const exerciseList = Array.isArray(exerciseNames) && exerciseNames.length > 0
      ? exerciseNames.join(", ")
      : null;

    const prompt = `Erstelle einen professionellen Beobachtungsbogen für ein Executive Assessment Center.

Spezifikationen:
- Bogentyp: ${typeDescription}
- Name: ${name}
- Bewertungsskala: ${scaleDescription}
- Kompetenzen: ${competencyList}
${exerciseList ? `- Zugeordnete Übungen: ${exerciseList}` : ""}
${targetLevel ? `- Zielniveau: ${targetLevel}` : ""}
${language ? `- Sprache: ${language}` : "- Sprache: Deutsch"}
${additionalInstructions ? `- Zusätzliche Hinweise: ${additionalInstructions}` : ""}

Antworte ausschließlich in validem JSON mit diesem Format:

{
  "title": "Titel des Beobachtungsbogens",
  "description": "Kurzbeschreibung (2-3 Sätze) des Bogens und seines Einsatzzwecks",
  "sections": [
    {
      "title": "Abschnittstitel (z.B. Kompetenzname oder Dimension)",
      "type": "anchors|matrix|freetext|mixed",
      "competency": "Zugehörige Kompetenz",
      "items": [
        {
          "label": "Verhaltensindikator oder Beobachtungskriterium",
          "type": "rating|text|checkbox",
          "anchors": ["Ankerbeispiel für niedrig", "Ankerbeispiel für mittel", "Ankerbeispiel für hoch"],
          "helpText": "Optionale Erläuterung für den Beobachter"
        }
      ]
    }
  ],
  "headerFields": ["Kandidat/in", "Übung", "Beobachter/in", "Datum"],
  "footerNote": "Abschließende Hinweise für den Beobachter",
  "tags": ["5-8 relevante Tags"],
  "suggestedCompetencies": ["Liste der verwendeten Kompetenzen"]
}

Regeln:
- Jede Kompetenz sollte 3-6 beobachtbare Verhaltensanker haben
- Verhaltensanker müssen konkret und beobachtbar sein (nicht bewertend)
- Bei Kompetenzmatrix: Erstelle ein Raster mit Übungen als Spalten und Kompetenzen als Zeilen
- Bei Freitext: Biete strukturierte Beobachtungsfelder mit Leitfragen
- Bei kombiniertem Bogen: Mix aus Ankern, Ratings und Freitext
- Sprache muss professionell und für erfahrene Beobachter geeignet sein`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Du bist ein Experte für Assessment Center Diagnostik und Beobachtungsbogen-Design. Du erstellst professionelle, praxistaugliche Beobachtungsbögen. Antworte ausschließlich in validem JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden." }, { status: 500 });
    }

    const sections = Array.isArray(parsed.sections) ? parsed.sections : [];

    const template = await prisma.observationSheetTemplate.create({
      data: {
        name: parsed.title || name,
        description: parsed.description || null,
        type,
        content: parsed,
        structuredData: sections,
        ratingScale: ratingScale || "1-5",
        competencyNames: parsed.suggestedCompetencies || (Array.isArray(competencies) ? competencies : []),
        exerciseIds: body.exerciseIds || [],
        competencyModelId: body.competencyModelId || null,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        targetLevels: targetLevel ? [targetLevel] : [],
        aiGenerated: true,
        workspaceId: workspace.id,
      },
    });

    return NextResponse.json({ ...template, generatedContent: parsed }, { status: 201 });
  } catch (error) {
    console.error("Observation sheet generation error:", error);
    return NextResponse.json({ error: "Generierung fehlgeschlagen" }, { status: 500 });
  }
}
