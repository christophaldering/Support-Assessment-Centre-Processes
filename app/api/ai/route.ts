import { NextRequest, NextResponse } from "next/server";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { coCreationQuestion } from "@/lib/ai";
import { checkConsent, checkFeatureEnabled } from "@/lib/consent";
import { logUsageEvent } from "@/lib/telemetry";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const MODEL = "gpt-4o";

async function resolveWorkspace(workspaceSlug?: string) {
  if (!workspaceSlug) return null;
  return prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
}

export async function POST(req: NextRequest) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!session && !master) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, workspaceSlug } = body;

    if (!action) {
      return NextResponse.json({ error: "Aktion ist erforderlich" }, { status: 400 });
    }

    const workspace = await resolveWorkspace(workspaceSlug || session?.workspaceSlug);
    const workspaceId = workspace?.id || "unknown";

    if (workspace && !workspace.aiEnabled && action !== "co_creation_question") {
      return NextResponse.json({ error: "KI ist für diesen Workspace nicht aktiviert." }, { status: 403 });
    }

    if (workspace && session?.userId) {
      const featureEnabled = await checkFeatureEnabled(workspace.id, "ai_processing");
      if (!featureEnabled) {
        return NextResponse.json({ error: "KI-Verarbeitung ist deaktiviert." }, { status: 403 });
      }
    }

    const userId = session?.userId || "master";
    const timestamp = new Date().toISOString();

    if (action === "co_creation_question") {
      const { step, history } = body;
      try {
        await logAudit({
          workspaceId,
          userId,
          action: "ai.co_creation_question",
          entityType: "ai",
          details: { step, historyLength: history?.length || 0 },
        });

        const message = await coCreationQuestion(history || [], step || "target_role");

        await logUsageEvent({
          workspaceId,
          userId: session?.userId,
          eventType: "ai.request",
          entityType: "ai",
          metadata: { action: "co_creation_question", step },
          credits: 1,
        });

        return NextResponse.json({
          success: true,
          action,
          message,
          aiGenerated: true,
          model: MODEL,
          timestamp,
        });
      } catch (err) {
        console.error("Co-creation AI error:", err);
        return NextResponse.json({ error: "KI-Verarbeitung fehlgeschlagen" }, { status: 500 });
      }
    }

    if (action === "generate_model") {
      const { context } = body;
      if (!context) {
        return NextResponse.json({ error: "Kontext ist erforderlich" }, { status: 400 });
      }

      await logAudit({
        workspaceId,
        userId,
        action: "ai.generate_model",
        entityType: "ai",
        details: { inputSummary: context.substring(0, 200), model: MODEL },
      });

      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `Du bist ein Experte für Kompetenzmodelle im Executive Assessment.
Erstelle ein strukturiertes Kompetenzmodell basierend auf dem gegebenen Kontext.
Antworte ausschließlich in validem JSON mit folgender Struktur:
{
  "domains": [
    {
      "name": "Domänenname",
      "description": "Beschreibung",
      "competencies": [
        {
          "name": "Kompetenzname",
          "description": "Beschreibung",
          "anchors": [
            { "level": 1, "description": "Verhaltensanker für Stufe 1" },
            { "level": 2, "description": "Verhaltensanker für Stufe 2" },
            { "level": 3, "description": "Verhaltensanker für Stufe 3" },
            { "level": 4, "description": "Verhaltensanker für Stufe 4" },
            { "level": 5, "description": "Verhaltensanker für Stufe 5" }
          ]
        }
      ]
    }
  ]
}
Erstelle 2-4 Domänen mit je 2-4 Kompetenzen. Alle Texte auf Deutsch.`,
          },
          { role: "user", content: context },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const data = JSON.parse(content);

      await logAudit({
        workspaceId,
        userId,
        action: "ai.generate_model.completed",
        entityType: "ai",
        details: { outputSummary: `${data.domains?.length || 0} Domänen generiert` },
      });

      await logUsageEvent({
        workspaceId,
        userId: session?.userId,
        eventType: "ai.request",
        entityType: "ai",
        metadata: { action: "generate_model" },
        credits: 1,
      });

      return NextResponse.json({
        success: true,
        action,
        data,
        aiGenerated: true,
        model: MODEL,
        timestamp,
      });
    }

    if (action === "write_anchors") {
      const { competencyName, description, scalePoints } = body;
      if (!competencyName) {
        return NextResponse.json({ error: "competencyName ist erforderlich" }, { status: 400 });
      }

      await logAudit({
        workspaceId,
        userId,
        action: "ai.write_anchors",
        entityType: "ai",
        details: { competencyName, model: MODEL },
      });

      const pointsCount = scalePoints || 5;
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `Du bist ein Experte für Kompetenzdiagnostik und Verhaltensanker.
Erstelle Verhaltensanker für die gegebene Kompetenz für ${pointsCount} Skalenpunkte.
Antworte in validem JSON mit folgender Struktur:
{
  "anchors": [
    { "level": 1, "label": "Deutlich unter Erwartung", "description": "Konkreter Verhaltensanker" },
    { "level": 2, "label": "Unter Erwartung", "description": "Konkreter Verhaltensanker" },
    ...
  ]
}
Die Verhaltensanker sollen konkret, beobachtbar und verhaltensorientiert sein. Alle Texte auf Deutsch.`,
          },
          {
            role: "user",
            content: `Kompetenz: ${competencyName}\n${description ? `Beschreibung: ${description}` : ""}`,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const data = JSON.parse(content);

      await logAudit({
        workspaceId,
        userId,
        action: "ai.write_anchors.completed",
        entityType: "ai",
        details: { competencyName, anchorCount: data.anchors?.length || 0 },
      });

      await logUsageEvent({
        workspaceId,
        userId: session?.userId,
        eventType: "ai.request",
        entityType: "ai",
        metadata: { action: "write_anchors", competencyName },
        credits: 1,
      });

      return NextResponse.json({
        success: true,
        action,
        data,
        aiGenerated: true,
        model: MODEL,
        timestamp,
      });
    }

    if (action === "suggest_weights") {
      const { competencies, targetRole } = body;
      if (!competencies || !Array.isArray(competencies) || competencies.length === 0) {
        return NextResponse.json({ error: "competencies-Array ist erforderlich" }, { status: 400 });
      }

      await logAudit({
        workspaceId,
        userId,
        action: "ai.suggest_weights",
        entityType: "ai",
        details: { competencyCount: competencies.length, targetRole, model: MODEL },
      });

      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `Du bist ein Experte für Assessment-Center-Gewichtungsprofile.
Schlage Gewichtungen für die gegebenen Kompetenzen vor.
Die Gewichtungen sollten sich auf 1.0 summieren.
Antworte in validem JSON mit folgender Struktur:
{
  "weights": [
    { "competency": "Kompetenzname", "weight": 0.25, "rationale": "Begründung" }
  ]
}
Alle Texte auf Deutsch.`,
          },
          {
            role: "user",
            content: `Kompetenzen: ${competencies.join(", ")}${targetRole ? `\nZielrolle: ${targetRole}` : ""}`,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const data = JSON.parse(content);

      await logAudit({
        workspaceId,
        userId,
        action: "ai.suggest_weights.completed",
        entityType: "ai",
        details: { weightsCount: data.weights?.length || 0 },
      });

      await logUsageEvent({
        workspaceId,
        userId: session?.userId,
        eventType: "ai.request",
        entityType: "ai",
        metadata: { action: "suggest_weights", targetRole },
        credits: 1,
      });

      return NextResponse.json({
        success: true,
        action,
        data,
        aiGenerated: true,
        model: MODEL,
        timestamp,
      });
    }

    if (action === "generate_recommendations") {
      const { candidateName, scores } = body;
      if (!candidateName || !scores || !Array.isArray(scores)) {
        return NextResponse.json({ error: "candidateName und scores sind erforderlich" }, { status: 400 });
      }

      if (workspace && session?.userId) {
        const consentGranted = await checkConsent(workspace.id, session.userId, "ai_processing");
        if (!consentGranted) {
          return NextResponse.json({ error: "Einwilligung für KI-Verarbeitung erforderlich." }, { status: 403 });
        }
      }

      await logAudit({
        workspaceId,
        userId,
        action: "ai.generate_recommendations",
        entityType: "ai",
        details: { candidateName, scoreCount: scores.length, model: MODEL },
      });

      const scoresText = scores
        .map((s: { competency: string; score: number; normalized: number }) =>
          `${s.competency}: ${s.score} (normalisiert: ${s.normalized})`
        )
        .join("\n");

      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `Du bist ein erfahrener Executive-Assessment-Berater. Erstelle basierend auf den folgenden Kompetenzwerten konkrete Entwicklungsempfehlungen für den Kandidaten. Antworte auf Deutsch, professionell und prägnant. Strukturiere die Empfehlungen in: 1. Stärken, 2. Entwicklungsfelder, 3. Kurzfristige Maßnahmen, 4. Mittelfristige Maßnahmen.`,
          },
          {
            role: "user",
            content: `Kandidat: ${candidateName}\n\nKompetenzwerte:\n${scoresText}\n\nBitte erstelle konkrete Entwicklungsempfehlungen.`,
          },
        ],
        max_completion_tokens: 2048,
      });

      const recommendations = response.choices[0]?.message?.content || "";

      await logAudit({
        workspaceId,
        userId,
        action: "ai.generate_recommendations.completed",
        entityType: "ai",
        details: { candidateName, outputLength: recommendations.length },
      });

      await logUsageEvent({
        workspaceId,
        userId: session?.userId,
        eventType: "ai.request",
        entityType: "ai",
        metadata: { action: "generate_recommendations", candidateName },
        credits: 1,
      });

      return NextResponse.json({
        success: true,
        action,
        recommendations,
        aiGenerated: true,
        model: MODEL,
        timestamp,
      });
    }

    if (action === "autonomous_diagnostic") {
      if (!workspace?.autonomousDiagMode) {
        return NextResponse.json({ error: "Autonomer Diagnosemodus ist nicht aktiviert." }, { status: 403 });
      }

      if (session && !session.roles.includes("ADMIN")) {
        return NextResponse.json({ error: "Nur Administratoren können den autonomen Diagnosemodus nutzen." }, { status: 403 });
      }

      await logAudit({
        workspaceId,
        userId,
        action: "autonomous_diagnostic.initiated",
        entityType: "ai",
        details: { level: "WARNING", message: "Autonomous diagnostic mode initiated" },
      });

      return NextResponse.json({
        warning: "Beta-Funktion: Autonomer Diagnosemodus ist nur für den internen Gebrauch bestimmt.",
        enabled: true,
        aiGenerated: true,
        model: MODEL,
        timestamp,
      });
    }

    return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
}
