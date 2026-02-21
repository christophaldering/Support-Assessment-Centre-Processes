import { generateLLMOutput, transcribeAudio as adapterTranscribe } from "@/server/llm/adapter";
import type { LlmDisabledOutput } from "@/server/llm/types";

export interface AIProposal {
  targetRole: {
    title: string;
    level: string;
    context: string;
  };
  successCriteria: string[];
  competencies: {
    name: string;
    nodeType: string;
    description: string;
    children: {
      name: string;
      nodeType: string;
      description: string;
      anchors?: string[];
    }[];
  }[];
  risks: string[];
  exercises: {
    name: string;
    type: string;
    duration: number;
    instructions: string;
    difficultyLevel: string;
    competencyMappings: string[];
  }[];
  scale: {
    name: string;
    type: string;
    points: { value: number; label: string; description: string }[];
  };
  weightings: {
    competencyName: string;
    weight: number;
  }[];
  assessmentName: string;
  assessmentDescription: string;
}

const EXTRACTION_SYSTEM_PROMPT = `Du bist ein Experte für Executive Assessment Center und Kompetenzdiagnostik.
Analysiere den folgenden Text (ein Transkript oder eine Anforderungsanalyse) und extrahiere daraus einen strukturierten Vorschlag für ein Assessment Center.

Antworte ausschließlich in validem JSON mit folgender Struktur:
{
  "targetRole": {
    "title": "Rollenbezeichnung",
    "level": "Ebene (z.B. C-Level, Direktor, Senior Manager)",
    "context": "Kurze Beschreibung des Kontexts und der Organisation"
  },
  "successCriteria": ["Erfolgskriterium 1", "Erfolgskriterium 2", ...],
  "competencies": [
    {
      "name": "Kompetenzdomäne",
      "nodeType": "domain",
      "description": "Beschreibung",
      "children": [
        {
          "name": "Einzelkompetenz",
          "nodeType": "competency",
          "description": "Beschreibung",
          "anchors": ["Verhaltensanker 1", "Verhaltensanker 2"]
        }
      ]
    }
  ],
  "risks": ["Risiko/Red Flag 1", "Risiko/Red Flag 2"],
  "exercises": [
    {
      "name": "Übungsname",
      "type": "presentation|interview|group_discussion|case_study|role_play|in_tray|psychometric|other",
      "duration": 30,
      "instructions": "Kurze Anweisungen",
      "difficultyLevel": "standard|erhöht|hoch",
      "competencyMappings": ["Kompetenzname 1", "Kompetenzname 2"]
    }
  ],
  "scale": {
    "name": "Bewertungsskala",
    "type": "likert",
    "points": [
      {"value": 1, "label": "Deutlich unter Erwartung", "description": "Kompetenz nicht erkennbar"},
      {"value": 2, "label": "Unter Erwartung", "description": "Kompetenz ansatzweise erkennbar"},
      {"value": 3, "label": "Entspricht Erwartung", "description": "Kompetenz klar erkennbar"},
      {"value": 4, "label": "Über Erwartung", "description": "Kompetenz deutlich ausgeprägt"},
      {"value": 5, "label": "Deutlich über Erwartung", "description": "Kompetenz herausragend"}
    ]
  },
  "weightings": [
    {"competencyName": "Kompetenzname", "weight": 1.0}
  ],
  "assessmentName": "Name des Assessment Centers",
  "assessmentDescription": "Beschreibung"
}

Wichtig:
- Erstelle 4-8 Kompetenzen, gruppiert in 2-4 Domänen
- Erstelle 3-6 Übungen passend zur Zielrolle
- Gewichtungen sollten sich auf 1.0 summieren (pro Übung)
- Berücksichtige die Schwierigkeitsstufe der Übungen
- Alle Texte auf Deutsch`;

function isDisabled(result: unknown): result is LlmDisabledOutput {
  return typeof result === "object" && result !== null && "aiDisabled" in result;
}

export async function transcribeAudio(audioBuffer: Buffer, fileName: string): Promise<string> {
  const result = await adapterTranscribe(audioBuffer, fileName, {
    featureName: "audio_transcription",
    route: "/lib/ai/transcribeAudio",
  });
  if (isDisabled(result)) {
    throw new Error("AI ist deaktiviert: Audio-Transkription nicht verfügbar.");
  }
  return result;
}

export async function extractProposal(transcript: string): Promise<AIProposal> {
  const result = await generateLLMOutput<AIProposal>({
    taskName: "extract_proposal",
    featureName: "competency_generation",
    route: "/lib/ai/extractProposal",
    input: transcript,
    options: {
      systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      responseFormat: "json",
      maxTokens: 8192,
    },
  });
  if (isDisabled(result)) {
    throw new Error("AI ist deaktiviert: Proposal-Extraktion nicht verfügbar.");
  }
  return result.data;
}

