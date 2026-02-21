import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { generateLLMOutput, isAIDisabled, create503Response } from "@/server/llm/adapter";

interface RouteContext {
  params: { workspaceSlug: string };
}

interface RiskIndicator {
  category: string;
  score: number;
  explanation: string;
  contributingFactors: string[];
}

interface ScenarioResult {
  scenario: string;
  predictedBehavior: string;
  riskFlags: string[];
  compensatingStrengths: string[];
  confidence: number;
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

  const profiles = await prisma.predictiveProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(profiles);
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

  if (isAIDisabled("intelligence_predictive")) {
    const err = create503Response("intelligence_predictive");
    return NextResponse.json(err.body, { status: err.status });
  }

  try {
    const { assessmentId, candidateId, targetRole } = await req.json();

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
      include: { exercises: true },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const consolidatedScores = await prisma.consolidatedScore.findMany({
      where: { assessmentId, candidateId },
    });

    const observerRatings = await prisma.observerRating.findMany({
      where: { assessmentId, candidateId },
    });

    const competencyNodes = await prisma.competencyNode.findMany({
      where: {
        competencyModel: { workspaceId: workspace.id },
      },
    });

    const competencyMap = new Map(competencyNodes.map(n => [n.id, n.name]));

    const scoreVector: Record<string, number> = {};
    const varianceData: Record<string, number> = {};
    for (const score of consolidatedScores) {
      const name = competencyMap.get(score.competencyNodeId) || score.competencyNodeId;
      scoreVector[name] = score.normalizedValue ?? score.consolidatedValue;
      if (score.variance !== null) varianceData[name] = score.variance;
    }

    const evidenceCount = observerRatings.filter(r => r.evidenceNotes || r.evidenceStructured).length;
    const totalRatings = observerRatings.length;
    const evidenceDensity = totalRatings > 0 ? evidenceCount / totalRatings : 0;

    const exerciseInfo = assessment.exercises.map(e => ({
      name: e.name,
      type: e.type,
      difficulty: e.difficultyLevel || "standard",
    }));

    const aiPrompt = `Du bist ein Experte für Executive-Diagnostik und prädiktive Erfolgsanalyse.

Analysiere die folgenden Assessment-Daten und erstelle:
1. Risikoindikatoren (execution_risk, stakeholder_risk, resilience_risk, governance_risk, transformation_risk)
2. Szenario-Simulationen für die Zielrolle "${targetRole || "Executive Leadership"}"

KOMPETENZ-SCORES (normalisiert):
${JSON.stringify(scoreVector, null, 2)}

VARIANZ-DATEN:
${JSON.stringify(varianceData, null, 2)}

EVIDENZ-DICHTE: ${(evidenceDensity * 100).toFixed(1)}%

ÜBUNGEN:
${exerciseInfo.map(e => `- ${e.name} (${e.type}, Schwierigkeit: ${e.difficulty})`).join("\n")}

ANZAHL BEWERTUNGEN: ${totalRatings}

Antworte ausschließlich in validem JSON:
{
  "riskIndicators": [
    {
      "category": "execution_risk|stakeholder_risk|resilience_risk|governance_risk|transformation_risk",
      "score": 0-100,
      "explanation": "Erklärung",
      "contributingFactors": ["Faktor 1", "Faktor 2"]
    }
  ],
  "successScenarios": [
    {
      "scenario": "Krisenszenario|Wachstumsszenario|Stakeholder-Konfliktszenario|Transformationsszenario",
      "predictedBehavior": "Vorhergesagtes Verhaltensmuster",
      "riskFlags": ["Risikoflagge 1"],
      "compensatingStrengths": ["Kompensatorische Stärke 1"],
      "confidence": 0.0-1.0
    }
  ],
  "overallConfidence": 0.0-1.0,
  "evidenceCoverage": 0.0-1.0,
  "summary": "Zusammenfassende Einschätzung"
}

Wichtig:
- Jeder Risikoindikator muss genau einmal vorkommen (5 insgesamt)
- Erstelle genau 4 Szenarien
- Confidence basiert auf Datendichte und -konsistenz
- Alle Texte auf Deutsch
- Referenziere nur interne Daten, keine externen Quellen`;

    const result = await generateLLMOutput({
      featureName: "intelligence_predictive",
      taskName: "predictive_profile_generation",
      route: "/api/w/[slug]/intelligence/predictive",
      input: aiPrompt,
      options: {
        systemPrompt: "Du bist ein KI-Assistent für Executive-Diagnostik. Antworte nur in validem JSON.",
        responseFormat: "json",
        maxTokens: 4096,
      },
    });

    if ('aiDisabled' in result) {
      return NextResponse.json({ error: "AI temporarily disabled", feature: "intelligence_predictive" }, { status: 503 });
    }

    const parsed = typeof result.data === "string" ? JSON.parse(result.data) : result.data;

    const riskIndicators: RiskIndicator[] = (parsed.riskIndicators || []).map((r: any) => ({
      category: r.category || "unknown",
      score: Math.min(100, Math.max(0, r.score || 0)),
      explanation: r.explanation || "",
      contributingFactors: r.contributingFactors || [],
    }));

    const successScenarios: ScenarioResult[] = (parsed.successScenarios || []).map((s: any) => ({
      scenario: s.scenario || "",
      predictedBehavior: s.predictedBehavior || "",
      riskFlags: s.riskFlags || [],
      compensatingStrengths: s.compensatingStrengths || [],
      confidence: Math.min(1, Math.max(0, s.confidence || 0)),
    }));

    const profile = await prisma.predictiveProfile.create({
      data: {
        assessmentId,
        candidateId,
        workspaceId: workspace.id,
        normalizedScoreVector: scoreVector,
        riskIndicators: riskIndicators as any,
        successScenarios: { scenarios: successScenarios, summary: parsed.summary || "" } as any,
        confidenceScore: parsed.overallConfidence || 0,
        evidenceCoverage: parsed.evidenceCoverage || evidenceDensity,
      },
    });

    await logAudit({
      workspaceId: workspace.id,
      userId: session?.userId,
      action: "predictive_profile.generated",
      entityType: "PredictiveProfile",
      entityId: profile.id,
      details: { assessmentId, candidateId, confidenceScore: profile.confidenceScore },
    });

    return NextResponse.json({
      ...profile,
      _aiLabel: "KI-gestützte Analyse",
      _transparency: "Dieses prädiktive Profil wurde durch KI generiert und sollte durch menschliche Expertise validiert werden.",
    });
  } catch (error: any) {
    console.error("Predictive profile generation error:", error);
    return NextResponse.json({ error: "Fehler bei der Erstellung des prädiktiven Profils" }, { status: 500 });
  }
}
