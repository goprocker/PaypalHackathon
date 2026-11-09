"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Turn { role: "user" | "assistant"; content: string; agents?: string[]; links?: { href: string; label: string }[] }


export function ChatBox({ suggestions, agentNames }: { suggestions: string[]; agentNames: Record<string, string> }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Turn[] = [...turns, { role: "user" as const, content: q }].slice(-20);
    setTurns(next);
    setInput("");
    setBusy(true);
    setError(null);
    const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }) }).catch(() => null);
    setBusy(false);
    const body = res?.ok ? ((await res.json()) as { reply: string; agents: string[]; links: Turn["links"] }) : null;
    if (!body) return setError("No answer came back. Send your question again.");
    setTurns([...next, { role: "assistant", content: body.reply, agents: body.agents, links: body.links }]);
  }

  return (
    <div className="space-y-4">
      <div className="min-h-64 space-y-4 pb-2" aria-live="polite">
        {turns.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted">Try one of these:</p>
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="block w-full rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm transition-colors hover:border-accent">
                {s}
              </button>
            ))}
          </div>
        )}
        {turns.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-fg">{t.content}</div>
          ) : (
            <div key={i} className="flex max-w-[90%] gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/15 text-accent"><Sparkles aria-hidden className="size-3.5" /></span>
              <div className="min-w-0 space-y-2 pt-0.5">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{t.content}</div>
                {!!t.agents?.length && <p className="text-xs text-muted">{t.agents.map((a) => agentNames[a] ?? a).join(" → ")}</p>}
                {!!t.links?.length && (
                  <div className="flex flex-wrap gap-2">
                    {t.links.map((l) => <Link key={l.href} href={l.href} className="inline-flex min-h-9 items-center rounded-full border border-border px-3 text-xs font-medium hover:border-accent">{l.label} →</Link>)}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
        {busy && <div className="h-5 w-32 animate-pulse rounded bg-surface-2" aria-label="Thinking" />}
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className={cn("sticky bottom-24 md:bottom-4 flex gap-2 rounded-2xl border border-border bg-surface p-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)]")}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
          placeholder="Ask about your money"
          aria-label="Your question"
          className="border-0 focus-visible:ring-0"
        />
        <Button disabled={busy || !input.trim()} size="icon" aria-label="Send">
          <ArrowUp aria-hidden />
        </Button>
      </form>
    </div>
  );
}
