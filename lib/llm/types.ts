export type { ProviderKey, GenerateLLMInput, LlmOutput, LlmDisabledOutput, AiFeatureKey } from "@/server/llm/types";
export { AI_FEATURES, PROVIDER_INFO } from "@/server/llm/types";

export type ComplianceMode = "innovation" | "eu_secure" | "hybrid";

export interface AiGovernanceSettings {
  activeLlmProvider: import("@/server/llm/types").ProviderKey;
  aiMasterDisabled: boolean;
  aiFeaturesDisabled: string[];
  complianceMode: ComplianceMode;
}

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
  provider: import("@/server/llm/types").ProviderKey;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  blocked?: boolean;
  fallback?: boolean;
}

export interface LlmProvider {
  key: import("@/server/llm/types").ProviderKey;
  name: string;
  region: string;
  chat(request: LlmRequest): Promise<LlmResponse>;
  generateStructured<T>(input: string, schema: Record<string, unknown>, context?: Record<string, unknown>): Promise<LlmResponse<T>>;
  isAvailable(): boolean;
}
