import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserSession, hasMasterAuth } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import { generateLLMOutput, isAIDisabled, create503Response } from "@/server/llm/adapter";

interface RouteContext {
  params: { workspaceSlug: string };
}

const CASE_STUDY_SYSTEM_PROMPT = `Du bist ein kreativer Experte für Executive Assessment Center und erstellst außergewöhnlich realistische, detaillierte und phantasievolle Fallstudien für die Führungskräftediagnostik.

Erstelle eine vollständige Fallstudie im folgenden JSON-Format. Die Fallstudie muss kreativ, plausibel, komplex und für Executive Assessments geeignet sein.

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
        "to": "<Empfänger Name, Rolle>",
        "subject": "<Betreff>",
        "date": "<Datum>",
        "read": <true|false>,
        "important": <true|false>,
        "category": "<internal|external>",
        "content": "<VOLLSTÄNDIGE E-Mail mit Anrede, Hauptteil, Grußformel und Signatur>"
      }
    ],
    "protocols": [
      {
        "id": "<id>",
        "title": "<Titel des Protokolls>",
        "date": "<Datum>",
        "location": "<Ort>",
        "participants": "<Teilnehmer>",
        "content": "<Vollständiger Protokolltext>"
      }
    ],
    "newsArticles": [
      {
        "id": "<id>",
        "headline": "<Überschrift>",
        "subtitle": "<Untertitel>",
        "source": "<Medienquelle>",
        "date": "<Datum>",
        "content": "<Vollständiger Artikeltext>"
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
    ],
    "strategicAnalysis": {
      "executiveSummary": "<Zusammenfassende strategische Bewertung der Ausgangslage, 3-4 Sätze>",
      "swot": {
        "strengths": ["<Stärke 1>", "<Stärke 2>", "<Stärke 3>", "<Stärke 4>"],
        "weaknesses": ["<Schwäche 1>", "<Schwäche 2>", "<Schwäche 3>", "<Schwäche 4>"],
        "opportunities": ["<Chance 1>", "<Chance 2>", "<Chance 3>"],
        "threats": ["<Risiko 1>", "<Risiko 2>", "<Risiko 3>"]
      },
      "solutionApproaches": {
        "strategic": [
          { "title": "<Strategischer Ansatz 1>", "description": "<Beschreibung>" },
          { "title": "<Strategischer Ansatz 2>", "description": "<Beschreibung>" }
        ],
        "bscPerspectives": {
          "financial": ["<Finanzmaßnahme 1>", "<Finanzmaßnahme 2>"],
          "customer": ["<Kundenmaßnahme 1>", "<Kundenmaßnahme 2>"],
          "processes": ["<Prozessmaßnahme 1>", "<Prozessmaßnahme 2>"],
          "learningGrowth": ["<Lern-/Entwicklungsmaßnahme 1>", "<Lern-/Entwicklungsmaßnahme 2>"]
        },
        "quickwins": [
          { "title": "<Quickwin 1>", "impact": "<hoch|mittel|niedrig>", "effort": "<gering|mittel|hoch>" },
          { "title": "<Quickwin 2>", "impact": "<hoch|mittel|niedrig>", "effort": "<gering|mittel|hoch>" }
        ]
      }
    }
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

KREATIVITÄT & PHANTASIE:
- Erfinde originelle, aber plausible Unternehmensszenarien mit lebendigen Details
- Jede Person soll einen eigenen Kommunikationsstil haben (formell vs. direkt, diplomatisch vs. konfrontativ)
- Baue subtile Spannungen, versteckte Agenden und politische Dynamiken ein
- Verwende kreative, aber realistische Firmennamen und Markennamen
- Erzähle eine zusammenhängende Geschichte durch die verschiedenen Dokumente

E-MAIL-FORMATIERUNG (KRITISCH WICHTIG):
Jede E-Mail MUSS wie eine echte geschäftliche E-Mail aussehen:
1. Anrede: z.B. "Dear Dr. Schmidt," oder "Lieber Herr Müller," oder "Hi Team,"
2. Hauptteil: Strukturierter Inhalt mit Absätzen, ggf. Aufzählungen oder eingerückten Abschnitten, konkreten Zahlen und Fakten
3. Grußformel: z.B. "Best regards," oder "Mit freundlichen Grüßen,"
4. SIGNATUR-BLOCK (PFLICHT): Jede E-Mail MUSS eine professionelle Signatur enthalten:
   - Vollständiger Name
   - Position/Funktion
   - Abteilung/Bereich
   - E-Mail-Adresse (fiktiv aber plausibel, z.B. m.schmidt@firmenname.com)
   - Telefonnummer (fiktiv, z.B. +49 69 1234-5678)
   - Optional: Firmen-Disclaimer ("Diese E-Mail ist vertraulich...")

Jede E-Mail MUSS das Feld "category" enthalten: "internal" für firmeninterne Kommunikation, "external" für externe Kommunikation (Kunden, Lieferanten, Berater, Presse).
Jede E-Mail MUSS das Feld "to" enthalten mit dem Empfänger.

ANPASSUNG AN UNTERNEHMENSGRÖSSE UND LEVEL:
- Großkonzern (>10.000 MA): Vorstand, Aufsichtsrat, Betriebsrat, komplexe Matrix-Organisation, mehrere Geschäftseinheiten, internationale Dimension
- Mittelstand (1.000-10.000 MA): Geschäftsführung statt Vorstand, ggf. Beirat statt Aufsichtsrat, Betriebsrat möglich aber nicht zwingend, flachere Hierarchien
- KMU (100-1.000 MA): Geschäftsführer/Inhaber, KEIN Vorstand, KEIN Aufsichtsrat, Betriebsrat nur wenn > 200 MA, weniger formelle Strukturen, persönlichere Kommunikation
- Startup/Scale-up (<100 MA): Gründer/CEO, KEIN Vorstand, KEIN Aufsichtsrat, KEIN Betriebsrat, flache Hierarchien, informelle Kommunikation, Du-Kultur möglich, agile Strukturen

Die Sprache und der Ton der E-Mails müssen zum Unternehmenstyp passen:
- Konzern: Formell, politisch korrekt, oft diplomatisch umschrieben
- Mittelstand: Professionell aber direkter, weniger Bürokratie
- KMU: Direkt, persönlich, pragmatisch
- Startup: Informell, schnell, manchmal emotional, oft englische Begriffe gemischt

Wichtige Regeln:
- Geschäftseinheiten: Großkonzern 3-5, Mittelstand 2-4, KMU 1-3, Startup 1-2
- Erstelle die EXAKTE Anzahl an E-Mails, Protokollen und Nachrichtenartikeln, die der Benutzer angibt. Wenn 30 Vorgänge gewünscht sind, erstelle MINDESTENS 30 Dokumente!
- Detaillierte Bilanz mit mindestens 8-10 Positionen pro Kategorie
- Spannungsfelder und Dilemmata zwischen den Geschäftseinheiten
- Realistische Finanzkennzahlen die zueinander passen (Umsätze in Mrd bei Konzernen, in Mio bei KMU/Startup)
- 4 Analysefragen und 4 Schlussfolgerungsfragen
- Ein Organigramm mit ALLEN in der Fallstudie vorkommenden Personen (mindestens 8-10 bei Konzernen, 5-8 bei KMU), inklusive Name, Funktion, Abteilung und Berichtslinie
- Eine individuelle Briefing-Sektion mit Rollenbeschreibung, Situationsbeschreibung und Aufgabenstellung, die exakt auf das generierte Unternehmen zugeschnitten ist (NICHT generisch)
- Eine detaillierte strategische Analyse (SWOT, BSC-Perspektiven, Quickwins) basierend auf dem Fallstudien-Szenario
- Die Sprache aller Inhalte richtet sich nach der vom Benutzer gewählten Sprache
- Antworte AUSSCHLIESSLICH mit validem JSON, kein zusätzlicher Text

Wenn ein Referenzdatum (Stichtag) angegeben ist, MÜSSEN alle Datumsangaben, Geschäftsjahre, E-Mail-Daten und Finanzkennzahlen konsistent zu diesem Stichtag sein. Das Referenzdatum ist der "heutige Tag" in der Fallstudie. Alle E-Mails sollten Daten innerhalb der letzten 1-3 Monate vor dem Stichtag haben. Finanzberichte sollten das Geschäftsjahr vor dem Stichtag abdecken.`;

