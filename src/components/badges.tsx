import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import type { Verdict } from "@/lib/verdict";

export function MockBadge({ label = "Demo" }: { label?: string }) {
  return (
    <span title="Simulated for demo" className="rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 text-xs font-medium text-warn">
      {label}
    </span>
  );
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const good = verdict.verdict === "GOOD FOR YOU";
  const Icon = good ? CheckCircle2 : AlertTriangle;
  const tone = good ? "text-good border-good/40 bg-good/10" : verdict.verdict === "THINK AGAIN" ? "text-warn border-warn/40 bg-warn/10" : "text-bad border-bad/40 bg-bad/10";
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${tone}`}>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div>
        <div className="font-semibold">{verdict.verdict}</div>
        <div className="text-sm text-text">{verdict.reason}</div>
        <div className="mt-1 text-xs text-muted">{verdict.source === "ai" ? "AI verdict" : "Rule-based verdict"}</div>
      </div>
    </div>
  );
}

export function TagChip({ tag }: { tag: "me" | "family" | "private" | null }) {
  if (!tag) return <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">Untagged</span>;
  const map = {
    me: ["Me", "bg-primary/10 text-primary"],
    family: ["Family", "bg-good/10 text-good"],
    private: ["Private", "bg-private/10 text-private"],
  } as const;
  const [label, cls] = map[tag];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {tag === "private" && <Lock aria-hidden className="size-3" />}
      {label}
    </span>
  );
}
