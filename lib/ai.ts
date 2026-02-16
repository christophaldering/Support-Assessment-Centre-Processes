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

export async function coCreationExtract(
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<AIProposal> {
  const fullConversation = conversationHistory
    .map((m) => `${m.role === "user" ? "Benutzer" : "Berater"}: ${m.content}`)
    .join("\n\n");

  return extractProposal(fullConversation);
}
