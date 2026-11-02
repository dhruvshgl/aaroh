import { ChatShell } from "@/components/chat/chat-ui";
import { relativeDay } from "@/lib/chat/read";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <ChatShell
      conversations={conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        updatedAt: conversation.updatedAt.toISOString(),
        when: relativeDay(conversation.updatedAt),
      }))}
    >
      {children}
    </ChatShell>
  );
}
