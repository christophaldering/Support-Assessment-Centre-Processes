import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { generateLLMOutput, isAIDisabled, create503Response } from "@/server/llm/adapter";

interface RouteContext {
  params: { workspaceSlug: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "advanced_intelligence.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");
  const candidateId = searchParams.get("candidateId");

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const where: Record<string, string> = { workspaceId: workspace.id };
  if (assessmentId) where.assessmentId = assessmentId;
  if (candidateId) where.candidateId = candidateId;

  const blueprints = await prisma.developmentBlueprint.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(blueprints);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "advanced_intelligence.generate")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isAIDisabled("intelligence_development")) {
    const err = create503Response("intelligence_development");
    return NextResponse.json(err.body, { status: err.status });
  }

  try {
    const { assessmentId, candidateId, targetRole, viewType } = await req.json();

    if (!assessmentId || !candidateId) {
      return NextResponse.json({ error: "assessmentId und candidateId sind erforderlich" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, workspaceId: workspace.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const consolidatedScores = await prisma.consolidatedScore.findMany({
      where: { assessmentId, candidateId },
    });

    const competencyNodes = await prisma.competencyNode.findMany({
      where: { competencyModel: { workspaceId: workspace.id } },
    });

    const competencyMap = new Map(competencyNodes.map(n => [n.id, { name: n.name, description: n.description }]));

    const scoreDetails = consolidatedScores.map(s => {
      const comp = competencyMap.get(s.competencyNodeId);
      return {
        competency: comp?.name || s.competencyNodeId,
        description: comp?.description || "",
        score: s.normalizedValue ?? s.consolidatedValue,
        variance: s.variance,
        outlier: s.outlierFlag,
        overridden: s.moderatorOverride !== null,
      };
    });

    const predictiveProfile = await prisma.predictiveProfile.findFirst({
      where: { assessmentId, candidateId, workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    });

    const aiPrompt = `Du bist ein Experte für Executive Development und Coaching-Architektur.

Erstelle einen umfassenden Entwicklungsplan basierend auf den Assessment-Ergebnissen.

ASSESSMENT: ${assessment.name}
ZIELROLLE: ${targetRole || "Executive Leadership"}

KOMPETENZ-BEWERTUNGEN:
${scoreDetails.map(s => `- ${s.competency}: ${s.score?.toFixed(2) || "k.A."} (Varianz: ${s.variance?.toFixed(2) || "k.A."}${s.outlier ? ", Ausreißer" : ""}${s.overridden ? ", moderiert" : ""})`).join("\n")}

${predictiveProfile ? `RISIKOINDIKATOREN (aus prädiktiver Analyse):
${JSON.stringify(predictiveProfile.riskIndicators, null, 2)}` : ""}

Antworte ausschließlich in validem JSON:
{
  "focusAreas90d": [
    {
      "area": "Fokusbereich",
      "priority": "hoch|mittel|niedrig",
      "currentState": "Aktuelle Einschätzung",
      "targetBehavior": "Zielverhalten in 90 Tagen",
      "actions": ["Konkrete Maßnahme 1", "Maßnahme 2"],
      "ifUnaddressedRisk": "Risiko bei Nichtbearbeitung"
    }
  ],
  "growthTargets6m": [
    {
      "target": "Wachstumsziel",
      "measurableShift": "Messbarer Verhaltensindikator",
      "milestones": ["Meilenstein 1", "Meilenstein 2"],
      "supportNeeded": "Benötigte Unterstützung"
    }
  ],
  "positioningGoals12m": [
    {
      "goal": "Positionierungsziel",
      "strategicRationale": "Strategische Begründung",
      "successIndicators": ["Erfolgskennzahl 1"]
    }
  ],
  "coachingQuestions": [
    {
      "theme": "Thema",
      "question": "Coaching-Frage",
      "purpose": "Zweck der Frage"
    }
  ],
  "suggestedInterventions": [
    {
      "type": "coaching|training|mentoring|shadowing|project_assignment|360_feedback",
      "title": "Maßnahme",
      "description": "Beschreibung",
      "duration": "Zeitrahmen",
      "priority": "hoch|mittel|niedrig"
    }
  ],
  "riskMitigationSteps": [
    {
      "risk": "Identifiziertes Risiko",
      "mitigationAction": "Gegenmaßnahme",
      "timeline": "Zeitplan",
      "owner": "Verantwortlich (HR/Coaching/Kandidat/Führungskraft)"
    }
  ],
  "confidenceScore": 0.0-1.0,
  "summary": "Zusammenfassung des Entwicklungsplans"
}

Wichtig:
- 3-5 Fokusfelder für 90 Tage
- 3-4 Wachstumsziele für 6 Monate
- 2-3 Positionierungsziele für 12 Monate
- 5-8 Coaching-Fragen
- 4-6 Interventionsvorschläge
- 2-4 Risikominderungsschritte
- Alle Texte auf Deutsch
- Basiere Empfehlungen NUR auf den vorhandenen Daten`;

    const result = await generateLLMOutput({
      featureName: "intelligence_development",
      taskName: "development_blueprint_generation",
      route: "/api/w/[slug]/intelligence/development",
      input: aiPrompt,
      options: {
        systemPrompt: "Du bist ein KI-Assistent für Executive Development. Antworte nur in validem JSON.",
        responseFormat: "json",
        maxTokens: 4096,
      },
    });

    if ('aiDisabled' in result) {
      return NextResponse.json({ error: "AI temporarily disabled", feature: "intelligence_development" }, { status: 503 });
    }

    const parsed = typeof result.data === "string" ? JSON.parse(result.data) : result.data;

    const blueprint = await prisma.developmentBlueprint.create({
      data: {
        assessmentId,
        candidateId,
        workspaceId: workspace.id,
        focusAreas90d: parsed.focusAreas90d || [],
        growthTargets6m: parsed.growthTargets6m || [],
        positioningGoals12m: parsed.positioningGoals12m || [],
        coachingQuestions: parsed.coachingQuestions || [],
        suggestedInterventions: parsed.suggestedInterventions || [],
        riskMitigationSteps: parsed.riskMitigationSteps || [],
        confidenceScore: parsed.confidenceScore || 0,
      },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId: session?.userId,
      action: "development_blueprint.generated",
      entityType: "DevelopmentBlueprint",
      entityId: blueprint.id,
      details: { assessmentId, candidateId, viewType: viewType || "full" },
    });

    return NextResponse.json({
      ...blueprint,
      summary: parsed.summary || "",
      _aiLabel: "KI-gestützte Analyse",
      _transparency: "Dieser Entwicklungsplan wurde durch KI generiert und sollte durch Coaching-Experten validiert werden.",
    });
  } catch (error: any) {
    console.error("Development blueprint generation error:", error);
    return NextResponse.json({ error: "Fehler bei der Erstellung des Entwicklungsplans" }, { status: 500 });
  }
}
