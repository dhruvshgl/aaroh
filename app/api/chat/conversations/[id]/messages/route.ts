import { streamReply } from "@/app/api/chat/conversations/route";
import { jsonError, requireApiUser } from "@/lib/api";

export const maxDuration = 60;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (typeof body?.content !== "string") return jsonError("Write a message.");
  return streamReply(userId, id, body.content);
}
