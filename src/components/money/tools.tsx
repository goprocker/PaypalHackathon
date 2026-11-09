"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { goalSchema, monthsToGoal, type Goal, type Share } from "@/lib/money";
import { zodMessages } from "@/lib/pay";
import { formatInr } from "@/lib/truecost";
import { cn } from "@/lib/utils";

const panel = "glass space-y-4 rounded-2xl p-5";

function useStored<T>(key: string, fallback: T) {
  const [v, setV] = useState<T>(fallback);
  // localStorage is only readable after mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setV(JSON.parse(raw) as T);
    } catch {}
  }, [key]);
  const save = (next: T) => {
    setV(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  };
  return [v, save] as const;
}

function Bar({ pct, state }: { pct: number; state: "ok" | "near" | "over" }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full", state === "over" ? "bg-bad" : state === "near" ? "bg-warn" : "bg-accent-fill")} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

// ---------- Budgets (limits kept in this browser) ----------

export function BudgetEditor({ owner, rows }: { owner: string; rows: { category: string; limitPaise: number; spentPaise: number }[] }) {
  const [limits, setLimits] = useStored<Record<string, number>>(`payhub_budgets_${owner}`, {});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function save(category: string) {
    const n = Number(draft);
    if (!draft.trim() || !Number.isFinite(n) || n < 0) return setError("Enter a limit in rupees, 0 or more.");
    if (n > 1_000_000) return setError("Limit is too large. Keep it under ₹10,00,000.");
    setLimits({ ...limits, [category]: Math.round(n * 100) });
    setEditing(null);
    setError(null);
  }

  return (
    <ul className={cn(panel, "space-y-4")}>
      {rows.map((r) => {
        const limit = limits[r.category] ?? r.limitPaise;
        const pct = limit ? Math.round((r.spentPaise / limit) * 100) : r.spentPaise ? 100 : 0;
        const state = pct >= 100 ? "over" : pct >= 80 ? "near" : "ok";
        return (
          <li key={r.category} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{r.category}</span>
              <span className="tabular text-muted">{formatInr(r.spentPaise)} / {formatInr(limit)} · <span className={cn(state === "over" && "text-bad", state === "near" && "text-warn")}>{pct}%</span></span>
            </div>
            <Bar pct={pct} state={state} />
            {editing === r.category ? (
              <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); save(r.category); }}>
                <Label className="min-w-0 flex-1">
                  New monthly limit (₹)
                  <Input inputMode="decimal" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} aria-invalid={!!error} />
                </Label>
                <Button type="submit" variant="accent">Save</Button>
                <Button type="button" variant="ghost" onClick={() => { setEditing(null); setError(null); }}>Cancel</Button>
                {error && <p role="alert" className="w-full text-sm text-bad">{error}</p>}
              </form>
            ) : (
              <button type="button" className="min-h-11 text-xs font-medium text-accent hover:underline" onClick={() => { setEditing(r.category); setDraft(String(limit / 100)); setError(null); }}>
                Change limit
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ---------- Savings goals (added goals kept in this browser) ----------

export function Goals({ owner, initial }: { owner: string; initial: Goal[] }) {
  const [goals, setGoals] = useStored<Goal[]>(`payhub_goals_${owner}`, initial);
  const [form, setForm] = useState({ name: "", target: "", saved: "0", monthly: "" });
  const [errors, setErrors] = useState<string[]>([]);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const r = goalSchema.safeParse(form);
    if (!r.success) return setErrors(zodMessages(r.error));
    const g = r.data;
    setGoals([...goals, { id: crypto.randomUUID(), name: g.name, targetPaise: Math.round(g.target * 100), savedPaise: Math.round(g.saved * 100), monthlyPaise: Math.round(g.monthly * 100) }]);
    setForm({ name: "", target: "", saved: "0", monthly: "" });
    setErrors([]);
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <ul className="space-y-3">
        {goals.length === 0 && <li className="glass rounded-2xl p-5 text-sm text-muted">No goals yet. Add one to start saving towards it.</li>}
        {goals.map((g) => {
          const pct = Math.round((g.savedPaise / g.targetPaise) * 100);
          const months = monthsToGoal(g);
          return (
            <li key={g.id} className="glass space-y-2 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{g.name}</h3>
                <button type="button" aria-label={`Remove ${g.name}`} className="grid size-11 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-bad" onClick={() => setGoals(goals.filter((x) => x.id !== g.id))}>
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </div>
              <p className="tabular text-sm">{formatInr(g.savedPaise)} <span className="text-muted">of {formatInr(g.targetPaise)} · {pct}%</span></p>
              <Bar pct={pct} state="ok" />
              <p className="text-xs text-muted">
                {months === 0 ? "Reached. Well done!" : months === null ? "Add a monthly amount to see when you'll get there." : `${formatInr(g.monthlyPaise)} a month · about ${months} month${months === 1 ? "" : "s"} to go`}
              </p>
            </li>
          );
        })}
      </ul>
      <form onSubmit={add} className={panel} noValidate>
        <h3 className="font-semibold">Add a goal</h3>
        <Label>Name<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="New laptop" /></Label>
        <div className="grid grid-cols-2 gap-3">
          <Label>Target (₹)<Input inputMode="decimal" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="80000" /></Label>
          <Label>Saved so far (₹)<Input inputMode="decimal" value={form.saved} onChange={(e) => setForm({ ...form, saved: e.target.value })} /></Label>
        </div>
        <Label>Save each month (₹)<Input inputMode="decimal" value={form.monthly} onChange={(e) => setForm({ ...form, monthly: e.target.value })} placeholder="5000" /></Label>
        {errors.length > 0 && <ul role="alert" className="space-y-1 text-sm text-bad">{errors.map((m) => <li key={m}>{m}</li>)}</ul>}
        <Button type="submit" variant="accent"><Plus aria-hidden />Add goal</Button>
      </form>
    </div>
  );
}

// ---------- Family privacy (cookie, so the server hides what you chose) ----------

const SHARE_TEXT: Record<Share, [string, string]> = {
  items: ["Every item", "Family sees each payment, except ones you mark private."],
  categories: ["Category totals", "Family sees how much per category, not the items."],
  total: ["Monthly total only", "Family sees one number for your month."],
};

export function PrivacySetting({ current, name }: { current: Share; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const change = (share: Share) =>
    start(async () => {
      setError(null);
      const r = await fetch("/api/privacy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ share }) }).catch(() => null);
      if (!r?.ok) return setError("Could not save. Check your connection and try again.");
      router.refresh();
    });
  return (
    <fieldset className={panel} disabled={pending}>
      <legend className="sr-only">What {name} shares with the family</legend>
      <p className="flex items-center gap-2 font-semibold">What your family sees of {name}&apos;s spending {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}</p>
      {(Object.keys(SHARE_TEXT) as Share[]).map((s) => (
        <label key={s} className={cn("flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3", current === s ? "border-accent bg-accent/10" : "border-border")}>
          <input type="radio" name="share" className="mt-1 size-5 shrink-0 accent-[var(--accent)]" checked={current === s} onChange={() => change(s)} />
          <span><span className="block text-sm font-medium">{SHARE_TEXT[s][0]}</span><span className="block text-xs text-muted">{SHARE_TEXT[s][1]}</span></span>
        </label>
      ))}
      <p className="text-xs text-muted">Items marked private are never shown to anyone else. They appear as one &quot;Private&quot; total.</p>
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
    </fieldset>
  );
}
