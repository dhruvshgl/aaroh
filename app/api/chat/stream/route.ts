import { streamReply } from "@/app/api/chat/conversations/route";
import { jsonError, requireApiUser } from "@/lib/api";

export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const body = await request.json().catch(() => null);
  if (typeof body?.conversationId !== "string" || typeof body?.content !== "string") {
    return jsonError("A conversation and message are required.");
  }
  return streamReply(userId, body.conversationId, body.content);
}
