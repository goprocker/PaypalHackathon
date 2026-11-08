"use client";

import { useState } from "react";

interface Turn { role: "user" | "assistant"; content: string }

const SUGGESTIONS = ["How much did I spend on Food?", "How much budget does the family have left?", "What would a $120 jacket really cost?"];

export function ChatBox() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next = [...turns, { role: "user" as const, content: q }].slice(-20);
    setTurns(next);
    setInput("");
    setBusy(true);
    setError(null);
    const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) }).catch(() => null);
    setBusy(false);
    const body = res?.ok ? ((await res.json()) as { reply: string }) : null;
    if (!body) return setError("Could not get an answer. Try again.");
    setTurns([...next, { role: "assistant", content: body.reply }]);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 space-y-3" aria-live="polite">
        {turns.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="min-h-9 rounded-full bg-surface-2 px-3 text-sm">{s}</button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${t.role === "user" ? "ml-auto bg-primary text-primary-fg" : "bg-surface-2"}`}>
            {t.content}
          </div>
        ))}
        {busy && <div className="w-24 animate-pulse rounded-2xl bg-surface-2 px-3 py-2 text-sm text-muted">Thinking…</div>}
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
          placeholder="Ask about your money…"
          aria-label="Your question"
          className="min-h-11 flex-1 rounded-xl border border-border bg-surface px-3"
        />
        <button disabled={busy || !input.trim()} className="min-h-11 rounded-xl bg-primary px-4 text-primary-fg disabled:opacity-60">Send</button>
      </form>
    </div>
  );
}
