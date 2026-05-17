"use client";

import { useRef, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
}

/**
 * Lesson-scoped doubt chat. Seeds the chatbot prompt with the lesson title
 * and body so replies are grounded. Cascades authed REST → public Gemini.
 */
export function DoubtChat({
  lessonTitle,
  lessonBody,
}: {
  lessonTitle: string;
  lessonBody: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Ask me anything about "${lessonTitle}". I'll use this lesson as context.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text: q }]);
    const prompt = [
      `You are tutoring a student on the lesson "${lessonTitle}".`,
      `Use only the lesson body below as your primary context; if the question is outside it, say so briefly then answer concisely.`,
      `LESSON BODY:\n${lessonBody.slice(0, 1800)}`,
      ``,
      `STUDENT QUESTION: ${q}`,
      `Answer in ≤ 120 words. Use Markdown if helpful.`,
    ].join("\n\n");
    try {
      let answer = "";
      try {
        const r = await apiFetch<{ message: string }>("/api/chatbot/message", {
          method: "POST",
          body: JSON.stringify({ message: prompt }),
        });
        answer = r.message;
      } catch {
        const r = await apiFetch<{ message: string }>("/api/chatbot/public/ask", {
          method: "POST",
          body: JSON.stringify({ message: prompt }),
        });
        answer = r.message;
      }
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", text: answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text: "Sorry — I couldn't reach the AI service. Try again in a moment.",
        },
      ]);
    } finally {
      setBusy(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  return (
    <div className="rounded border border-border bg-surface p-3 flex flex-col h-[600px]">
      <p className="label-track mb-2">Ask Ed8AI · This lesson</p>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "rounded px-3 py-2 text-xs",
              m.role === "user"
                ? "ml-auto bg-[#1C1810] text-cream-50 max-w-[85%]"
                : "mr-auto bg-cream-50 border border-border max-w-[90%]",
            )}
          >
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="mr-auto bg-cream-50 border border-border rounded px-3 py-2 text-xs text-text-muted">
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="mt-2 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Why does FCFS cause convoy effect?"
          className="flex-1 rounded border border-border bg-background px-2 py-1.5 text-xs focus:outline-none"
          disabled={busy}
        />
        <Button type="submit" size="sm" disabled={busy || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
