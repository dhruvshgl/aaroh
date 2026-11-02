import { ChatStart } from "@/components/chat/chat-ui";
import { chatContextSummary } from "@/lib/chat/read";
import { requireUser } from "@/lib/session";

export default async function ChatIndexPage() {
  const user = await requireUser();
  const context = await chatContextSummary(user.id);
  return <ChatStart context={context} />;
}
