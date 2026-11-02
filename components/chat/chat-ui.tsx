"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, Eye, Loader2, MessageCircle, Plus, RotateCcw, Square } from "lucide-react";
import { createConversation } from "@/app/actions/career";
import { Markdown } from "@/components/chat/markdown";
import { Button } from "@/components/ui/button";
import { QUICK_PROMPTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ConversationItem = { id: string; title: string; updatedAt: string; when: string };
export type ChatContext = { hasReport: boolean; hasRoadmap: boolean; projectCount: number };

const MAX_CHARS = 4000;
const PENDING_KEY = "aaroh:pending-prompt";

function NewChatButton({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <form action={createConversation}>
      <NewChatSubmit className={className}>{children}</NewChatSubmit>
    </form>
  );
}

function NewChatSubmit({ className, children }: { className?: string; children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="pill-sm" disabled={pending} className={className}>
      {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {children ?? "New chat"}
    </Button>
  );
}

export function ChatShell({ conversations, children }: { conversations: ConversationItem[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const onList = pathname === "/dashboard/chat";

  return (
    <div className="mx-auto max-w-6xl lg:grid lg:h-[calc(100dvh-7rem)] lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-4">
      <aside
        aria-label="Conversations"
        className={cn("surface flex-col p-3 lg:flex lg:min-h-0", onList ? "mb-4 flex lg:mb-0" : "hidden")}
      >
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <h2 className="font-serif text-h3">Conversations</h2>
          <NewChatButton className="h-9" />
        </div>
        {conversations.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <MessageCircle className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
            <p className="mt-2 text-small text-muted-foreground">No conversations yet. Your chats with Aaroh will appear here.</p>
          </div>
        ) : (
          <ul className="mt-2 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
            {conversations.map((conversation) => {
              const active = pathname.endsWith(conversation.id);
              return (
                <li key={conversation.id}>
                  <Link
                    href={`/dashboard/chat/${conversation.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative block min-h-12 rounded-xl px-3 py-2 text-small transition-colors",
                      active ? "bg-primary/[0.08] font-medium text-primary" : "hover:bg-secondary",
                    )}
                  >
                    {active ? <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary" aria-hidden="true" /> : null}
                    <span className="line-clamp-1">{conversation.title}</span>
                    <span className="block text-caption font-normal text-muted-foreground">{conversation.when}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
      <section className="lg:min-h-0">{children}</section>
    </div>
  );
}

/** Empty state for /dashboard/chat with prominent starter prompts. */
export function ChatStart({ context }: { context: ChatContext }) {
  return (
    <div className="surface flex h-full flex-col items-center justify-center px-5 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
        <MessageCircle className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-h1">Ask Aaroh</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Your consultant already knows your file, so you don&apos;t need to explain it again.
      </p>
      <ContextChip context={context} className="mt-4" />
      <form action={createConversation} className="mt-8 w-full max-w-xl">
        <p className="text-small font-medium">Start with a question</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {QUICK_PROMPTS.filter((prompt) => !prompt.endsWith(":")).map((prompt) => (
            <button
              key={prompt}
              type="submit"
              name="title"
              value={prompt}
              onClick={() => {
                try {
                  window.sessionStorage.setItem(PENDING_KEY, prompt);
                } catch {
                  // Session storage unavailable; the conversation still opens.
                }
              }}
              className="min-h-11 rounded-full border border-border bg-card px-4 text-small hover:border-primary/50 hover:bg-secondary/50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </form>
      <div className="mt-6">
        <NewChatButton>Start a blank conversation</NewChatButton>
      </div>
    </div>
  );
}

function ContextChip({ context, className }: { context: ChatContext; className?: string }) {
  const parts = [
    "your profile",
    context.hasReport ? "report" : null,
    context.hasRoadmap ? "roadmap" : null,
    context.projectCount ? `${context.projectCount} ${context.projectCount === 1 ? "project" : "projects"}` : null,
  ].filter(Boolean) as string[];
  const text = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
  return (
    <p className={cn("inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-caption text-muted-foreground", className)}>
      <Eye className="size-3.5" aria-hidden="true" />
      Aaroh can see: {text}
    </p>
  );
}

type Message = { id: string; role: string; content: string; status?: "streaming" | "stopped" | "error" };

export function ChatThread({
  conversationId,
  title,
  initialMessages,
  context,
}: {
  conversationId: string;
  title: string;
  initialMessages: { id: string; role: string; content: string }[];
  context: ChatContext;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ text: string; retry?: string } | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const controller = useRef<AbortController | null>(null);
  const counter = useRef(0);

  function scrollToBottom(smooth = false) {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  // Follow new content only when the reader is already near the bottom.
  useLayoutEffect(() => {
    if (atBottom) scrollToBottom();
  }, [messages, atBottom]);


  function resize() {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  async function send(content: string) {
    const text = content.trim();
    if (!text || pending || text.length > MAX_CHARS) return;
    setNotice(null);
    setDraft("");
    requestAnimationFrame(resize);
    setPending(true);
    setAtBottom(true);
    counter.current += 1;
    const userId = `local-user-${counter.current}`;
    const replyId = `local-reply-${counter.current}`;
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", content: text },
      { id: replyId, role: "assistant", content: "", status: "streaming" },
    ]);

    const abort = new AbortController();
    controller.current = abort;
    const update = (patch: Partial<Message>) =>
      setMessages((current) => current.map((message) => (message.id === replyId ? { ...message, ...patch } : message)));

    let response: Response;
    try {
      response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
        signal: abort.signal,
      });
    } catch {
      setMessages((current) => current.filter((message) => message.id !== replyId && message.id !== userId));
      setNotice({ text: "Couldn't reach Aaroh. Check your connection.", retry: text });
      setPending(false);
      return;
    }

    if (!response.ok || !response.body) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      // Nothing was saved server-side for these errors, so remove the optimistic pair.
      setMessages((current) => current.filter((message) => message.id !== replyId && message.id !== userId));
      if (response.status === 429) {
        setDraft(text);
        setNotice({ text: data.error ?? "You've reached this hour's chat limit. Try again shortly." });
      } else {
        setNotice({ text: data.error ?? "Aaroh couldn't reply just now.", retry: text });
      }
      setPending(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        update({ content: full });
      }
      update({ status: undefined });
    } catch {
      update({ status: abort.signal.aborted ? "stopped" : "error" });
    } finally {
      controller.current = null;
      setPending(false);
      input.current?.focus();
    }
  }

  // Send a starter prompt chosen on the chat home screen.
  useEffect(() => {
    let prompt: string | null = null;
    try {
      prompt = window.sessionStorage.getItem(PENDING_KEY);
      window.sessionStorage.removeItem(PENDING_KEY);
    } catch {
      prompt = null;
    }
    if (!prompt || initialMessages.length) return;
    const timer = setTimeout(() => void send(prompt), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const promptsRow = QUICK_PROMPTS.map((prompt) => (
    <button
      key={prompt}
      type="button"
      disabled={pending}
      onClick={() => {
        if (prompt.endsWith(":")) {
          setDraft(`${prompt} `);
          requestAnimationFrame(() => {
            resize();
            input.current?.focus();
          });
        } else {
          void send(prompt);
        }
      }}
      className="min-h-9 shrink-0 rounded-full border border-border bg-card px-3 text-caption hover:border-primary/50 disabled:opacity-50"
    >
      {prompt.replace(/:$/, "…")}
    </button>
  ));

  const over = draft.length > MAX_CHARS;

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-card lg:h-full lg:rounded-card lg:border lg:border-border lg:shadow-[var(--shadow-soft)]">
      <header className="flex items-center gap-2 border-b border-border px-2 py-2 lg:px-5 lg:py-3">
        <Link
          href="/dashboard/chat"
          className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-secondary lg:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-serif text-h3">{title}</h1>
          <p className="text-caption text-muted-foreground">Aaroh · career consultant</p>
        </div>
      </header>

      <p className="sr-only" aria-live="polite">
        {pending ? "Aaroh is replying…" : messages.length ? "Reply ready." : ""}
      </p>
      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          onScroll={(event) => {
            const el = event.currentTarget;
            setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 120);
          }}
          className="h-full space-y-4 overflow-y-auto px-4 py-5 lg:px-6"
          aria-busy={pending}
        >
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-lg flex-col items-center py-8 text-center">
              <p className="font-serif text-h2">What&apos;s on your mind?</p>
              <p className="mt-2 text-small text-muted-foreground">Ask anything about your career. Try one of these:</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">{promptsRow}</div>
            </div>
          ) : null}
          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              {message.role === "user" ? (
                <p className="max-w-[85%] rounded-[1.25rem] rounded-br-md bg-primary px-4 py-2.5 text-small leading-6 whitespace-pre-wrap text-primary-foreground">
                  {message.content}
                </p>
              ) : (
                <div className="max-w-[90%] rounded-[1.25rem] rounded-bl-md bg-secondary px-4 py-3">
                  {message.content ? (
                    <Markdown content={message.content} />
                  ) : (
                    <span className="flex h-6 items-center gap-1" role="status" aria-label="Aaroh is typing">
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className="size-2 rounded-full bg-muted-foreground"
                          style={{ animation: `typing-dot 1.2s ${dot * 0.15}s infinite ease-in-out` }}
                        />
                      ))}
                    </span>
                  )}
                  {message.status === "stopped" ? <p className="mt-2 text-caption text-muted-foreground">Stopped.</p> : null}
                  {message.status === "error" ? <p className="mt-2 text-caption text-danger-foreground">The reply was cut off.</p> : null}
                </div>
              )}
            </div>
          ))}
        </div>
        {!atBottom ? (
          <button
            type="button"
            onClick={() => {
              setAtBottom(true);
              scrollToBottom(true);
            }}
            className="absolute bottom-3 left-1/2 inline-flex min-h-10 -translate-x-1/2 animate-fade-in items-center gap-1.5 rounded-full bg-card px-4 text-small shadow-[var(--shadow-raised)] ring-1 ring-border"
          >
            <ArrowDown className="size-4" aria-hidden="true" />
            Jump to latest
          </button>
        ) : null}
      </div>

      <div className="border-t border-border px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:px-5">
        {notice ? (
          <div role="alert" className="mb-2 flex items-start justify-between gap-3 rounded-xl bg-warning-soft px-3 py-2 text-small text-warning-foreground">
            <span className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {notice.text}
            </span>
            {notice.retry ? (
              <button
                type="button"
                onClick={() => void send(notice.retry!)}
                className="inline-flex shrink-0 items-center gap-1 font-medium underline-offset-2 hover:underline"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Retry
              </button>
            ) : null}
          </div>
        ) : null}

        {messages.length > 0 ? (
          <div className="relative mb-2">
            <div className="scrollbar-none flex gap-2 overflow-x-auto px-1 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-24px),transparent)]">
              {promptsRow}
            </div>
          </div>
        ) : null}

        <ContextChip context={context} className="mb-2" />

        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Message Aaroh
          </label>
          <div className="relative flex-1">
            <textarea
              id="chat-input"
              ref={input}
              rows={1}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                resize();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
              placeholder="Ask anything about your career…"
              aria-describedby="chat-hint"
              aria-invalid={over ? true : undefined}
              className="field max-h-[200px] min-h-11 resize-none py-2.5 leading-6"
              style={{ minHeight: "2.75rem" }}
            />
          </div>
          {pending ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => controller.current?.abort()}
              className="size-11 rounded-full bg-card"
              aria-label="Stop generating"
            >
              <Square className="size-4 fill-current" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!draft.trim() || over} className="size-11 rounded-full" aria-label="Send message">
              <ArrowUp className="size-5" aria-hidden="true" />
            </Button>
          )}
        </form>
        <p id="chat-hint" className="mt-1.5 flex justify-between gap-2 px-1 text-caption text-muted-foreground">
          <span className="hidden sm:inline">Enter to send · Shift + Enter for a new line</span>
          {draft.length > MAX_CHARS - 500 ? (
            <span className={cn("ml-auto", over && "font-medium text-danger-foreground")}>
              {draft.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
