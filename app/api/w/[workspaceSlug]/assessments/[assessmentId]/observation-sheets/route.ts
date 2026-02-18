import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import OpenAI from "openai";

export const maxDuration = 120;

interface RouteContext {
  params: { workspaceSlug: string; assessmentId: string };
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sheets = await prisma.observationSheet.findMany({
    where: { assessmentId: params.assessmentId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sheets);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();
  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session && !master && !hasPermission(session.roles, "assessments.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug: params.workspaceSlug } });
  if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.assessmentId, workspaceId: workspace.id },
  });
  if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

  try {
    const body = await req.json();
    const { name, description, exerciseId, type, content, fileKey, fileName, fileSize, mimeType, aiGenerated } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }

    if (aiGenerated) {
      const aiContent = await generateAIObservationSheet(assessment, exerciseId, body, workspace.id);

      const sheet = await prisma.observationSheet.create({
        data: {
          assessmentId: assessment.id,
          exerciseId: exerciseId || null,
          name: name.trim(),
          description: aiContent.description || description?.trim() || null,
          type: "ai",
          content: aiContent,
          aiGenerated: true,
          createdBy: session?.userId || "master",
        },
      });

      return NextResponse.json(sheet, { status: 201 });
    }

    const sheet = await prisma.observationSheet.create({
      data: {
        assessmentId: assessment.id,
        exerciseId: exerciseId || null,
        name: name.trim(),
        description: description?.trim() || null,
        type: type || "manual",
        content: content || null,
        fileKey: fileKey || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        aiGenerated: false,
        createdBy: session?.userId || "master",
      },
    });

    return NextResponse.json(sheet, { status: 201 });
  } catch (error) {
    console.error("Observation sheet creation error:", error);
    return NextResponse.json({ error: "Fehler beim Erstellen des Beobachtungsbogens" }, { status: 500 });
  }
}