export async function coCreationQuestion(
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  currentStep: string
): Promise<string> {
  const systemPrompt = `Du bist ein Assessment-Center-Berater, der interaktiv ein Assessment Center plant.
Du befindest dich im Schritt: ${currentStep}.
Stelle gezielte Fragen, um die nötigen Informationen zu sammeln.
Antworte auf Deutsch, professionell und prägnant.
Wenn du genügend Informationen hast, fasse zusammen und frage nach Bestätigung.`;

  const conversationText = conversationHistory
    .map((m) => `${m.role === "user" ? "Benutzer" : "Berater"}: ${m.content}`)
    .join("\n\n");

  const result = await generateLLMOutput<string>({
    taskName: "co_creation_question",
    featureName: "competency_generation",
    route: "/lib/ai/coCreationQuestion",
    input: conversationText || "Starte die Beratung.",
    options: {
      systemPrompt,
      maxTokens: 2048,
    },
  });
  if (isDisabled(result)) {
    return "AI ist derzeit deaktiviert. Bitte versuchen Sie es später erneut.";
  }
  return String(result.data) || "";
}

export async function generateTagsAndTitle(params: {
  title: string;
  description?: string | null;
  type: string;
  fileName?: string | null;
  sourceContext?: string | null;
  author?: string | null;
}): Promise<{ tags: string[]; suggestedTitle: string }> {
  try {
    const result = await generateLLMOutput<{ tags: string[]; suggestedTitle: string }>({
      taskName: "generate_tags_title",
      featureName: "exercise_analysis",
      route: "/lib/ai/generateTagsAndTitle",
      input: `Titel: ${params.title}\nTyp: ${params.type}${params.description ? `\nBeschreibung: ${params.description}` : ""}${params.fileName ? `\nDateiname: ${params.fileName}` : ""}${params.sourceContext ? `\nUrsprünglich konzipiert für: ${params.sourceContext}` : ""}${params.author ? `\nAutor: ${params.author}` : ""}`,
      options: {
        systemPrompt: `Du bist ein Experte für Assessment Center und Kompetenzdiagnostik. Analysiere die folgenden Informationen über einen Assessment-Baustein und generiere:
1. Einen spezifischen, beschreibenden Titel (suggestedTitle) basierend auf dem Inhalt. Format: "[Übungstyp] – [Kontext/Unternehmen] – [Kurzbeschreibung]" z.B. "Interview-Leitfaden – Varexia SE – CFO-Nachfolge Strategiegespräch"
2. 5-10 relevante Tags auf Deutsch, die UNBEDINGT enthalten sollen (wenn aus den Informationen ableitbar):
   - Name des simulierten Unternehmens (z.B. "Varexia SE", "TechCorp GmbH")
   - Rolle/Position (z.B. "CFO", "Vorstandsvorsitzender", "Bereichsleiter")
   - Gesprächspartner / wer spricht mit wem (z.B. "Mitarbeitergespräch", "Vorstandsdialog", "Kundengespräch")
   - Kompetenzen und Themen (z.B. "Strategisches Denken", "Konfliktmanagement")
   - Methode/Format (z.B. "Einzelinterview", "Gruppendiskussion", "Rollenspiel")

Antworte ausschließlich in validem JSON: {"suggestedTitle": "...", "tags": ["Tag1", "Tag2", ...]}`,
        responseFormat: "json",
        maxTokens: 512,
        model: "gpt-4o",
      },
    });
    if (isDisabled(result)) {
      return { tags: [], suggestedTitle: params.title };
    }
    const data = result.data;
    const tags = Array.isArray(data.tags)
      ? data.tags.filter((t: unknown) => typeof t === "string" && (t as string).trim().length > 0)
      : [];
    const suggestedTitle = typeof data.suggestedTitle === "string" && data.suggestedTitle.trim()
      ? data.suggestedTitle.trim()
      : params.title;
    return { tags, suggestedTitle };
  } catch (error) {
    console.error("AI tag+title generation failed:", error);
    return { tags: [], suggestedTitle: params.title };
  }
}

export async function generateTags(params: {
  title: string;
  description?: string | null;
  type: string;
  fileName?: string | null;
}): Promise<string[]> {
  const result = await generateTagsAndTitle(params);
  return result.tags;
}

