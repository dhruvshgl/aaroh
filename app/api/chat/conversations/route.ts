import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api";
import { buildCareerContext } from "@/lib/chat/context";
import { asUntrusted, getChatModel, getOpenAI } from "@/lib/ai/client";
import { PROMPT_VERSION } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 80) : "New conversation";
  const conversation = await prisma.conversation.create({ data: { userId, title } });
  return NextResponse.json({ conversation }, { status: 201 });
}

export async function conversationFor(userId: string, id: string) {
  return prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function streamReply(userId: string, conversationId: string, content: string) {
  const conversation = await conversationFor(userId, conversationId);
  if (!conversation) return jsonError("Conversation not found.", 404);
  const text = content.trim();
  if (text.length < 1 || text.length > 4000) return jsonError("Write a message under 4,000 characters.");

  try {
    await consumeRateLimit(userId, "chat");
  } catch (error) {
    if (error instanceof RateLimitError) return jsonError(error.message, 429);
    throw error;
  }

  await prisma.message.create({
    data: { conversationId, userId, role: "user", content: text },
  });
  if (conversation.title === "New conversation") {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: text.slice(0, 64) },
    });
  }

  const context = await buildCareerContext(userId);
  const history = conversation.messages.slice(-12).map((message) => ({
    role: message.role === "assistant" ? "assistant" as const : "user" as const,
    content: message.content,
  }));

  const encoder = new TextEncoder();
  const started = Date.now();
  let model = "unconfigured";
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        model = getChatModel();
        const client = getOpenAI();
        const response = await client.responses.create(
          {
            model,
            stream: true,
            reasoning: { effort: "minimal" },
            input: [
              {
                role: "developer",
                content: [
                  "You are Aaroh, a personal career consultant.",
                  "Answer from the career context. Do not invent employers, metrics, or skills.",
                  "Separate what is known from what you are inferring.",
                  "If the person wants a new roadmap, tell them to use Adjust Plan so the saved roadmap is regenerated from their gaps.",
                  "Be specific, calm, and practical.",
                  asUntrusted("Career context", context),
                ].join("\n\n"),
              },
              ...history,
              { role: "user", content: text },
            ],
          },
          { timeout: 60_000 },
        );
        for await (const event of response) {
          if (event.type === "response.output_text.delta") {
            full += event.delta;
            controller.enqueue(encoder.encode(event.delta));
          }
        }
        await prisma.aiRun.create({
          data: {
            userId,
            kind: "chat",
            model,
            promptVersion: PROMPT_VERSION,
            durationMs: Date.now() - started,
            status: "completed",
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Chat failed";
        if (!full) {
          full = "Aaroh couldn't finish that reply. Check that the AI model is configured, then try again.";
          controller.enqueue(encoder.encode(full));
        }
        await prisma.aiRun.create({
          data: {
            userId,
            kind: "chat",
            model,
            promptVersion: PROMPT_VERSION,
            durationMs: Date.now() - started,
            status: "failed",
            error: message.slice(0, 500),
          },
        });
      } finally {
        if (full.trim()) {
          await prisma.message.create({
            data: { conversationId, userId, role: "assistant", content: full },
          });
        }
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
