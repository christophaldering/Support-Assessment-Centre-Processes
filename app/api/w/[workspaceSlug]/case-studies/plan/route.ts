import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { generateLLMOutput, isAIDisabled, create503Response } from "@/server/llm/adapter";
import { resolveSystemPrompt, PROMPT_SLOTS } from "@/lib/prompt-library";

interface RouteContext {
  params: { workspaceSlug: string };
}

const PLAN_SYSTEM_PROMPT = PROMPT_SLOTS.plan_case_study.defaultPrompt;

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isAIDisabled("case_study_generation")) {
    const err = create503Response("case_study_generation");
    return NextResponse.json(err.body, { status: err.status });
  }

  try {
    const body = await req.json();
    const {
      industry,
      companySize,
      strategicSituation,
      financialScenario,
      keyTensions,
      targetLevel,
      difficulty,
      referenceDate,
      documentCount,
    } = body;

    if (!industry || !strategicSituation) {
      return NextResponse.json({
        error: "Branche und strategische Situation sind erforderlich",
      }, { status: 400 });
    }

    const userPrompt = `Erstelle einen Dokumentenplan für eine Fallstudie mit folgenden Parametern:

Branche: ${industry}
Unternehmensgröße: ${companySize || "Großkonzern"}
Strategische Situation: ${strategicSituation}
Finanzielles Szenario: ${financialScenario || "Herausfordernd"}
Kernspannungen: ${keyTensions || "Nicht spezifiziert"}
Zielgruppe/Level: ${targetLevel || "SE-Level/Vorstand"}
Schwierigkeitsgrad: ${difficulty || "Hoch"}
Anzahl der zu erstellenden Vorgänge/Dokumente insgesamt: ${parseInt(documentCount) || 15}. Erstelle EXAKT diese Anzahl an Dokumenten.${referenceDate ? `\nReferenzdatum (Stichtag): ${referenceDate}` : ""}`;

    const workspace = await prisma.workspace.findUnique({
      where: { slug: params.workspaceSlug },
    });

    const resolvedPlanPrompt = await resolveSystemPrompt(
      workspace?.id ?? "",
      "plan_case_study",
      PLAN_SYSTEM_PROMPT
    );

    const result = await generateLLMOutput({
      taskName: "plan_case_study",
      featureName: "case_study_generation",
      input: userPrompt,
      route: `/api/w/${params.workspaceSlug}/case-studies/plan`,
      options: {
        systemPrompt: resolvedPlanPrompt,
        responseFormat: "json",
        maxTokens: 4096,
      },
    });

    if ('aiDisabled' in result) {
      const err = create503Response("case_study_generation");
      return NextResponse.json(err.body, { status: err.status });
    }

    return NextResponse.json(result.data);
  } catch (err) {
    console.error("Error planning case study:", err);
    return NextResponse.json({ error: "Fehler bei der Dokumentenplanung" }, { status: 500 });
  }
}
