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

const CASE_STUDY_SYSTEM_PROMPT = `Du bist ein Experte für Executive Assessment Center und erstellst realistische, komplexe Fallstudien für die Führungskräftediagnostik.

Erstelle eine vollständige Fallstudie im folgenden JSON-Format. Die Fallstudie muss realistisch, komplex und für Executive Assessments geeignet sein.

Das JSON muss EXAKT diese Struktur haben:

{
  "data": {
    "id": "<eindeutige-id>",
    "name": "<Unternehmensname>",
    "description": "<Kurzbeschreibung des Unternehmens>",
    "metrics": [
      { "label": "<KPI-Name>", "value": "<Wert mit Einheit>", "trend": "<up|down|stable|down-significant>" }
    ],
    "businessUnits": [
      {
        "id": "<id>",
        "name": "<Name der Geschäftseinheit>",
        "revenue": <Umsatz in Mrd>,
        "ebitda": <EBITDA in Mrd>,
        "margin": <Marge in %>,
        "employees": <Mitarbeiterzahl>,
        "tension": "<Kernspannung/Dilemma>",
        "kpis": ["<KPI1>", "<KPI2>", "<KPI3>"],
        "financials": { "revenue": <>, "ebitda": <>, "margin": <>, "employees": <> },
        "yoy": { "revenue": <Vorjahr>, "ebitda": <Vorjahr>, "deltaRevenue": <Differenz>, "deltaEbitda": <Differenz> }
      }
    ],
    "emails": [
      {
        "id": "<id>",
        "from": "<Name, Rolle>",
        "subject": "<Betreff>",
        "date": "<Datum>",
        "read": <true|false>,
        "important": <true|false>,
        "content": "<Ausführlicher E-Mail-Text mit realistischen Details, Spannungen und Informationen>"
      }
    ],
    "detailedBalanceSheet": {
      "assets": {
        "nonCurrent": [{ "item": "<Position>", "value": <Wert in Mio> }],
        "current": [{ "item": "<Position>", "value": <Wert in Mio> }]
      },
      "equityLiabilities": {
        "equity": [{ "item": "<Position>", "value": <Wert in Mio> }],
        "nonCurrentLiabilities": [{ "item": "<Position>", "value": <Wert in Mio> }],
        "currentLiabilities": [{ "item": "<Position>", "value": <Wert in Mio> }]
      }
    },
    "balanceSheet": [
      { "name": "<Kategorie>", "value": <Wert in Mrd>, "type": "<asset|liability>" }
    ],
    "organigramm": [
      { "name": "<Name>", "role": "<Funktion/Position>", "department": "<Abteilung/Bereich>", "reportsTo": "<Name des Vorgesetzten oder null>" }
    ]
  },
  "briefing": {
    "role": "<Rollenbeschreibung des Kandidaten im konkreten Unternehmenskontext>",
    "situation": "<Situationsbeschreibung spezifisch für dieses Unternehmen>",
    "tasks": ["<Aufgabe 1>", "<Aufgabe 2>", "<Aufgabe 3>", "<Aufgabe 4>"],
    "analysisQuestions": ["<Frage 1>", "<Frage 2>", "<Frage 3>", "<Frage 4>"],
    "conclusionQuestions": ["<Frage 1>", "<Frage 2>", "<Frage 3>", "<Frage 4>"],
    "timeMinutes": <Bearbeitungszeit>,
    "presentationMinutes": 15
  },
  "questions": {
    "analysis": ["<Analysefrage 1>", "<Analysefrage 2>", "<Analysefrage 3>", "<Analysefrage 4>"],
    "conclusions": ["<Schlussfolgerungsfrage 1>", "<Schlussfolgerungsfrage 2>", "<Schlussfolgerungsfrage 3>", "<Schlussfolgerungsfrage 4>"]
  }
}

Wichtige Regeln:
- Mindestens 3-5 Geschäftseinheiten mit realistischen Finanzdaten
- Mindestens 3-4 E-Mails von verschiedenen Stakeholdern mit unterschiedlichen Perspektiven
- Detaillierte Bilanz mit mindestens 8-10 Positionen pro Kategorie
- Spannungsfelder und Dilemmata zwischen den Geschäftseinheiten
- Realistische Finanzkennzahlen die zueinander passen
- 4 Analysefragen und 4 Schlussfolgerungsfragen
- Ein Organigramm mit ALLEN in der Fallstudie vorkommenden Personen (mindestens 8-10), inklusive Name, Funktion, Abteilung und Berichtslinie
- Eine individuelle Briefing-Sektion mit Rollenbeschreibung, Situationsbeschreibung und Aufgabenstellung, die exakt auf das generierte Unternehmen zugeschnitten ist (NICHT generisch)
- Alle Texte auf Englisch (wie Varexia SE Referenz)
- Antworte AUSSCHLIESSLICH mit validem JSON, kein zusätzlicher Text

Wenn ein Referenzdatum (Stichtag) angegeben ist, MÜSSEN alle Datumsangaben, Geschäftsjahre, E-Mail-Daten und Finanzkennzahlen konsistent zu diesem Stichtag sein. Das Referenzdatum ist der "heutige Tag" in der Fallstudie. Alle E-Mails sollten Daten innerhalb der letzten 1-3 Monate vor dem Stichtag haben. Finanzberichte sollten das Geschäftsjahr vor dem Stichtag abdecken.`;

