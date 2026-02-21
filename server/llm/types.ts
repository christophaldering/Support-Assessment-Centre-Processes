export type ProviderKey = "openai" | "neuland" | "azure_eu";

export interface GenerateLLMInput {
  taskName: string;
  featureName: string;
  input: string;
  schema?: Record<string, unknown>;
  options?: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    context?: Record<string, unknown>;
    responseFormat?: "text" | "json";
  };
}

export interface LlmOutput<T = unknown> {
  data: T;
  provider: ProviderKey;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  aiDisabled?: boolean;
  blocked?: boolean;
}

export interface LlmDisabledOutput {
  aiDisabled: true;
  content: null;
}

export interface LlmProvider {
  key: ProviderKey;
  name: string;
  region: string;
  chat(input: GenerateLLMInput): Promise<LlmOutput>;
  generateStructured<T>(input: GenerateLLMInput): Promise<LlmOutput<T>>;
  isAvailable(): boolean;
}

export const AI_FEATURES = [
  { key: "competency_generation", label: "Kompetenzmodell-Generierung" },
  { key: "exercise_generation", label: "Übungs-Generierung" },
  { key: "case_study_generation", label: "Fallstudien-Generierung" },
  { key: "observation_analysis", label: "Beobachtungsbogen-Analyse" },
  { key: "report_generation", label: "Gutachten-Generierung" },
  { key: "intelligence_predictive", label: "Predictive Intelligence" },
  { key: "intelligence_development", label: "Development Path Generator" },
  { key: "intelligence_hypotheses", label: "Diagnostic Hypotheses" },
  { key: "brand_parsing", label: "Style-Guide-Analyse" },
  { key: "exercise_matching", label: "Exercise Matching" },
  { key: "exercise_analysis", label: "Exercise Content Analysis" },
  { key: "audio_transcription", label: "Audio-Transkription" },
  { key: "mtmm_suggestions", label: "MTMM-Vorschläge" },
] as const;

export type AiFeatureKey = typeof AI_FEATURES[number]["key"];

export const PROVIDER_INFO: Record<ProviderKey, { name: string; region: string; description: string; status: "active" | "stub" | "placeholder" }> = {
  openai: { name: "OpenAI", region: "US/Global", description: "GPT-4o — Innovation Mode, maximale Leistung", status: "active" },
  neuland: { name: "Neuland AI", region: "EU (DSGVO)", description: "EU-gehostete KI — Sichere Verarbeitung in der EU", status: "stub" },
  azure_eu: { name: "Azure OpenAI EU", region: "EU (Azure)", description: "Azure-gehostetes OpenAI — EU-Rechenzentrum", status: "placeholder" },
};
