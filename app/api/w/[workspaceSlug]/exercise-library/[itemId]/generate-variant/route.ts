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
  params: { workspaceSlug: string; itemId: string };
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
    const { language = "DE", brandRuleSetId } = await req.json();

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const item = await prisma.exerciseLibraryItem.findFirst({
      where: { id: params.itemId, workspaceId: workspace.id },
      include: {
        variants: {
          where: { variantType: "original" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Übungselement nicht gefunden" }, { status: 404 });
    }

    let brandRuleSet;
    if (brandRuleSetId) {
      brandRuleSet = await prisma.brandRuleSet.findFirst({
        where: { id: brandRuleSetId, workspaceId: workspace.id },
      });
    } else {
      brandRuleSet = await prisma.brandRuleSet.findFirst({
        where: { workspaceId: workspace.id, status: "active" },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!brandRuleSet) {
      return NextResponse.json({ error: "Keine aktiven Markenregeln gefunden" }, { status: 400 });
    }

    const rules = brandRuleSet.rulesJson as any;
    const originalContent = item.variants?.[0]?.contentJson;

    const systemPrompt = `Du bist ein Experte für Assessment-Center-Übungen und Corporate Design Adaption.

Aufgabe: Passe die folgende Assessment-Übung an die Corporate-Design-Richtlinien an.

Übungsinformationen:
- Titel: ${item.title}
- Typ: ${item.exerciseType}
- Tags: ${item.tags.join(", ")}
- Ziel-Ebenen: ${item.targetLevels.join(", ")}
- Vorhandener Inhalt: ${originalContent ? JSON.stringify(originalContent) : JSON.stringify(item.metadataJson || {})}

Corporate Design Regeln:
- Farben: ${JSON.stringify(rules?.colors || rules?.primaryColor || {})}
- Typografie: ${JSON.stringify(rules?.typography || rules?.fontFamily || {})}
- Tonalität: ${JSON.stringify(rules?.toneOfVoice || rules?.tone || "")}
- Dokumentregeln: ${JSON.stringify(rules?.documentRules || rules?.layout || {})}

Erstelle eine CD-angepasste Version mit folgendem JSON-Format:
{
  "adaptedTitle": "Angepasster Titel",
  "adaptedInstructions": "Angepasste Anweisungen im Stil der Marke",
  "adaptedContent": {
    "scenario": "Angepasstes Szenario (falls zutreffend)",
    "tasks": ["Aufgabe 1", "Aufgabe 2"],
    "evaluationCriteria": ["Kriterium 1", "Kriterium 2"],
    "materials": ["Benötigtes Material"],
    "timing": { "preparation": 10, "execution": 30, "debriefing": 10 }
  },
  "designNotes": {
    "colorUsage": "Wie Markenfarben in Materialien eingesetzt werden sollen",
    "typographyNotes": "Welche Schriften für welche Elemente",
    "toneAdaptation": "Wie die Tonalität angepasst wurde",
    "brandingElements": "Wo Logo und Markenelemente platziert werden"
  },
  "changeLog": ["Änderung 1", "Änderung 2"]
}

Antworte ausschließlich in validem JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Bitte passe die Übung "${item.title}" an das Corporate Design an. Sprache: ${language}` },
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

    const existingVariantCount = await prisma.exerciseLibraryVariant.count({
      where: { libraryItemId: params.itemId },
    });

    const variant = await prisma.exerciseLibraryVariant.create({
      data: {
        libraryItemId: params.itemId,
        variantType: "cd_adapted",
        brandRuleSetId: brandRuleSet.id,
        language,
        version: `${existingVariantCount + 1}.0`,
        contentJson: parsedContent,
        analysisJson: {
          brandRuleSetId: brandRuleSet.id,
          generatedAt: new Date().toISOString(),
          model: "gpt-4o",
        },
      },
    });

    return NextResponse.json({
      variant,
      item: { id: item.id, title: item.title, exerciseType: item.exerciseType, tags: item.tags, targetLevels: item.targetLevels },
      changeLog: parsedContent.changeLog || [],
    });
  } catch (err) {
    console.error("Generate variant error:", err);
    return NextResponse.json({ error: "Fehler bei der Varianten-Generierung" }, { status: 500 });
  }
}
