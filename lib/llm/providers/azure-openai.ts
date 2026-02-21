import type { LlmProvider, LlmRequest, LlmResponse } from "../types";

export class AzureOpenAIProvider implements LlmProvider {
  key = "azure_openai_eu" as const;
  name = "Azure OpenAI EU";
  region = "EU (Azure)";

  isAvailable(): boolean {
    return false;
  }

  async chat(request: LlmRequest): Promise<LlmResponse> {
    void request;
    throw new Error("Azure OpenAI EU Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.");
  }

  async generateStructured<T>(input: string, schema: Record<string, unknown>, context?: Record<string, unknown>): Promise<LlmResponse<T>> {
    void input; void schema; void context;
    throw new Error("Azure OpenAI EU Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.");
  }
}