const UPLOAD_PARSE_PROMPT = `Du bist ein Experte für Executive Assessment Center. Dir wird der Textinhalt eines hochgeladenen Dokuments gegeben, das eine Fallstudie für ein Assessment Center enthält.

Analysiere den Text und extrahiere/transformiere ihn in das standardisierte Fallstudien-Format. Wenn Informationen fehlen, ergänze sie intelligent und realistisch basierend auf dem Kontext.

${CASE_STUDY_SYSTEM_PROMPT.split("Wichtige Regeln:")[0]}

Wichtige Regeln:
- Behalte alle vorhandenen Informationen aus dem Originaldokument bei
- Ergänze fehlende Felder intelligent (z.B. Bilanzdaten wenn nur Umsatz gegeben)
- Erstelle realistische E-Mails basierend auf den im Dokument beschriebenen Szenarien, jede E-Mail mit vollständiger Anrede, Hauptteil, Grußformel und Signaturblock (Name, Funktion, E-Mail, Telefon)
- Jede E-Mail MUSS die Felder "category" ("internal" oder "external") und "to" enthalten
- Passe Finanzdaten an, wenn sie unvollständig sind
- Ein Organigramm mit ALLEN in der Fallstudie vorkommenden Personen (mindestens 8-10), inklusive Name, Funktion, Abteilung und Berichtslinie
- Eine individuelle Briefing-Sektion mit Rollenbeschreibung, Situationsbeschreibung und Aufgabenstellung, die exakt auf das generierte Unternehmen zugeschnitten ist (NICHT generisch)
- Antworte AUSSCHLIESSLICH mit validem JSON`;

