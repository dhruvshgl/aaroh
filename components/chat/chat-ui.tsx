"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { QUICK_PROMPTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConversationItem = { id: string; title: string; updatedAt: string };

export function ChatShell({
  conversations,
  children,
}: {
  conversations: ConversationItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const onList = pathname === "/dashboard/chat";
  const today = new Date().toDateString();

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-4">
      <aside className={cn("rounded-3xl border border-border bg-card p-3", onList ? "block" : "hidden lg:block")}>
        <div className="flex items-center justify-between px-2 py-1">
          <h2 className="text-lg">Chats</h2>
          <Link href="/dashboard/chat" className="text-sm text-primary">
            New
          </Link>
        </div>
        <ul className="mt-2 space-y-1">
          {conversations.length === 0 ? <li className="px-2 py-3 text-sm text-muted-foreground">Ask Aaroh anything about your career.</li> : null}
          {conversations.map((conversation) => {
            const when = new Date(conversation.updatedAt).toDateString() === today ? "Today" : "Earlier";
            return (
              <li key={conversation.id}>
                <Link
                  href={`/dashboard/chat/${conversation.id}`}
                  className={cn(
                    "block rounded-2xl px-3 py-2 text-sm",
                    pathname.endsWith(conversation.id) ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                  )}
                >
                  <span className="block text-[11px] opacity-70">{when}</span>
                  {conversation.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
      <section className={cn(onList ? "hidden lg:block" : "block")}>{children}</section>
    </div>
  );
}

export function ChatThread({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: { id: string; role: string; content: string }[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);

  async function send(content: string) {
    const text = content.trim();
    if (!text || pending) return;
    setDraft("");
    setPending(true);
    const optimistic = { id: `local-${Date.now()}`, role: "user", content: text };
    setMessages((current) => [...current, optimistic, { id: "assistant-pending", role: "assistant", content: "" }]);
    const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({}));
      setMessages((current) =>
        current.map((message) =>
          message.id === "assistant-pending"
            ? { ...message, content: data.error ?? "Aaroh couldn't reply just now." }
            : message,
        ),
      );
      setPending(false);
      return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      const snapshot = full;
      setMessages((current) =>
        current.map((message) => (message.id === "assistant-pending" ? { ...message, content: snapshot } : message)),
      );
    }
    setPending(false);
  }

  return (
    <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col lg:min-h-[70dvh] lg:rounded-[2rem] lg:border lg:border-border lg:bg-card">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
        <Link href="/dashboard/chat" className="text-sm text-primary">
          Back
        </Link>
        <div>
          <p className="font-medium">Aaroh</p>
          <p className="text-xs text-muted-foreground">Career consultant</p>
        </div>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ask anything about your career. Aaroh already has your profile, report, and roadmap.</p>
        ) : null}
        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
            <p className={cn("max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-6", message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary")}>
              {message.content || (pending ? "Aaroh is thinking…" : "")}
            </p>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <div className="border-t border-border px-3 py-3">
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {QUICK_PROMPTS.map((prompt) => (
            <button key={prompt} type="button" className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs" onClick={() => void send(prompt)}>
              {prompt.replace(/:$/, "")}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask anything about your career…"
            className="field"
          />
          <Button type="submit" disabled={pending} className="h-11 rounded-full px-4">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
