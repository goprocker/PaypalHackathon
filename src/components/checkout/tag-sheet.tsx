"use client";

import { CircleCheck, Lock, User, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatInr, formatUsd } from "@/lib/truecost";

type Tag = "me" | "family" | "private";

interface Proof {
  transactionId: string;
  paypalOrderId: string | null;
  captureId: string | null;
  item: string;
  merchant: string;
  amountCents: number | null;
  fxRate: number | null;
  feesPaise: number;
  totalPaise: number;
  tag: Tag;
  paidAt: string;
}

export function TagSheet({ txnId, defaultItem }: { txnId: string; defaultItem: string }) {
  const [item, setItem] = useState(defaultItem);
  const [proof, setProof] = useState<Proof | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(tag: Tag) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ txnId, tag, item }) });
    setBusy(false);
    if (!res.ok) return setError("Could not save. Try again.");
    setProof((await res.json()).proof);
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tag-title" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl">
        {!proof ? (
          <>
            <h2 id="tag-title" className="text-lg font-bold">What did you buy?</h2>
            <input aria-label="Item" className="mt-3 h-12 w-full rounded-xl border border-border bg-surface px-3 text-sm focus-visible:border-accent focus-visible:outline-none" value={item} onChange={(e) => setItem(e.target.value)} maxLength={200} />
            <p className="mt-4 text-sm text-muted">Who is it for?</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button disabled={busy} onClick={() => save("me")} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-border text-sm font-medium transition-colors hover:border-primary hover:bg-primary/5">
                <User aria-hidden className="size-4" /> Me
              </button>
              <button disabled={busy} onClick={() => save("family")} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-border text-sm font-medium text-good transition-colors hover:border-good hover:bg-good/5">
                <Users aria-hidden className="size-4" /> Family
              </button>
              <button disabled={busy} onClick={() => save("private")} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border border-border text-sm font-medium text-private transition-colors hover:border-private hover:bg-private/5">
                <Lock aria-hidden className="size-4" /> Private
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">Private: family sees the amount as “Personal – Other”, never the item.</p>
            {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}
          </>
        ) : (
          <>
            <h2 id="tag-title" className="flex items-center gap-2 text-lg font-bold">
              <CircleCheck aria-hidden className="size-5 text-good" /> Paid and saved
            </h2>
            <div className="amount mt-4 text-4xl">{formatInr(proof.totalPaise)}</div>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 border-t border-border pt-4 text-sm tabular">
              <dt className="text-muted">Item</dt><dd>{proof.item}</dd>
              <dt className="text-muted">Merchant</dt><dd>{proof.merchant}</dd>
              {proof.amountCents != null && <><dt className="text-muted">Charged</dt><dd>{formatUsd(proof.amountCents)}</dd></>}
              {proof.fxRate != null && <><dt className="text-muted">Rate used</dt><dd>₹{proof.fxRate.toFixed(2)} / USD</dd></>}
              <dt className="text-muted">Fees (est.)</dt><dd>{formatInr(proof.feesPaise)}</dd>
              <dt className="text-muted">Total (est.)</dt><dd className="font-semibold">{formatInr(proof.totalPaise)}</dd>
              <dt className="text-muted">Order ID</dt><dd className="break-all">{proof.paypalOrderId}</dd>
              <dt className="text-muted">Capture ID</dt><dd className="break-all">{proof.captureId}</dd>
              <dt className="text-muted">Time</dt><dd>{new Date(proof.paidAt).toLocaleString("en-IN")}</dd>
            </dl>
            <Link href="/hub" className="mt-6 flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-fg hover:bg-primary/90">Open Money Hub</Link>
          </>
        )}
      </div>
    </div>
  );
}