const UPLOAD_PARSE_PROMPT = `Du bist ein Experte für Executive Assessment Center. Dir wird der Textinhalt eines hochgeladenen Dokuments gegeben, das eine Fallstudie für ein Assessment Center enthält.

Analysiere den Text und extrahiere/transformiere ihn in das standardisierte Fallstudien-Format. Wenn Informationen fehlen, ergänze sie intelligent und realistisch basierend auf dem Kontext.

${CASE_STUDY_SYSTEM_PROMPT.split("Wichtige Regeln:")[0]}

Wichtige Regeln:
- Behalte alle vorhandenen Informationen aus dem Originaldokument bei
- Ergänze fehlende Felder intelligent (z.B. Bilanzdaten wenn nur Umsatz gegeben)
- Erstelle realistische E-Mails basierend auf den im Dokument beschriebenen Szenarien
- Passe Finanzdaten an, wenn sie unvollständig sind
- Ein Organigramm mit ALLEN in der Fallstudie vorkommenden Personen (mindestens 8-10), inklusive Name, Funktion, Abteilung und Berichtslinie
- Eine individuelle Briefing-Sektion mit Rollenbeschreibung, Situationsbeschreibung und Aufgabenstellung, die exakt auf das generierte Unternehmen zugeschnitten ist (NICHT generisch)
- Antworte AUSSCHLIESSLICH mit validem JSON`;

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = getUserSession();
  const master = hasMasterAuth();

  if (!master && (!session || session.workspaceSlug !== params.workspaceSlug)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session && !master && !hasPermission(session.roles, "exerciselibrary.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { mode, params: genParams } = body;

    if (mode === "generate") {
      const {
        industry,
        companySize,
        strategicSituation,
        financialScenario,
        keyTensions,
        targetLevel,
        difficulty,
        language,
        referenceDate,
        documentPlan,
        candidateTime,
        documentCount,
      } = genParams || {};

      if (!industry || !strategicSituation) {
        return NextResponse.json({
          error: "Branche und strategische Situation sind erforderlich",
        }, { status: 400 });
      }

      let documentPlanInstructions = "";
      if (documentPlan && Array.isArray(documentPlan.documents)) {
        const selected = documentPlan.documents.filter((d: any) => d.selected !== false);
        const emailDocs = selected.filter((d: any) => d.category === "email");
        const protocolDocs = selected.filter((d: any) => d.category === "protocol");
        const newsDocs = selected.filter((d: any) => d.category === "news");
        const otherDocs = selected.filter((d: any) => !["email", "protocol", "news"].includes(d.category));

        documentPlanInstructions = `\n\nDer Benutzer hat folgende Dokumente ausgewählt. Erstelle die Fallstudie mit GENAU diesen Dokumenten:
Unternehmensname: ${documentPlan.companyName || "Bitte wählen"}
${emailDocs.length > 0 ? `\nE-Mails (${emailDocs.length}):\n${emailDocs.map((d: any) => `- "${d.title}" von ${d.author}: ${d.description}`).join("\n")}` : ""}
${protocolDocs.length > 0 ? `\nProtokolle (${protocolDocs.length}):\n${protocolDocs.map((d: any) => `- "${d.title}" von ${d.author}: ${d.description}`).join("\n")}` : ""}
${newsDocs.length > 0 ? `\nNachrichtenartikel (${newsDocs.length}):\n${newsDocs.map((d: any) => `- "${d.title}": ${d.description}`).join("\n")}` : ""}
${otherDocs.length > 0 ? `\nWeitere Dokumente (${otherDocs.length}):\n${otherDocs.map((d: any) => `- [${d.category}] "${d.title}": ${d.description}`).join("\n")}` : ""}`;
      }

      const userPrompt = `Erstelle eine Fallstudie mit folgenden Parametern:

Branche: ${industry}
Unternehmensgröße: ${companySize || "Großkonzern"}
Strategische Situation: ${strategicSituation}
Finanzielles Szenario: ${financialScenario || "Herausfordernd"}
Kernspannungen: ${keyTensions || "Nicht spezifiziert"}
Zielgruppe/Level: ${targetLevel || "SE-Level/Vorstand"}
Schwierigkeitsgrad: ${difficulty || "Hoch"}
Sprache der Inhalte: ${language || "Englisch"}
Bearbeitungszeit für den Kandidaten: ${candidateTime || 60} Minuten
Anzahl der zu erstellenden Vorgänge: ${documentCount || 15} (E-Mails, Protokolle, Nachrichtenartikel, etc. zusammen)${referenceDate ? `\nReferenzdatum (Stichtag): ${referenceDate}` : ""}${documentPlanInstructions}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: CASE_STUDY_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 16384,
      });

      const content = response.choices[0]?.message?.content || "{}";
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden" }, { status: 500 });
      }

      const dataJson = parsed.data || parsed;
      const questionsJson = parsed.questions || null;
      const companyName = dataJson.name || `${industry}-Unternehmen`;

      const caseStudy = await prisma.caseStudy.create({
        data: {
          workspaceId: workspace.id,
          title: `Fallstudie: ${companyName}`,
          subtitle: strategicSituation,
          companyName,
          description: dataJson.description || strategicSituation,
          type: strategicSituation.toLowerCase().includes("turnaround") ? "turnaround" : "strategy",
          difficulty: difficulty || "high",
          dataJson,
          questionsJson,
          sourceType: "ai_generated",
          aiGenerated: true,
          status: "draft",
          referenceDate: referenceDate || null,
          createdById: session?.userId || null,
        },
      });

      return NextResponse.json(caseStudy, { status: 201 });
    }

    if (mode === "upload_parse") {
      const { textContent, fileName } = genParams || {};

      if (!textContent) {
        return NextResponse.json({ error: "Textinhalt ist erforderlich" }, { status: 400 });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: UPLOAD_PARSE_PROMPT },
          { role: "user", content: `Dokument: ${fileName || "Fallstudie"}\n\nInhalt:\n${textContent}` },
        ],
        response_format: { type: "json_object" },
        max_tokens: 16384,
      });

      const content = response.choices[0]?.message?.content || "{}";
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden" }, { status: 500 });
      }

      const dataJson = parsed.data || parsed;
      const questionsJson = parsed.questions || null;
      const companyName = dataJson.name || "Unbekanntes Unternehmen";

      const caseStudy = await prisma.caseStudy.create({
        data: {
          workspaceId: workspace.id,
          title: `Fallstudie: ${companyName}`,
          subtitle: fileName || null,
          companyName,
          description: dataJson.description || null,
          type: "strategy",
          difficulty: "high",
          dataJson,
          questionsJson,
          sourceType: "upload",
          sourceFileName: fileName || null,
          aiGenerated: true,
          status: "draft",
          createdById: session?.userId || null,
        },
      });

      return NextResponse.json(caseStudy, { status: 201 });
    }

    return NextResponse.json({ error: "Ungültiger Modus. Verwende 'generate' oder 'upload_parse'" }, { status: 400 });
  } catch (err) {
    console.error("Error generating case study:", err);
    return NextResponse.json({ error: "Fehler bei der KI-Generierung" }, { status: 500 });
  }
}
