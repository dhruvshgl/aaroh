import { conversationFor } from "@/app/api/chat/conversations/route";
import { jsonError, requireApiUser } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser();
  if (!auth.userId) return auth.error;
  const userId = auth.userId;
  const { id } = await context.params;
  const conversation = await conversationFor(userId, id);
  if (!conversation) return jsonError("Conversation not found.", 404);
  return NextResponse.json({ conversation });
}
