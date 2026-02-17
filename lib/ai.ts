import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

export async function transcribeAudio(audioBuffer: Buffer, fileName: string): Promise<string> {
  const file = new File([audioBuffer], fileName, { type: "audio/wav" });
  const response = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
    response_format: "json",
  });
  return response.text;
}

export async function extractProposal(transcript: string): Promise<AIProposal> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: transcript },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content) as AIProposal;
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

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
    ],
    max_completion_tokens: 2048,
  });

  return response.choices[0]?.message?.content || "";
}

export async function generateTags(params: {
  title: string;
  description?: string | null;
  type: string;
  fileName?: string | null;
}): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: `Du bist ein Experte für Assessment Center und Kompetenzdiagnostik. Generiere relevante Tags/Schlagwörter für eine Übung oder Vorlage basierend auf den gegebenen Informationen. Antworte ausschließlich in validem JSON mit folgender Struktur: {"tags": ["Tag1", "Tag2", ...]}. Generiere 3-8 prägnante, relevante Tags auf Deutsch. Tags sollten Themen, Kompetenzen, Methoden oder Zielgruppen beschreiben.`,
        },
        {
          role: "user",
          content: `Titel: ${params.title}\nTyp: ${params.type}${params.description ? `\nBeschreibung: ${params.description}` : ""}${params.fileName ? `\nDateiname: ${params.fileName}` : ""}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 256,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.tags)) {
      return parsed.tags.filter((t: unknown) => typeof t === "string" && t.trim().length > 0);
    }
    return [];
  } catch (error) {
    console.error("AI tag generation failed:", error);
    return [];
  }
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
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: REQUIREMENTS_EXTRACTION_PROMPT },
      { role: "user", content: text },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content) as RequirementsExtraction;
}
