import { createConversation } from "@/app/actions/career";
import { Button } from "@/components/ui/button";

export default function ChatIndexPage() {
  return (
    <div className="flex min-h-[50dvh] flex-col items-start justify-center rounded-[2rem] border border-dashed border-border p-6">
      <h1 className="text-4xl">Ask Aaroh</h1>
      <p className="mt-2 max-w-md text-muted-foreground">The consultant already knows your profile, report, roadmap, and projects. You do not need to explain them again.</p>
      <form action={createConversation} className="mt-6">
        <Button type="submit" className="h-11 rounded-full">Start a conversation</Button>
      </form>
    </div>
  );
}
