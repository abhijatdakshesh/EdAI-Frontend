"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
}

export function StudentChatbot() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I'm your AI study assistant. Ask me anything about your courses, schedule, fees, or upcoming exams.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const data = await apiFetch<{ answer: string }>("/api/chatbot/query", {
        method: "POST",
        body: JSON.stringify({
          question: text,
          userId: session?.user?.id,
          language: session?.user?.preferredLanguage ?? "en",
        }),
      });
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: data.answer },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Sorry, I couldn't reach the AI service right now. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <AppShell title="AI Assistant">
      <div className="flex h-[calc(100vh-10rem)] flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[75%] rounded-lg px-4 py-3 text-sm",
                msg.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto bg-surface border border-border text-foreground"
              )}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="mr-auto max-w-[75%] rounded-lg bg-surface border border-border px-4 py-3 text-sm text-text-muted animate-pulse">
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          className="flex gap-2 border-t border-border pt-4"
          onSubmit={(e) => { e.preventDefault(); void send(); }}
        >
          <input
            className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ask anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
