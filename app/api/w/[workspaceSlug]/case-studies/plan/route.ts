import { NextRequest, NextResponse } from "next/server";
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

const PLAN_SYSTEM_PROMPT = `Du bist ein Experte für Executive Assessment Center und planst die Dokumentenstruktur für realistische Fallstudien.

Basierend auf den gegebenen Parametern, erstelle einen detaillierten Dokumentenplan für eine Fallstudie. Der Plan beschreibt alle Dokumente, die im Datenraum enthalten sein sollen.

Antworte AUSSCHLIESSLICH mit validem JSON in folgender Struktur:

{
  "companyName": "<Vorgeschlagener Unternehmensname>",
  "companyDescription": "<Kurzbeschreibung des Unternehmens (2-3 Sätze)>",
  "documents": [
    {
      "id": "<eindeutige-id>",
      "category": "<briefing|email|protocol|news|report|financial|hr>",
      "title": "<Dokumenttitel>",
      "description": "<Kurzbeschreibung des Inhalts (1-2 Sätze)>",
      "author": "<Absender/Autor>",
      "importance": "<high|medium|low>",
      "selected": true
    }
  ]
}

Erstelle einen realistischen Mix aus Dokumenten. Die Gesamtanzahl wird vom Benutzer vorgegeben.

Verteile die Dokumente proportional auf folgende Kategorien:
- 1 Strategisches Briefing (category: briefing) [immer genau 1]
- E-Mails von verschiedenen Stakeholdern mit unterschiedlichen Perspektiven und Spannungsfeldern (category: email) [ca. 30-40% der Gesamtanzahl]
- Sitzungsprotokolle (Vorstand, Aufsichtsrat, Strategiemeeting) (category: protocol) [ca. 15-20%]
- Nachrichtenartikel (Fachpresse, Wirtschaftsmedien) (category: news) [ca. 15-20%]
- Interne Berichte (HR-Survey, Managementbewertung) (category: report) [ca. 10%]
- 1 Finanzanalyse / Bilanzübersicht (category: financial) [immer genau 1]
- 1 HR-Dashboard / Mitarbeiterkennzahlen (category: hr) [immer genau 1]

Alle mit "selected": true.`;

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PLAN_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Error planning case study:", err);
    return NextResponse.json({ error: "Fehler bei der Dokumentenplanung" }, { status: 500 });
  }
}
