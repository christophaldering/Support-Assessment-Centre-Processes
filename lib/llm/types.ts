export type ComplianceMode = "innovation" | "eu_secure" | "hybrid";
export type ProviderKey = "openai" | "neuland" | "azure_openai_eu";

export interface LlmRequest {
  prompt: string;
  systemPrompt?: string;
  schema?: Record<string, unknown>;
  context?: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
  feature?: string;
}

export interface LlmResponse<T = unknown> {
  data: T;
  provider: ProviderKey;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  blocked?: boolean;
  fallback?: boolean;
}

export interface LlmProvider {
  key: ProviderKey;
  name: string;
  region: string;
  chat(request: LlmRequest): Promise<LlmResponse>;
  generateStructured<T>(input: string, schema: Record<string, unknown>, context?: Record<string, unknown>): Promise<LlmResponse<T>>;
  isAvailable(): boolean;
}

export interface AiGovernanceSettings {
  activeLlmProvider: ProviderKey;
  aiMasterDisabled: boolean;
  aiFeaturesDisabled: string[];
  complianceMode: ComplianceMode;
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

export const PROVIDER_INFO: Record<ProviderKey, { name: string; region: string; description: string }> = {
  openai: { name: "OpenAI", region: "US/Global", description: "GPT-4o — Innovation Mode, maximale Leistung" },
  neuland: { name: "Neuland AI", region: "EU (DSGVO)", description: "EU-gehostete KI — Sichere Verarbeitung in der EU" },
  azure_openai_eu: { name: "Azure OpenAI EU", region: "EU (Azure)", description: "Azure-gehostetes OpenAI — EU-Rechenzentrum" },
};
