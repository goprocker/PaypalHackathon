"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const PEOPLE = [
  { id: "u_me", name: "Arun", role: "Me" },
  { id: "u_mom", name: "Lakshmi", role: "Mom" },
  { id: "u_dad", name: "Ravi", role: "Dad" },
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
    <Card>
      <CardHeader className="flex-col items-start gap-1">
        <h2 className="font-semibold">Sign in as a family member</h2>
        <p className="text-sm text-muted">Demo accounts. Each sees the family hub from their own side.</p>
      </CardHeader>
      <CardContent className="grid gap-2">
        {PEOPLE.map((p) => (
          <button
            key={p.id}
            onClick={() => login(p.id)}
            disabled={busy !== null}
            className="group flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-accent hover:bg-surface-2 disabled:opacity-60"
          >
            <span className="grid size-9 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent">{p.name[0]}</span>
            <span className="flex-1">
              <span className="block text-sm font-medium">{p.name}</span>
              <span className="block text-xs text-muted">{p.role}</span>
            </span>
            {busy === p.id ? (
              <Loader2 aria-label="Signing in" className="size-4 animate-spin text-muted" />
            ) : (
              <ChevronRight aria-hidden className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
            )}
          </button>
        ))}
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      </CardContent>
    </Card>
  );
}
