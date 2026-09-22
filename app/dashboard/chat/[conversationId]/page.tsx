import { notFound } from "next/navigation";
import { ChatThread } from "@/components/chat/chat-ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const user = await requireUser();
  const { conversationId } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) notFound();
  return (
    <ChatThread
      conversationId={conversation.id}
      initialMessages={conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
      }))}
    />
  );
}
