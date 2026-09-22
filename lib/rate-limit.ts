import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function windowStart(action: "analysis" | "chat") {
  const now = new Date();
  if (action === "analysis") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()),
  );
}

function limitFor(action: "analysis" | "chat") {
  const raw =
    action === "analysis"
      ? process.env.ANALYSIS_DAILY_LIMIT
      : process.env.CHAT_HOURLY_LIMIT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return action === "analysis" ? 5 : 40;
  }
  return parsed;
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export async function consumeRateLimit(userId: string, action: "analysis" | "chat") {
  const start = windowStart(action);
  const limit = limitFor(action);
  const row = await prisma.rateLimit.upsert({
    where: {
      userId_action_windowStart: { userId, action, windowStart: start },
    },
    create: { userId, action, windowStart: start, count: 1 },
    update: { count: { increment: 1 } },
  });

  if (row.count > limit) {
    await prisma.rateLimit.update({
      where: { id: row.id },
      data: { count: { decrement: 1 } },
    });
    throw new RateLimitError(
      action === "analysis"
        ? "You have reached today's analysis limit. Try again tomorrow."
        : "You have reached this hour's chat limit. Try again shortly.",
    );
  }
}

export function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
