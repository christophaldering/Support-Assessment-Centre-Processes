import { NextRequest } from "next/server";
import { getWorkspaceAuth, hasMasterAuth, getUserSession } from "@/lib/session";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface RouteContext {
  params: { workspaceSlug: string };
}

const SYSTEM_PROMPT = `Du bist ein KI-Assistent für Executive Assessment Center. 
Du unterstützt Assessoren, Projektteams und HR-Verantwortliche mit Expertise in:
- Kompetenzbasierter Diagnostik und Assessment Center Design
- Beobachtungsbögen, Ratings und Konsolidierung
- Kandidatenentwicklung und Potenzialanalyse
- Assessmentberichten und Rückmeldungen
Antworte präzise, professionell und auf Deutsch.`;

export async function POST(req: NextRequest, { params }: RouteContext) {
  const wsAuth = getWorkspaceAuth();
  const masterAuth = hasMasterAuth();
  const userSession = getUserSession();

  const authorized =
    masterAuth ||
    wsAuth === params.workspaceSlug ||
    userSession?.workspaceSlug === params.workspaceSlug;

  if (!authorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { messages: { role: string; content: string }[]; context?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const messages = body.messages ?? [];
  if (!messages.length) {
    return new Response("No messages", { status: 400 });
  }

  const systemContent = body.context
    ? `${SYSTEM_PROMPT}\n\nAktueller Kontext:\n${body.context}`
    : SYSTEM_PROMPT;

  const apiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...messages.map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
      content: m.content,
    })),
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: apiMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 1024,
        });

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
