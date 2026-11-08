"use client";

import { Lock } from "lucide-react";
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
    <div role="dialog" aria-modal="true" aria-labelledby="tag-title" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
      <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-lg">
        {!proof ? (
          <>
            <h2 id="tag-title" className="text-lg font-semibold">What did you buy?</h2>
            <input aria-label="Item" className="mt-3 w-full min-h-11 rounded-xl border border-border bg-surface-2 px-3" value={item} onChange={(e) => setItem(e.target.value)} maxLength={200} />
            <p className="mt-4 text-sm text-muted">Who is it for?</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button disabled={busy} onClick={() => save("me")} className="min-h-11 rounded-xl bg-primary/10 font-medium text-primary">Me</button>
              <button disabled={busy} onClick={() => save("family")} className="min-h-11 rounded-xl bg-good/10 font-medium text-good">Family</button>
              <button disabled={busy} onClick={() => save("private")} className="flex min-h-11 items-center justify-center gap-1 rounded-xl bg-private/10 font-medium text-private">
                <Lock aria-hidden className="size-4" /> Private
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">Private: family sees the amount as “Personal – Other”, never the item.</p>
            {error && <p role="alert" className="mt-2 text-sm text-bad">{error}</p>}
          </>
        ) : (
          <>
            <h2 id="tag-title" className="text-lg font-semibold">Proof receipt</h2>
            <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm tabular">
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
            <Link href="/hub" className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-primary font-medium text-primary-fg">See it in the Money Hub</Link>
          </>
        )}
      </div>
    </div>
  );
}