const ROUTE_PATH = "/api/w/{workspaceSlug}/case-studies/generate";

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

  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspaceSlug },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { mode, params: genParams, isOverarchingScenario } = body;

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

      const routePath = `/api/w/${params.workspaceSlug}/case-studies/generate`;

      const result = await generateLLMOutput({
        taskName: "generate_case_study",
        featureName: "case_study_generation",
        input: userPrompt,
        route: routePath,
        options: {
          systemPrompt: CASE_STUDY_SYSTEM_PROMPT,
          responseFormat: "json",
          maxTokens: 16384,
        },
      });

      if ('aiDisabled' in result) {
        const err = create503Response("case_study_generation");
        return NextResponse.json(err.body, { status: err.status });
      }

      let parsed: any = result.data;

      const needsContinuation = (() => {
        const d = parsed.data || parsed;
        const targetDocCount = parseInt(documentCount) || 15;
        const currentDocs = (d.emails?.length || 0) + (d.protocols?.length || 0) + (d.newsArticles?.length || 0);
        return currentDocs < targetDocCount * 0.7 || !d.organigramm?.length || !parsed.briefing && !d.briefing || !parsed.questions || !d.detailedBalanceSheet;
      })();

      if (needsContinuation) {
        console.log("First response may be incomplete, requesting continuation with missing sections...");
        try {
          const pd = parsed.data || parsed;
          const existingEmailIds = (pd.emails || []).map((e: any) => e.id || e.subject).filter(Boolean);
          const existingProtocolIds = (pd.protocols || []).map((p: any) => p.id || p.title).filter(Boolean);
          const existingNewsIds = (pd.newsArticles || []).map((n: any) => n.id || n.headline).filter(Boolean);

          const existingInfo = `Bereits vorhanden: ${pd.emails?.length || 0} E-Mails (IDs: ${existingEmailIds.join(", ")}), ${pd.protocols?.length || 0} Protokolle (IDs: ${existingProtocolIds.join(", ")}), ${pd.newsArticles?.length || 0} Nachrichtenartikel (IDs: ${existingNewsIds.join(", ")}), organigramm: ${pd.organigramm?.length ? "ja" : "nein"}, briefing: ${parsed.briefing || pd.briefing ? "ja" : "nein"}, questions: ${parsed.questions ? "ja" : "nein"}, detailedBalanceSheet: ${pd.detailedBalanceSheet ? "ja" : "nein"}`;

          const targetDocCount = parseInt(documentCount) || 15;
          const remainingEmails = Math.max(0, Math.round(targetDocCount * 0.7) - (pd.emails?.length || 0));
          const remainingProtocols = Math.max(0, Math.round(targetDocCount * 0.15) - (pd.protocols?.length || 0));
          const remainingNews = Math.max(0, Math.round(targetDocCount * 0.15) - (pd.newsArticles?.length || 0));

          const contPrompt = `${existingInfo}\n\nErstelle ein JSON-Objekt mit den FEHLENDEN Abschnitten:\n- ${remainingEmails} weitere E-Mails (NICHT diese IDs wiederholen: ${existingEmailIds.join(", ")})\n- ${remainingProtocols} weitere Protokolle\n- ${remainingNews} weitere Nachrichtenartikel\n${!pd.organigramm?.length ? "- organigramm (mindestens 8 Personen)" : ""}\n${!parsed.briefing && !pd.briefing ? "- briefing" : ""}\n${!parsed.questions ? "- questions" : ""}\n${!pd.detailedBalanceSheet ? "- detailedBalanceSheet" : ""}\n\nAntworte NUR mit validem JSON.`;

          const continuationResult = await generateLLMOutput({
            taskName: "continue_generation",
            featureName: "case_study_generation",
            input: `${userPrompt}\n\n${contPrompt}`,
            route: routePath,
            options: {
              systemPrompt: CASE_STUDY_SYSTEM_PROMPT,
              responseFormat: "json",
              maxTokens: 16384,
            },
          });

          if (!('aiDisabled' in continuationResult)) {
            const contParsed: any = continuationResult.data;
            const contData = contParsed.data || contParsed;

            const dedup = (existing: any[], incoming: any[]) => {
              const existIds = new Set(existing.map((e: any) => e.id));
              const existSubjects = new Set(existing.map((e: any) => e.subject || e.title || e.headline));
              return incoming.filter((item: any) => !existIds.has(item.id) && !existSubjects.has(item.subject || item.title || item.headline));
            };

            if (contData.emails?.length) pd.emails = [...(pd.emails || []), ...dedup(pd.emails || [], contData.emails)];
            if (contData.protocols?.length) pd.protocols = [...(pd.protocols || []), ...dedup(pd.protocols || [], contData.protocols)];
            if (contData.newsArticles?.length) pd.newsArticles = [...(pd.newsArticles || []), ...dedup(pd.newsArticles || [], contData.newsArticles)];
            if (contData.organigramm?.length && !pd.organigramm?.length) pd.organigramm = contData.organigramm;
            if (contData.detailedBalanceSheet && !pd.detailedBalanceSheet) pd.detailedBalanceSheet = contData.detailedBalanceSheet;
            if (contData.balanceSheet?.length && !pd.balanceSheet?.length) pd.balanceSheet = contData.balanceSheet;
            if (contData.businessUnits?.length && !pd.businessUnits?.length) pd.businessUnits = contData.businessUnits;
            if (contData.metrics?.length && !pd.metrics?.length) pd.metrics = contData.metrics;
            if ((contParsed.briefing || contData.briefing) && !parsed.briefing && !pd.briefing) {
              parsed.briefing = contParsed.briefing || contData.briefing;
            }
            if (contParsed.questions && !parsed.questions) parsed.questions = contParsed.questions;

            console.log(`Merged continuation: total emails=${pd.emails?.length}, protocols=${pd.protocols?.length}, news=${pd.newsArticles?.length}`);
          }
        } catch (contErr) {
          console.log("Continuation merge failed, using available content:", contErr);
        }
      }

      const dataJson = parsed.data || parsed;
      if (parsed.briefing && !dataJson.briefing) {
        dataJson.briefing = parsed.briefing;
      }
      if (parsed.organigramm && !dataJson.organigramm) {
        dataJson.organigramm = parsed.organigramm;
      }
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
          isOverarchingScenario: isOverarchingScenario === true,
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

      const result = await generateLLMOutput({
        taskName: "parse_uploaded_case_study",
        featureName: "case_study_generation",
        input: `Dokument: ${fileName || "Fallstudie"}\n\nInhalt:\n${textContent}`,
        route: `/api/w/${params.workspaceSlug}/case-studies/generate`,
        options: {
          systemPrompt: UPLOAD_PARSE_PROMPT,
          responseFormat: "json",
          maxTokens: 16384,
        },
      });

      if ('aiDisabled' in result) {
        const err = create503Response("case_study_generation");
        return NextResponse.json(err.body, { status: err.status });
      }

      const parsed: any = result.data;
      const dataJson = parsed.data || parsed;
      if (parsed.briefing && !dataJson.briefing) {
        dataJson.briefing = parsed.briefing;
      }
      if (parsed.organigramm && !dataJson.organigramm) {
        dataJson.organigramm = parsed.organigramm;
      }
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
          isOverarchingScenario: isOverarchingScenario === true,
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
