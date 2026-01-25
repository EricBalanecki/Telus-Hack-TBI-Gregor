"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const promptSuggestions = [
  "How is my progress trending this week?",
  "What should I focus on to improve motor control?",
  "Explain how visual tracking helps TBI recovery.",
  "What does a good session look like?",
  "What should I do if my heart rate rises during exercises?",
];

export default function CoachPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasInput = input.trim().length > 0;

  const canShowPrompts = !hasInput && messages.length === 0 && !isSending;

  const handleClose = () => {
    setIsOpen(false);
    setInput("");
    setMessages([]);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await fetch("http://localhost:8000/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Coach request failed");
      }

      const data = (await response.json()) as { reply?: string };
      const replyText = data.reply?.trim();
      if (!replyText) {
        throw new Error("Empty coach response");
      }

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: replyText,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Coach request failed", error);
      setErrorMessage(
        "Coach Gregor could not respond. Please try again in a moment.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const promptChips = useMemo(
    () =>
      promptSuggestions.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="rounded-full border border-zinc-700 px-4 py-2 text-xs text-zinc-200 transition hover:border-emerald-400/60 hover:text-emerald-200"
          onClick={() => setInput(prompt)}
        >
          {prompt}
        </button>
      )),
    [],
  );

  return (
    <div className="min-h-screen text-white">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 pb-16 pt-12">
        <div className="flex flex-col gap-2 text-left">
          <h1 className="text-3xl font-semibold tracking-tight">
            Coach Gregor
          </h1>
          <p className="text-sm text-zinc-400">
            Ask about progress, accuracy, or how motor control improves TBI
            recovery.
          </p>
        </div>

        {!isOpen ? (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-6 py-6 text-sm text-white shadow-lg backdrop-blur transition hover:border-emerald-400/60"
            onClick={() => setIsOpen(true)}
            type="button"
          >
            <MessageCircle className="h-5 w-5 text-emerald-300" />
            Start a new chat
          </button>
        ) : (
          <div className="flex flex-1 flex-col rounded-2xl border border-zinc-800 bg-zinc-950/70 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.3em] text-zinc-400">
                Coach Gregor
              </div>
              <button
                className="rounded-full border border-zinc-700 p-2 text-zinc-200 hover:border-emerald-400/60 hover:text-emerald-200"
                onClick={handleClose}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4 text-sm text-zinc-300">
                  Ask about your current progress, accuracy trends, or tips for
                  motor control.
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${
                      message.role === "user"
                        ? "bg-emerald-500/20 text-emerald-100"
                        : "bg-zinc-900/80 text-zinc-200"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-zinc-900/80 px-4 py-3 text-sm text-zinc-200">
                    Coach Gregor is thinking...
                  </div>
                </div>
              )}
            </div>

            {canShowPrompts && (
              <div className="flex flex-wrap gap-2 border-t border-zinc-800 px-4 py-3">
                {promptChips}
              </div>
            )}

            {errorMessage && (
              <div className="border-t border-zinc-800 px-4 py-3">
                <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  {errorMessage}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 border-t border-zinc-800 px-4 py-3">
              <input
                className="flex-1 rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-emerald-400/60"
                placeholder="Ask about progress or motor control..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !isSending) {
                    handleSend();
                  }
                }}
              />
              <button
                className="rounded-full border border-emerald-400/60 px-3 py-2 text-emerald-200 transition hover:bg-emerald-500/10"
                onClick={handleSend}
                disabled={isSending}
                type="button"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
