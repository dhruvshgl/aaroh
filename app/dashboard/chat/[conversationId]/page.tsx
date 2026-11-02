import { notFound } from "next/navigation";
import { ChatThread } from "@/components/chat/chat-ui";
import { chatContextSummary } from "@/lib/chat/read";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const user = await requireUser();
  const { conversationId } = await params;
  const [conversation, context] = await Promise.all([
    prisma.conversation.findFirst({
      where: { id: conversationId, userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    }),
    chatContextSummary(user.id),
  ]);
  if (!conversation) notFound();
  return (
    <ChatThread
      key={conversation.id}
      conversationId={conversation.id}
      title={conversation.title}
      context={context}
      initialMessages={conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
      }))}
    />
  );
}
