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
  params: { workspaceSlug: string; assessmentId: string };
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

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: params.assessmentId, workspaceId: workspace.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment nicht gefunden" }, { status: 404 });
    }

    const body = await req.json();
    const { level, exercises, nodes } = body;

    if (!level || !exercises || !nodes || !Array.isArray(exercises) || !Array.isArray(nodes)) {
      return NextResponse.json({ error: "level, exercises und nodes sind erforderlich" }, { status: 400 });
    }

    if (exercises.length === 0 || nodes.length === 0) {
      return NextResponse.json({ error: "Mindestens eine Übung und ein Kompetenzknoten sind erforderlich" }, { status: 400 });
    }

    if (exercises.length > 50 || nodes.length > 200) {
      return NextResponse.json({ error: "Maximal 50 Übungen und 200 Kompetenzknoten erlaubt" }, { status: 400 });
    }

    const validLevels = ["domain", "cluster", "competency", "sub", "dimension", "anchor"];
    if (!validLevels.includes(level)) {
      return NextResponse.json({ error: "Ungültige Ebene. Erlaubt: domain, competency, sub, anchor" }, { status: 400 });
    }

    for (const e of exercises) {
      if (!e.id || !e.name) {
        return NextResponse.json({ error: "Jede Übung benötigt id und name" }, { status: 400 });
      }
    }
    for (const n of nodes) {
      if (!n.id || !n.name) {
        return NextResponse.json({ error: "Jeder Kompetenzknoten benötigt id und name" }, { status: 400 });
      }
    }

    const levelLabels: Record<string, string> = {
      domain: "Cluster/Domänen",
      cluster: "Cluster/Domänen",
      competency: "Einzelkompetenzen",
      sub: "Subkompetenzen/Dimensionen",
      dimension: "Kompetenzdimensionen",
      anchor: "Verhaltensanker",
    };

    const exerciseList = exercises
      .map((e: { id: string; name: string; type?: string }) => `- ID="${e.id}", Name="${e.name}", Typ="${e.type || "unbekannt"}"`)
      .join("\n");

    const nodeList = nodes
      .map((n: { id: string; name: string; nodeType?: string }) => `- ID="${n.id}", Name="${n.name}", Ebene="${n.nodeType || level}"`)
      .join("\n");

    const systemPrompt = `Du bist ein Experte für Executive Assessment Center und die MTMM-Methodik (Multi-Trait-Multi-Method).
Deine Aufgabe ist es, eine sinnvolle Zuordnung zwischen Assessment-Übungen (Methoden) und Kompetenzdimensionen (Traits) vorzuschlagen.

Regeln:
1. Jede Übung sollte mindestens 1-3 Traits messen, aber nicht alle.
2. Jeder Trait sollte idealerweise durch mindestens 2 verschiedene Methoden gemessen werden (Konvergenz-Prinzip).
3. Gewichte zwischen 0.5 und 2.0 vergeben: 1.0 = Standard, >1.0 = Übung ist besonders geeignet, <1.0 = sekundäre Messung.
4. Berücksichtige die typische Passung von Übungstypen zu Kompetenzen:
   - Interview → Reflexionsfähigkeit, strategisches Denken, Werteorientierung
   - Fallstudie → Analytik, Entscheidungsfähigkeit, unternehmerisches Denken
   - Präsentation → Kommunikation, Überzeugungskraft, Auftreten
   - Verhaltenssimulation → Führung, Konfliktfähigkeit, Empathie
   - Fact-Finding → Informationsverarbeitung, Fragetechnik, strukturiertes Vorgehen
   - Psychometrischer Test → Kognitive Fähigkeiten, Persönlichkeit
5. Gib für jede Zuordnung eine kurze Begründung (rationale).

Die aktuelle Zuordnungsebene ist: ${levelLabels[level] || level}`;

    const userPrompt = `Bitte schlage eine MTMM-Zuordnung vor.

**Assessment-Übungen (Methoden):**
${exerciseList}

**Kompetenz-Knoten (Traits) auf Ebene "${levelLabels[level] || level}":**
${nodeList}

Antworte ausschließlich als JSON-Array mit folgendem Format:
[
  { "exerciseId": "<die exakte ID der Übung>", "nodeId": "<die exakte ID des Knotens>", "weight": <number>, "rationale": "<kurze Begründung>" }
]

WICHTIG: Verwende als exerciseId und nodeId exakt die ID-Werte (nicht die Namen!). Vergib Gewichte zwischen 0.5 und 2.0.
Gib NUR das JSON-Array zurück, keinen weiteren Text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 4000,
    });

    const raw = response.choices[0]?.message?.content?.trim() || "[]";

    let suggestions: { exerciseId: string; nodeId: string; weight: number; rationale?: string }[];
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      suggestions = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden" }, { status: 500 });
    }

    if (!Array.isArray(suggestions)) {
      return NextResponse.json({ error: "Ungültiges KI-Ergebnis" }, { status: 500 });
    }

    const validExerciseIds = new Set(exercises.map((e: { id: string }) => e.id));
    const validNodeIds = new Set(nodes.map((n: { id: string }) => n.id));

    const filtered = suggestions
      .filter((s) => validExerciseIds.has(s.exerciseId) && validNodeIds.has(s.nodeId))
      .map((s) => ({
        exerciseId: s.exerciseId,
        nodeId: s.nodeId,
        weight: Math.max(0.5, Math.min(2.0, Number(s.weight) || 1.0)),
        rationale: s.rationale || undefined,
      }));

    if (filtered.length === 0 && suggestions.length > 0) {
      return NextResponse.json({ error: "KI-Vorschlag enthielt keine gültigen Zuordnungen. Bitte erneut versuchen." }, { status: 422 });
    }

    return NextResponse.json(filtered);
  } catch (err) {
    console.error("[mtmm-suggest] Error:", err);
    return NextResponse.json({ error: "KI-Vorschlag fehlgeschlagen" }, { status: 500 });
  }
}
