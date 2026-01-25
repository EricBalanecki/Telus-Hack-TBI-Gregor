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

const buildResponse = (prompt: string) => {
  const lower = prompt.toLowerCase();
  if (lower.includes("progress") || lower.includes("trend")) {
    return (
      "Based on your recent sessions, focus on consistency. " +
      "If your scores are rising, keep the same cadence. If they dipped, " +
      "shorter, more frequent sessions often help stabilize performance."
    );
  }
  if (lower.includes("motor")) {
    return (
      "Motor control improves with steady, repeatable drills. " +
      "Aim for smooth, deliberate movements and short breaks between sets."
    );
  }
  if (lower.includes("tbi") || lower.includes("visual")) {
    return (
      "Visual tracking supports TBI recovery by rebuilding eye movement control " +
      "and attention shifting. Small, frequent sessions help reduce fatigue " +
      "while reinforcing accuracy."
    );
  }
  if (lower.includes("heart") || lower.includes("bpm")) {
    return (
      "If your heart rate rises during exercises, slow down and take a short break. " +
      "Use the heart rate prompts to pause or recalibrate your baseline, and aim " +
      "for steady breathing before continuing."
    );
  }
  return (
    "I can help you review progress and explain exercises. " +
    "Ask about trends, accuracy, or how to improve motor control."
  );
};

export default function CoachPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const hasInput = input.trim().length > 0;

  const canShowPrompts = !hasInput && messages.length === 0;

  const handleClose = () => {
    setIsOpen(false);
    setInput("");
    setMessages([]);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };
    const assistantMessage: ChatMessage = {
      id: `${Date.now()}-assistant`,
      role: "assistant",
      content: buildResponse(trimmed),
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
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
            Ask about progress, accuracy, or how motor control improves TBI recovery.
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
                  Ask about your current progress, accuracy trends, or tips for motor control.
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
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      message.role === "user"
                        ? "bg-emerald-500/20 text-emerald-100"
                        : "bg-zinc-900/80 text-zinc-200"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {canShowPrompts && (
              <div className="flex flex-wrap gap-2 border-t border-zinc-800 px-4 py-3">
                {promptChips}
              </div>
            )}

            <div className="flex items-center gap-2 border-t border-zinc-800 px-4 py-3">
              <input
                className="flex-1 rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-emerald-400/60"
                placeholder="Ask about progress or motor control..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSend();
                  }
                }}
              />
              <button
                className="rounded-full border border-emerald-400/60 px-3 py-2 text-emerald-200 transition hover:bg-emerald-500/10"
                onClick={handleSend}
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
