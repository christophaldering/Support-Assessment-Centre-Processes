import OpenAI from "openai";
import type { LlmProvider, GenerateLLMInput, LlmOutput } from "../types";

export class OpenAIProvider implements LlmProvider {
  key = "openai" as const;
  name = "OpenAI";
  region = "US/Global";
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }

  isAvailable(): boolean {
    return !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY);
  }

  getClient(): OpenAI {
    return this.client;
  }

  async chat(input: GenerateLLMInput): Promise<LlmOutput> {
    const model = input.options?.model || "gpt-4o";
    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    if (input.options?.systemPrompt) {
      messages.push({ role: "system", content: input.options.systemPrompt });
    }
    messages.push({ role: "user", content: input.input });

    const response = await this.client.chat.completions.create({
      model,
      messages,
      temperature: input.options?.temperature ?? 0.7,
      max_tokens: input.options?.maxTokens ?? 4096,
    });

    const choice = response.choices[0]!;
    return {
      data: choice.message.content,
      provider: this.key,
      model,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  }

  async generateStructured<T>(input: GenerateLLMInput): Promise<LlmOutput<T>> {
    const model = input.options?.model || "gpt-4o";
    const defaultSystemPrompt = `Du bist ein Experte für Executive Assessment Center und Kompetenzdiagnostik.
Antworte ausschließlich im angegebenen JSON-Schema-Format.
${input.options?.context ? `\nKontext: ${JSON.stringify(input.options.context)}` : ""}`;

    const userContent = input.schema
      ? `${input.input}\n\nAntworte im folgenden JSON-Schema:\n${JSON.stringify(input.schema, null, 2)}`
      : input.input;

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: input.options?.systemPrompt || defaultSystemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: input.options?.temperature ?? 0.5,
      max_tokens: input.options?.maxTokens ?? 8192,
      response_format: { type: "json_object" },
    });

    const choice = response.choices[0]!;
    let parsed: T;
    try {
      parsed = JSON.parse(choice.message.content || "{}") as T;
    } catch {
      parsed = choice.message.content as unknown as T;
    }

    return {
      data: parsed,
      provider: this.key,
      model,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  }

  async transcribeAudio(audioBuffer: Buffer, fileName: string, model?: string): Promise<string> {
    const file = new File([audioBuffer], fileName, { type: "audio/wav" });
    const response = await this.client.audio.transcriptions.create({
      file,
      model: model || "gpt-4o-mini-transcribe",
      response_format: "json",
    });
    return response.text;
  }
}
