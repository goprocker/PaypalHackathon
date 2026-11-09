"use client";

import { ChevronRight, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SCENARIOS, type ScenarioId } from "@/lib/demo/data";
import { cn } from "@/lib/utils";

async function post(scenario: ScenarioId | null) {
  const res = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario }) });
  return res.ok ? ((await res.json()) as { href?: string }) : null;
}

/** One tap loads a scenario and jumps to the screen that shows it. */
export function ScenarioPicker({ active }: { active: ScenarioId | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<ScenarioId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(id: ScenarioId) {
    setBusy(id);
    setError(null);
    const out = await post(id);
    setBusy(null);
    if (!out?.href) return setError("Could not load that scenario. Try again.");
    router.push(out.href);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <ul className="grid gap-2 md:grid-cols-2">
        {SCENARIOS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => load(s.id)}
              disabled={busy !== null}
              className={cn("glass flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-colors hover:border-accent/50 disabled:opacity-60", active === s.id && "border-accent")}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{s.title}</span>
                <span className="block text-sm text-muted">{s.desc}</span>
              </span>
              {busy === s.id ? <Loader2 aria-hidden className="size-5 animate-spin text-accent" /> : <ChevronRight aria-hidden className="size-5 text-muted" />}
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
    </div>
  );
}

export function ExitScenario() {
  const router = useRouter();
  return (
    <button type="button" aria-label="Exit demo scenario" onClick={async () => { await post(null); router.refresh(); }} className="grid size-8 place-items-center rounded-full hover:bg-white/10">
      <X aria-hidden className="size-4" />
    </button>
  );
}
