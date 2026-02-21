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

  const hypotheses = await prisma.diagnosticHypothesis.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(hypotheses);
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

  if (isAIDisabled("intelligence_hypotheses")) {
    const err = create503Response("intelligence_hypotheses");
    return NextResponse.json(err.body, { status: err.status });
  }

  try {
    const { assessmentId, candidateId } = await req.json();

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
      where: { competencyModel: { workspaceId: workspace.id } },
    });

    const competencyMap = new Map(competencyNodes.map(n => [n.id, n.name]));

    const scoreDetails = consolidatedScores.map(s => ({
      competency: competencyMap.get(s.competencyNodeId) || s.competencyNodeId,
      score: s.normalizedValue ?? s.consolidatedValue,
      variance: s.variance,
      outlier: s.outlierFlag,
      overridden: s.moderatorOverride !== null,
      overrideReason: s.overrideReason,
      method: s.method,
      raterCount: s.raterCount,
    }));

    const exerciseRatings: Record<string, any[]> = {};
    for (const rating of observerRatings) {
      const exerciseName = assessment.exercises.find(e => e.id === rating.exerciseId)?.name || rating.exerciseId;
      if (!exerciseRatings[exerciseName]) exerciseRatings[exerciseName] = [];
      exerciseRatings[exerciseName].push({
        competency: competencyMap.get(rating.competencyNodeId) || rating.competencyNodeId,
        rating: rating.rating,
        hasEvidence: !!(rating.evidenceNotes || rating.evidenceStructured),
      });
    }

    const evidenceNotes = observerRatings
      .filter(r => r.evidenceNotes)
      .slice(0, 20)
      .map(r => ({
        competency: competencyMap.get(r.competencyNodeId) || r.competencyNodeId,
        exercise: assessment.exercises.find(e => e.id === r.exerciseId)?.name || r.exerciseId,
        note: (r.evidenceNotes || "").substring(0, 200),
      }));

    const aiPrompt = `Du bist ein Experte für diagnostische Urteilsbildung in Executive Assessments.

Analysiere die folgenden Daten und generiere strukturierte diagnostische Hypothesen.

ASSESSMENT: ${assessment.name}

KONSOLIDIERTE KOMPETENZ-SCORES:
${scoreDetails.map(s => `- ${s.competency}: ${s.score?.toFixed(2) || "k.A."} (Varianz: ${s.variance?.toFixed(2) || "k.A."}, Bewerter: ${s.raterCount}${s.outlier ? ", AUSREISSER" : ""}${s.overridden ? `, Moderiert: ${s.overrideReason || "ohne Begründung"}` : ""})`).join("\n")}

BEWERTUNGEN PRO ÜBUNG:
${Object.entries(exerciseRatings).map(([ex, ratings]) => `${ex}:\n${ratings.map(r => `  - ${r.competency}: ${r.rating ?? "k.A."} (Evidenz: ${r.hasEvidence ? "ja" : "nein"})`).join("\n")}`).join("\n\n")}

EVIDENZ-NOTIZEN (Auszug):
${evidenceNotes.map(e => `- [${e.exercise}/${e.competency}]: "${e.note}"`).join("\n")}

Antworte ausschließlich in validem JSON:
{
  "hypotheses": [
    {
      "hypothesisText": "Primärhypothese - klare Aussage über ein Kernbefund",
      "alternativeText": "Alternative Interpretation desselben Befundes",
      "supportingEvidence": [
        {
          "type": "score|rating|evidence_note|pattern|variance",
          "reference": "Konkreter Verweis auf Datenpunkt",
          "strength": "stark|mittel|schwach"
        }
      ],
      "counterEvidence": [
        {
          "type": "score|rating|evidence_note|pattern|variance",
          "reference": "Verweis auf widersprüchlichen Datenpunkt",
          "weight": "erheblich|moderat|gering"
        }
      ],
      "requiredValidation": [
        {
          "method": "interview|reference_check|360_feedback|simulation|observation",
          "question": "Konkrete Validierungsfrage",
          "rationale": "Warum diese Validierung nötig ist"
        }
      ],
      "confidenceScore": 0.0-1.0,
      "evidenceCoverage": 0.0-1.0
    }
  ],
  "overallSummary": "Zusammenfassende diagnostische Einschätzung"
}

Wichtig:
- Generiere 3-6 Hypothesen zu den wichtigsten Befunden
- Jede Hypothese MUSS eine alternative Interpretation haben
- Unterstützende und widerlegende Evidenz müssen auf KONKRETE Datenpunkte verweisen
- Confidence basiert auf Evidenzdichte und -konsistenz
- Erstelle KEINE hypothetischen externen Daten
- Alle Texte auf Deutsch`;

    const result = await generateLLMOutput({
      featureName: "intelligence_hypotheses",
      taskName: "diagnostic_hypotheses_generation",
      route: "/api/w/[slug]/intelligence/hypotheses",
      input: aiPrompt,
      options: {
        systemPrompt: "Du bist ein KI-Assistent für diagnostische Urteilsbildung. Antworte nur in validem JSON.",
        responseFormat: "json",
        maxTokens: 4096,
      },
    });

    if ('aiDisabled' in result) {
      return NextResponse.json({ error: "AI temporarily disabled", feature: "intelligence_hypotheses" }, { status: 503 });
    }

    const parsed = typeof result.data === "string" ? JSON.parse(result.data) : result.data;

    const hypothesesData = parsed.hypotheses || [];
    const createdHypotheses = [];

    for (const h of hypothesesData) {
      const hypothesis = await prisma.diagnosticHypothesis.create({
        data: {
          assessmentId,
          candidateId,
          workspaceId: workspace.id,
          hypothesisText: h.hypothesisText || "",
          alternativeText: h.alternativeText || null,
          supportingEvidence: h.supportingEvidence || [],
          counterEvidence: h.counterEvidence || [],
          requiredValidation: h.requiredValidation || [],
          confidenceScore: Math.min(1, Math.max(0, h.confidenceScore || 0)),
          evidenceCoverage: Math.min(1, Math.max(0, h.evidenceCoverage || 0)),
        },
      });
      createdHypotheses.push(hypothesis);
    }

    await logAudit({
      workspaceId: workspace.id,
      userId: session?.userId,
      action: "diagnostic_hypotheses.generated",
      entityType: "DiagnosticHypothesis",
      entityId: createdHypotheses[0]?.id,
      details: { assessmentId, candidateId, count: createdHypotheses.length },
    });

    return NextResponse.json({
      hypotheses: createdHypotheses,
      summary: parsed.overallSummary || "",
      _aiLabel: "KI-gestützte Analyse",
      _transparency: "Diese diagnostischen Hypothesen wurden durch KI generiert und ersetzen nicht das menschliche Urteil.",
    });
  } catch (error: any) {
    console.error("Hypothesis generation error:", error);
    return NextResponse.json({ error: "Fehler bei der Hypothesengenerierung" }, { status: 500 });
  }
}
