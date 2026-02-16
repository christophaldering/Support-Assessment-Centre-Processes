import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface RouteContext {
  params: { workspaceSlug: string };
}

interface ProposedExercise {
  name: string;
  type: string;
  duration?: number;
  competencyMappings?: string[];
}

interface Competency {
  name: string;
  children?: { name: string }[];
}

interface Proposal {
  targetRole?: { level?: string; title?: string };
  competencies?: Competency[];
  exercises?: ProposedExercise[];
}

function computeFitScore(
  libraryItem: {
    exerciseType: string;
    targetLevels: string[];
    tags: string[];
    languagesAvailable: string[];
  },
  proposedTypes: string[],
  targetLevel: string | undefined,
  competencyNames: string[],
) {
  let score = 0;
  const details: string[] = [];

  const normalizedLibType = libraryItem.exerciseType.toLowerCase().trim();
  const typeMatch = proposedTypes.some(
    (t) => t.toLowerCase().trim() === normalizedLibType,
  );
  if (typeMatch) {
    score += 40;
    details.push(`Typ-Übereinstimmung: ${libraryItem.exerciseType}`);
  }

  if (targetLevel) {
    const normalizedLevel = targetLevel.toLowerCase().trim();
    const levelMatch = libraryItem.targetLevels.some(
      (l) => l.toLowerCase().trim() === normalizedLevel,
    );
    if (levelMatch) {
      score += 20;
      details.push(`Level-Übereinstimmung: ${targetLevel}`);
    }
  }

  const normalizedTags = libraryItem.tags.map((t) => t.toLowerCase().trim());
  const normalizedCompetencies = competencyNames.map((c) =>
    c.toLowerCase().trim(),
  );
  const overlapping = normalizedTags.filter((tag) =>
    normalizedCompetencies.includes(tag),
  );
  if (competencyNames.length > 0) {
    const ratio = overlapping.length / competencyNames.length;
    const tagPoints = Math.round(ratio * 30);
    score += tagPoints;
    if (overlapping.length > 0) {
      details.push(
        `Kompetenz-Abdeckung: ${overlapping.length}/${competencyNames.length}`,
      );
    }
  }

  const hasDE = libraryItem.languagesAvailable.some(
    (l) => l.toUpperCase() === "DE",
  );
  if (hasDE) {
    score += 10;
    details.push("Sprache: DE verfügbar");
  }

  return { score, rationale: details.join(", ") || "Keine Übereinstimmung" };
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    session &&
    !master &&
    !hasPermission(session.roles, "requirements.match_exercises")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { requirementsAnalysisId } = body;

    if (!requirementsAnalysisId) {
      return NextResponse.json(
        { error: "requirementsAnalysisId ist erforderlich" },
        { status: 400 },
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    const analysis = await prisma.requirementsAnalysis.findFirst({
      where: {
        id: requirementsAnalysisId,
        workspaceId: workspace.id,
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Requirements analysis not found" },
        { status: 404 },
      );
    }

    const proposal = (analysis.proposal as Proposal) || {};
    const targetLevel = proposal.targetRole?.level;
    const competencies = proposal.competencies || [];
    const proposedExercises = proposal.exercises || [];

    const competencyNames: string[] = [];
    for (const comp of competencies) {
      competencyNames.push(comp.name);
      if (comp.children) {
        for (const child of comp.children) {
          competencyNames.push(child.name);
        }
      }
    }

    const proposedTypes = proposedExercises.map((e) => e.type);

    const allCompetencyMappings = proposedExercises.flatMap(
      (e) => e.competencyMappings || [],
    );
    const allMatchNames = [
      ...new Set([...competencyNames, ...allCompetencyMappings]),
    ];

    const libraryItems = await prisma.exerciseLibraryItem.findMany({
      where: { workspaceId: workspace.id },
      include: { variants: true },
    });

    const useAsIs: {
      libraryItemId: string;
      title: string;
      fitScore: number;
      rationale: string;
    }[] = [];
    const adapt: {
      libraryItemId: string;
      title: string;
      fitScore: number;
      rationale: string;
      suggestedChanges: string;
    }[] = [];

    const matchedProposedTypes = new Set<string>();

    for (const item of libraryItems) {
      const { score, rationale } = computeFitScore(
        item,
        proposedTypes,
        targetLevel,
        allMatchNames,
      );

      if (score >= 70) {
        useAsIs.push({
          libraryItemId: item.id,
          title: item.title,
          fitScore: score,
          rationale,
        });
        const normalizedLibType = item.exerciseType.toLowerCase().trim();
        for (const pt of proposedTypes) {
          if (pt.toLowerCase().trim() === normalizedLibType) {
            matchedProposedTypes.add(pt);
          }
        }
      } else if (score >= 40) {
        const changes: string[] = [];
        const normalizedLibType = item.exerciseType.toLowerCase().trim();
        const typeMatch = proposedTypes.some(
          (t) => t.toLowerCase().trim() === normalizedLibType,
        );
        if (!typeMatch) changes.push("Übungstyp anpassen");
        if (
          targetLevel &&
          !item.targetLevels.some(
            (l) => l.toLowerCase().trim() === targetLevel.toLowerCase().trim(),
          )
        ) {
          changes.push("Ziellevel anpassen");
        }
        const hasDE = item.languagesAvailable.some(
          (l) => l.toUpperCase() === "DE",
        );
        if (!hasDE) changes.push("Deutsche Version erstellen");

        adapt.push({
          libraryItemId: item.id,
          title: item.title,
          fitScore: score,
          rationale,
          suggestedChanges:
            changes.join(", ") || "Inhalte an Anforderungen anpassen",
        });
        const normalizedLibType2 = item.exerciseType.toLowerCase().trim();
        for (const pt of proposedTypes) {
          if (pt.toLowerCase().trim() === normalizedLibType2) {
            matchedProposedTypes.add(pt);
          }
        }
      }
    }

    const createNew: {
      proposedExerciseSpec: ProposedExercise;
      rationale: string;
      fitScore: number;
    }[] = [];

    for (const pe of proposedExercises) {
      const hasMatch = libraryItems.some((item) => {
        const { score } = computeFitScore(
          item,
          [pe.type],
          targetLevel,
          pe.competencyMappings || [],
        );
        return score >= 40;
      });

      if (!hasMatch) {
        createNew.push({
          proposedExerciseSpec: pe,
          rationale: `Keine passende Übung in der Bibliothek gefunden für: ${pe.name} (${pe.type})`,
          fitScore: 0,
        });
      }
    }

    useAsIs.sort((a, b) => b.fitScore - a.fitScore);
    adapt.sort((a, b) => b.fitScore - a.fitScore);

    const enhance = req.nextUrl.searchParams.get("enhance") === "true";
    let aiEnhanced = false;

    if (enhance) {
      try {
        const allScoredItems = [
          ...useAsIs.map((item) => ({ ...item, category: "use_as_is" })),
          ...adapt.map((item) => ({ ...item, category: "adapt" })),
        ];

        const prompt = `Du bist ein Experte für Executive Assessment Center Design.

Gegeben:
- Anforderungsprofil: Zielrolle: ${proposal.targetRole?.title || "unbekannt"} (Level: ${proposal.targetRole?.level || "unbekannt"})
- Kompetenzen: ${competencyNames.join(", ")}
- Vorgeschlagene Übungen: ${proposedExercises.map((e) => `${e.name} (${e.type})`).join(", ")}
- Bibliotheks-Übungen mit Basis-Scores: ${JSON.stringify(allScoredItems.map((item) => ({ id: item.libraryItemId, title: item.title, fitScore: item.fitScore, category: item.category, rationale: item.rationale })))}
- Lücken (keine passende Übung): ${JSON.stringify(createNew.map((item) => ({ name: item.proposedExerciseSpec.name, type: item.proposedExerciseSpec.type, competencyMappings: item.proposedExerciseSpec.competencyMappings })))}

Erstelle für jedes Element eine detaillierte Analyse:

Antworte in validem JSON:
{
  "enhanced": [
    {
      "libraryItemId": "id",
      "aiRationale": "Detaillierte Begründung auf Deutsch",
      "aiSuggestedChanges": "Konkrete Anpassungsvorschläge (nur für adapt-Items)",
      "contextualFitNotes": "Kontextuelle Passung zum Anforderungsprofil"
    }
  ],
  "newExerciseSpecs": [
    {
      "name": "Vorgeschlagener Name",
      "type": "exercise type",
      "duration": 30,
      "description": "Detaillierte Beschreibung",
      "instructions": "Durchführungshinweise",
      "competencyMappings": ["mapped competencies"],
      "rationale": "Warum diese Übung benötigt wird"
    }
  ]
}`;

        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: "Bitte erstelle die detaillierte Analyse." },
          ],
          response_format: { type: "json_object" },
          max_tokens: 4096,
        });

        const aiContent = aiResponse.choices[0]?.message?.content || "{}";
        const aiData = JSON.parse(aiContent) as {
          enhanced?: {
            libraryItemId: string;
            aiRationale?: string;
            aiSuggestedChanges?: string;
            contextualFitNotes?: string;
          }[];
          newExerciseSpecs?: {
            name: string;
            type: string;
            duration?: number;
            description?: string;
            instructions?: string;
            competencyMappings?: string[];
            rationale?: string;
          }[];
        };

        if (aiData.enhanced) {
          const enhancedMap = new Map(
            aiData.enhanced.map((e) => [e.libraryItemId, e]),
          );

          for (const item of useAsIs) {
            const enhancement = enhancedMap.get(item.libraryItemId);
            if (enhancement) {
              (item as any).aiRationale = enhancement.aiRationale || "";
              (item as any).contextualFitNotes = enhancement.contextualFitNotes || "";
            }
          }

          for (const item of adapt) {
            const enhancement = enhancedMap.get(item.libraryItemId);
            if (enhancement) {
              (item as any).aiRationale = enhancement.aiRationale || "";
              (item as any).aiSuggestedChanges = enhancement.aiSuggestedChanges || "";
              (item as any).contextualFitNotes = enhancement.contextualFitNotes || "";
            }
          }
        }

        if (aiData.newExerciseSpecs && aiData.newExerciseSpecs.length > 0) {
          for (let i = 0; i < createNew.length && i < aiData.newExerciseSpecs.length; i++) {
            const spec = aiData.newExerciseSpecs[i];
            (createNew[i] as any).aiSpec = spec;
          }
        }

        aiEnhanced = true;
      } catch (aiError) {
        console.error("AI enhancement failed, falling back to basic recommendations:", aiError);
      }
    }

    const recommendationsJson = {
      use_as_is: useAsIs,
      adapt,
      create_new: createNew,
    };

    const recommendation = await prisma.exerciseRecommendation.create({
      data: {
        requirementsAnalysisId,
        workspaceId: workspace.id,
        recommendationsJson,
        status: "draft",
      },
    });

    return NextResponse.json(
      {
        id: recommendation.id,
        recommendationsJson,
        aiEnhanced,
        status: recommendation.status,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
