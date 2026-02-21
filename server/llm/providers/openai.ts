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

  async chat(input: GenerateLLMInput): Promise<LlmOutput> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    if (input.options?.systemPrompt) {
      messages.push({ role: "system", content: input.options.systemPrompt });
    }
    messages.push({ role: "user", content: input.input });

    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: input.options?.temperature ?? 0.7,
      max_tokens: input.options?.maxTokens ?? 4096,
    });

    const choice = response.choices[0]!;
    return {
      data: choice.message.content,
      provider: this.key,
      model: "gpt-4o",
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  }

  async generateStructured<T>(input: GenerateLLMInput): Promise<LlmOutput<T>> {
    const systemPrompt = `Du bist ein Experte für Executive Assessment Center und Kompetenzdiagnostik.
Antworte ausschließlich im angegebenen JSON-Schema-Format.
${input.options?.context ? `\nKontext: ${JSON.stringify(input.options.context)}` : ""}`;

    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: input.options?.systemPrompt || systemPrompt },
        { role: "user", content: `${input.input}\n\nAntworte im folgenden JSON-Schema:\n${JSON.stringify(input.schema, null, 2)}` },
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
      model: "gpt-4o",
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  }
}
