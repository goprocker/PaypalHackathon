"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PEOPLE = [
  { id: "u_me", label: "Me (Arun)" },
  { id: "u_mom", label: "Mom (Lakshmi)" },
  { id: "u_dad", label: "Dad (Ravi)" },
];

export function DemoLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(userId: string) {
    setBusy(userId);
    setError(null);
    const res = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    setBusy(null);
    if (!res.ok) return setError("Could not sign in. Try again.");
    router.push("/pay");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 text-sm font-semibold">Try the demo family</div>
      <div className="grid gap-2">
        {PEOPLE.map((p) => (
          <button
            key={p.id}
            onClick={() => login(p.id)}
            disabled={busy !== null}
            className="min-h-11 rounded-xl bg-primary px-4 text-primary-fg disabled:opacity-60"
          >
            {busy === p.id ? "Signing in…" : p.label}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-bad">{error}</p>}
    </div>
  );
}
