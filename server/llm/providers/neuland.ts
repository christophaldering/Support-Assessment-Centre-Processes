import type { LlmProvider, GenerateLLMInput, LlmOutput } from "../types";

export class NeulandProvider implements LlmProvider {
  key = "neuland" as const;
  name = "Neuland AI";
  region = "EU (DSGVO)";

  isAvailable(): boolean {
    return false;
  }

  async chat(_input: GenerateLLMInput): Promise<LlmOutput> {
    throw new Error("Neuland AI Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.");
  }

  async generateStructured<T>(_input: GenerateLLMInput): Promise<LlmOutput<T>> {
    throw new Error("Neuland AI Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.");
  }
}