async function generateAIObservationSheet(
  assessment: any,
  exerciseId: string | null,
  body: any,
  workspaceId: string,
) {
  let exerciseContext = "";
  let competencyContext = "";
  let mtmmContext = "";

  if (exerciseId) {
    const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (exercise) {
      exerciseContext = `\nZielübung: "${exercise.name}" (Typ: ${exercise.type})`;
      if (exercise.instructions) {
        exerciseContext += `\nÜbungsbeschreibung: ${exercise.instructions.substring(0, 500)}`;
      }
      if (exercise.duration) {
        exerciseContext += `\nDauer: ${exercise.duration} Minuten`;
      }
    }

    const exerciseMappings = await prisma.exerciseCompetencyMapping.findMany({
      where: { assessmentId: assessment.id, exerciseId },
      include: {
        competencyNode: { select: { id: true, name: true, description: true, nodeType: true } },
      },
      orderBy: { weight: "desc" },
    });

    if (exerciseMappings.length > 0) {
      mtmmContext = "\n\nMTMM-Zuordnung (Kompetenzen für diese Übung mit Gewichtung):\n" +
        exerciseMappings.map(m =>
          `- ${m.competencyNode.name} (Gewicht: ${m.weight})${m.competencyNode.description ? ` — ${m.competencyNode.description}` : ""}`
        ).join("\n");
      competencyContext = exerciseMappings.map(m => m.competencyNode.name).join(", ");
    }
  }

  if (!competencyContext) {
    const allMappings = await prisma.exerciseCompetencyMapping.findMany({
      where: { assessmentId: assessment.id },
      include: {
        competencyNode: { select: { id: true, name: true, description: true, nodeType: true } },
      },
      orderBy: { weight: "desc" },
    });

    if (allMappings.length > 0) {
      const uniqueComps = [...new Map(allMappings.map(m => [m.competencyNode.id, m.competencyNode])).values()];
      competencyContext = uniqueComps.map(c => c.name).join(", ");
      mtmmContext = "\n\nAlle Assessment-Kompetenzen (aus MTMM-Matrix):\n" +
        uniqueComps.map(c => `- ${c.name}${c.description ? ` — ${c.description}` : ""}`).join("\n");
    }
  }

  if (!competencyContext) {
    const competencyModel = await prisma.competencyModel.findFirst({
      where: { assessmentId: assessment.id },
      include: { nodes: { where: { nodeType: "competency" }, orderBy: { sortOrder: "asc" } } },
    });

    if (competencyModel && competencyModel.nodes.length > 0) {
      competencyContext = competencyModel.nodes.map(n => n.name).join(", ");
      mtmmContext = "\n\nKompetenzmodell-Kompetenzen:\n" +
        competencyModel.nodes.map(n => `- ${n.name}${n.description ? ` — ${n.description}` : ""}`).join("\n");
    }
  }

  const allExercises = await prisma.exercise.findMany({
    where: { assessmentId: assessment.id },
    orderBy: { sortOrder: "asc" },
  });
  const exerciseListContext = allExercises.length > 0
    ? "\n\nAlle Übungen im Assessment:\n" + allExercises.map(e => `- ${e.name} (${e.type})`).join("\n")
    : "";

  const ratingScale = "1-5";
  const sheetType = body.sheetType || "verhaltensanker-bogen";
  const additionalInstructions = body.additionalInstructions || "";

  const TEMPLATE_TYPES: Record<string, string> = {
    "verhaltensanker-bogen": "Verhaltensanker-Bogen mit konkreten Verhaltensbeispielen und Bewertungsskala je Kompetenz",
    "kompetenzmatrix": "Kompetenzmatrix (Übungen × Kompetenzen-Raster mit Bewertungsfeldern)",
    "freitext-bogen": "Freitext-Bogen mit strukturierten Beobachtungsfeldern und Leitfragen",
    "kombinierter-bogen": "Kombinierter Bogen (Mix aus Verhaltensankern, Ratings und Freitext)",
  };

  const typeDesc = TEMPLATE_TYPES[sheetType] || TEMPLATE_TYPES["verhaltensanker-bogen"];

  const prompt = `Erstelle einen professionellen Beobachtungsbogen für ein Executive Assessment Center.

ASSESSMENT-KONTEXT:
- Assessment: "${assessment.name}"${assessment.targetPosition ? `\n- Zielposition: ${assessment.targetPosition}` : ""}${assessment.clientName ? `\n- Auftraggeber: ${assessment.clientName}` : ""}${exerciseContext}${mtmmContext}${exerciseListContext}

SPEZIFIKATIONEN:
- Bogentyp: ${typeDesc}
- Bewertungsskala: ${ratingScale === "1-5" ? "1 bis 5 (1=deutlich unter Anforderungen, 3=entspricht Anforderungen, 5=deutlich über Anforderungen)" : ratingScale}
- Kompetenzen: ${competencyContext || "Bitte relevante Führungskompetenzen ableiten aus dem Assessment-Kontext"}
${additionalInstructions ? `- Zusätzliche Hinweise: ${additionalInstructions}` : ""}
- Sprache: Deutsch

WICHTIG:
- Erstelle für JEDE Kompetenz einen eigenen Abschnitt mit 3-6 konkreten, beobachtbaren Verhaltensankern
- Verhaltensanker müssen BEOBACHTBAR formuliert sein (nicht bewertend), z.B. "Stellt gezielte Rückfragen zum Verständnis" statt "Kommuniziert gut"
- Berücksichtige den Übungstyp für passende Verhaltensindikatoren${exerciseId ? `\n- Fokussiere die Verhaltensanker auf Verhalten, das in der spezifischen Übung "${allExercises.find(e => e.id === exerciseId)?.name || "der ausgewählten Übung"}" beobachtbar ist` : ""}
- Die Gewichtung aus dem MTMM soll die Detailtiefe bestimmen: höher gewichtete Kompetenzen = mehr und differenziertere Anker

Antworte ausschließlich in validem JSON:

{
  "title": "Titel des Beobachtungsbogens",
  "description": "Kurzbeschreibung des Bogens und seines Einsatzzwecks (2-3 Sätze)",
  "exerciseName": "Name der Übung (falls übungsspezifisch, sonst null)",
  "sections": [
    {
      "title": "Kompetenzname",
      "type": "anchors",
      "competency": "Zugehörige Kompetenz",
      "weight": 2,
      "items": [
        {
          "label": "Konkreter, beobachtbarer Verhaltensindikator",
          "type": "rating",
          "anchors": ["Konkretes Negativbeispiel (1-2)", "Erwartetes Verhalten (3)", "Herausragendes Verhalten (4-5)"],
          "helpText": "Erläuterung für Beobachter, worauf zu achten ist"
        }
      ]
    }
  ],
  "headerFields": ["Kandidat/in", "Übung", "Beobachter/in", "Datum"],
  "footerNote": "Hinweise für den Beobachter",
  "tags": ["relevante Tags"],
  "competencies": ["Liste der verwendeten Kompetenzen"],
  "ratingScale": "${ratingScale}"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Du bist ein Senior Assessment Center Diagnostiker mit 20 Jahren Erfahrung. Du erstellst wissenschaftlich fundierte, praxistaugliche Beobachtungsbögen. Dein Fokus liegt auf beobachtbaren Verhaltensindikatoren (behavioral anchors), die präzise, fair und kompetenzbasiert sind. Antworte ausschließlich in validem JSON.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("Failed to parse AI observation sheet response:", raw.substring(0, 500));
    throw new Error("KI-Antwort konnte nicht verarbeitet werden.");
  }

  if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    if (!parsed.description) {
      throw new Error("KI-Antwort enthält keine verwertbaren Inhalte (weder Abschnitte noch Beschreibung).");
    }
  }

  return parsed;
}
