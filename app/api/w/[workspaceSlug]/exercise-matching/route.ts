import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";

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
        status: recommendation.status,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
