import type { LlmProvider, LlmRequest, LlmResponse } from "../types";

export class NeulandProvider implements LlmProvider {
  key = "neuland" as const;
  name = "Neuland AI";
  region = "EU (DSGVO)";

  isAvailable(): boolean {
    return false;
  }

  async chat(request: LlmRequest): Promise<LlmResponse> {
    void request;
    throw new Error("Neuland AI Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.");
  }

  async generateStructured<T>(input: string, schema: Record<string, unknown>, context?: Record<string, unknown>): Promise<LlmResponse<T>> {
    void input; void schema; void context;
    throw new Error("Neuland AI Provider ist noch nicht konfiguriert. Bitte kontaktieren Sie den Administrator.");
  }
}
