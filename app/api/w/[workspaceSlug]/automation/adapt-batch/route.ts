import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { generateLLMOutput, isAIDisabled, create503Response } from "@/server/llm/adapter";

interface RouteContext {
  params: { workspaceSlug: string };
}

interface BatchResult {
  itemId: string;
  status: "success" | "error";
  variantId?: string;
  title?: string;
  error?: string;
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

  if (isAIDisabled("exercise_generation")) {
    const err = create503Response("exercise_generation");
    return NextResponse.json(err.body, { status: err.status });
  }

  try {
    const { exerciseItemIds, brandRuleSetId, language = "DE" } = await req.json();

    if (!exerciseItemIds || !Array.isArray(exerciseItemIds) || exerciseItemIds.length === 0) {
      return NextResponse.json({ error: "exerciseItemIds ist erforderlich und muss ein nicht-leeres Array sein" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
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
    const results: BatchResult[] = [];

    for (const itemId of exerciseItemIds) {
      try {
        const item = await prisma.exerciseLibraryItem.findFirst({
          where: { id: itemId, workspaceId: workspace.id },
          include: {
            variants: {
              where: { variantType: "original" },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });

        if (!item) {
          results.push({ itemId, status: "error", error: "Übungselement nicht gefunden" });
          continue;
        }

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

        const result = await generateLLMOutput({
          featureName: "exercise_generation",
          taskName: "adapt_batch",
          route: "/api/w/[workspaceSlug]/automation/adapt-batch",
          input: `Bitte passe die Übung "${item.title}" an das Corporate Design an. Sprache: ${language}`,
          options: {
            systemPrompt,
            responseFormat: "json",
            maxTokens: 4096,
          },
        });

        if ('aiDisabled' in result) {
          results.push({ itemId, status: "error", error: "AI temporarily disabled" });
          continue;
        }

        let parsedContent: any;
        if (typeof result.data === "string") {
          try {
            parsedContent = JSON.parse(result.data);
          } catch {
            results.push({ itemId, status: "error", error: "KI-Antwort konnte nicht verarbeitet werden" });
            continue;
          }
        } else {
          parsedContent = result.data;
        }

        const existingVariantCount = await prisma.exerciseLibraryVariant.count({
          where: { libraryItemId: itemId },
        });

        const variant = await prisma.exerciseLibraryVariant.create({
          data: {
            libraryItemId: itemId,
            variantType: "cd_adapted",
            brandRuleSetId: brandRuleSet.id,
            language,
            version: `${existingVariantCount + 1}.0`,
            contentJson: parsedContent,
            analysisJson: {
              brandRuleSetId: brandRuleSet.id,
              generatedAt: new Date().toISOString(),
              model: result.model,
              batchGenerated: true,
            },
          },
        });

        results.push({
          itemId,
          status: "success",
          variantId: variant.id,
          title: parsedContent.adaptedTitle || item.title,
        });
      } catch (itemErr: any) {
        console.error(`Batch adapt error for item ${itemId}:`, itemErr);
        results.push({
          itemId,
          status: "error",
          error: itemErr?.message || "Unbekannter Fehler bei der Verarbeitung",
        });
      }
    }

    const succeeded = results.filter((r) => r.status === "success").length;
    const failed = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      total: exerciseItemIds.length,
      succeeded,
      failed,
      results,
      brandRuleSetName: brandRuleSet.name,
      processedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Batch adapt error:", err);
    return NextResponse.json({ error: "Fehler bei der Batch-Verarbeitung" }, { status: 500 });
  }
}