export async function coCreationExtract(
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<AIProposal> {
  const fullConversation = conversationHistory
    .map((m) => `${m.role === "user" ? "Benutzer" : "Berater"}: ${m.content}`)
    .join("\n\n");

  return extractProposal(fullConversation);
}

export interface Person {
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  email: string;
}

export interface Candidate {
  firstName: string;
  lastName: string;
  currentRole: string;
  currentCompany: string;
  phone: string;
  email: string;
}

export interface Competency {
  name: string;
  description: string;
  selected: boolean;
}

export interface AssessmentModule {
  name: string;
  type: string;
  description: string;
  adaptationNotes: string;
  generationPrompt: string;
  selected: boolean;
}

export interface RequirementsExtraction {
  analysisDate: string;
  analysisForm: string;
  participants: string[];

  company: string;
  targetRole: string;
  startDate: string;

  assessmentDate: string;
  assessmentType: string;
  assessmentDuration: string;

  leadConsultant: Person;
  secondConsultant: Person | null;
  additionalObservers: Person[];

  candidates: Candidate[];

  specificQuestions: string[];
  successCriteria: string[];

  competencies: Competency[];
  assessmentModules: AssessmentModule[];
}

const REQUIREMENTS_EXTRACTION_PROMPT = `Du bist ein Experte für Executive Assessment Center und Kompetenzdiagnostik.
Analysiere den folgenden Text — dies ist ein Mitschrieb, eine Zusammenfassung oder ein Transkript einer Anforderungsanalyse.
Extrahiere alle verfügbaren Informationen und generiere Empfehlungen.

Antworte ausschließlich in validem JSON mit folgender Struktur:
{
  "analysisDate": "Datum der Anforderungsanalyse (z.B. 15.03.2025) oder '' wenn unbekannt",
  "analysisForm": "telefonisch|remote|persönlich oder '' wenn unbekannt",
  "participants": ["Name 1", "Name 2"],

  "company": "Unternehmensname oder '' wenn unbekannt",
  "targetRole": "Ziel-Funktion/Rolle oder '' wenn unbekannt",
  "startDate": "Besetzung ab wann oder '' wenn unbekannt",

  "assessmentDate": "Durchführungstermin oder '' wenn unbekannt",
  "assessmentType": "präsent|remote|hybrid oder '' wenn unbekannt",
  "assessmentDuration": "Dauer in Stunden oder '' wenn unbekannt",

  "leadConsultant": {"firstName": "", "lastName": "", "role": "Berater", "phone": "", "email": ""},
  "secondConsultant": {"firstName": "", "lastName": "", "role": "Zweit-Berater", "phone": "", "email": ""} oder null,
  "additionalObservers": [{"firstName": "", "lastName": "", "role": "", "phone": "", "email": ""}],

  "candidates": [{"firstName": "", "lastName": "", "currentRole": "", "currentCompany": "", "phone": "", "email": ""}],

  "specificQuestions": ["Ausführliche spezifische Fragestellung 1", "Fragestellung 2"],
  "successCriteria": ["Stellenspezifisches Erfolgsmerkmal 1 (was muss der Kandidat besonders gut können)", "Erfolgsmerkmal 2"],

  "competencies": [
    {"name": "Kompetenzname", "description": "Kurzbeschreibung der Kompetenz im Kontext der Anforderung", "selected": true}
  ],
  "assessmentModules": [
    {
      "name": "Modulname (z.B. Strategische Fallstudie)",
      "type": "presentation|interview|case_study|role_play|group_discussion|in_tray|fact_finding|psychometric|other",
      "description": "Was dieses Modul beobachtbar macht und warum es passt",
      "adaptationNotes": "Wie dieses Modul spezifisch für diese Anforderung angepasst werden sollte",
      "generationPrompt": "Detaillierter Prompt/Anweisung zur Erstellung dieses Assessment-Bausteins: Beschreibe Szenario, Aufgabenstellung, Zeitrahmen, erwartetes Verhalten, Bewertungskriterien",
      "selected": true
    }
  ]
}

Wichtige Regeln:
- Extrahiere NUR Informationen, die tatsächlich im Text enthalten sind. Felder ohne Info = leer lassen ('')
- Bei Erfolgsmerkmalen: Formuliere prägnant, was der Kandidat insbesondere gut können muss (z.B. "versteht es, komplexe Zusammenhänge einfach zu vermitteln")
- Generiere 3-8 stellenspezifische Erfolgsmerkmale
- Bei Kompetenzen: Extrahiere relevante Anforderungskriterien/Kompetenzen, die im Assessment beobachtet und beurteilt werden sollen. Möglichst NICHT zu viele (max 6-8). Kurze, prägnante Namen (z.B. "Einfühlungsvermögen", "Komplexitätsreduzierung")
- Bei Assessment-Bausteinen: Identifiziere relevante Beurteilungsmodule. Möglichst NICHT zu viele (3-5). Jedes Modul MUSS einen detaillierten generationPrompt enthalten
- Alle spezifischen Fragestellungen ausführlich in Bullet-Points extrahieren
- Alle Texte auf Deutsch`;

export async function extractRequirementsAnalysis(text: string): Promise<RequirementsExtraction> {
  const result = await generateLLMOutput<RequirementsExtraction>({
    taskName: "extract_requirements",
    featureName: "competency_generation",
    route: "/lib/ai/extractRequirementsAnalysis",
    input: text,
    options: {
      systemPrompt: REQUIREMENTS_EXTRACTION_PROMPT,
      responseFormat: "json",
      maxTokens: 8192,
    },
  });
  if (isDisabled(result)) {
    throw new Error("AI ist deaktiviert: Anforderungsanalyse-Extraktion nicht verfügbar.");
  }
  return result.data;
}
