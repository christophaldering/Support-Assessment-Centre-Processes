import type { LlmProvider, GenerateLLMInput, LlmOutput } from "../types";

export class AzureEUProvider implements LlmProvider {
  key = "azure_eu" as const;
  name = "Azure OpenAI EU";
  region = "EU (Azure)";

  isAvailable(): boolean {
    return false;
  }

  async chat(_input: GenerateLLMInput): Promise<LlmOutput> {
    throw new Error("Azure OpenAI EU Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.");
  }

  async generateStructured<T>(_input: GenerateLLMInput): Promise<LlmOutput<T>> {
    throw new Error("Azure OpenAI EU Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.");
  }
}
