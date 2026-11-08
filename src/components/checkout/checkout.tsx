"use client";

import { useState } from "react";
import { MockBadge, VerdictBadge } from "@/components/badges";
import { CATEGORIES } from "@/lib/config";
import type { TrustResult } from "@/lib/risk";
import { formatInr, formatUsd, type TrueCostResult } from "@/lib/truecost";
import type { Verdict } from "@/lib/verdict";
import { PayButton } from "./pay-button";
import { TagSheet } from "./tag-sheet";

interface CheckResult {
  fx: { usdInr: number; source: "live" | "fallback" };
  cost: TrueCostResult;
  trust: TrustResult;
  verdict: Verdict;
  budget: { budgetPaise: number; spentPaise: number };
}

const toCents = (s: string) => Math.round(Number(s) * 100);

export function Checkout({ mock, clientId }: { mock: boolean; clientId: string }) {
  const [form, setForm] = useState({ link: "https://www.bestbuy.com/site/wireless-headphones", item: "Wireless headphones", price: "129.99", shipping: "0", category: "Shopping", includeDuty: false });
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidTxn, setPaidTxn] = useState<string | null>(null);

  const payload = {
    link: form.link,
    item: form.item,
    priceCents: toCents(form.price),
    shippingCents: toCents(form.shipping || "0"),
    category: form.category,
    includeDuty: form.includeDuty,
  };

  async function check(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setPaidTxn(null);
    const res = await fetch("/api/ai/verdict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setLoading(false);
    if (!res.ok) return setError("Please check the price and fields, then try again.");
    setResult(await res.json());
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
    setResult(null);
  };

  const input = "mt-1 w-full min-h-11 rounded-xl border border-border bg-surface-2 px-3";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={check} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <label className="block text-sm">Product link
          <input className={input} value={form.link} onChange={set("link")} inputMode="url" />
        </label>
        <label className="block text-sm">What is it?
          <input className={input} value={form.item} onChange={set("item")} required maxLength={200} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">Price (USD)
            <input className={`${input} tabular`} value={form.price} onChange={set("price")} type="number" min="0.01" step="0.01" required />
          </label>
          <label className="block text-sm">Shipping (USD)
            <input className={`${input} tabular`} value={form.shipping} onChange={set("shipping")} type="number" min="0" step="0.01" />
          </label>
        </div>
        <label className="block text-sm">Category
          <select className={input} value={form.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.includeDuty} onChange={set("includeDuty")} className="size-4" />
          Include import duty estimate
        </label>
        <button disabled={loading} className="min-h-11 w-full rounded-xl bg-primary font-medium text-primary-fg disabled:opacity-60">
          {loading ? "Checking…" : "Check before I pay"}
        </button>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      </form>

      <div className="space-y-4">
        {!result && !loading && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
            Enter a product and press “Check before I pay” to see the true cost, store trust and an AI verdict.
          </div>
        )}
        {loading && <div className="h-48 animate-pulse rounded-2xl bg-surface-2" aria-label="Loading" />}
        {result && (
          <>
            <VerdictBadge verdict={result.verdict} />
            <CostTable result={result} />
            <TrustMeter trust={result.trust} />
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                Pay {formatUsd(payload.priceCents + payload.shippingCents)} with PayPal {mock && <MockBadge label="Mock payment" />}
              </div>
              <p className="mb-3 text-xs text-muted">Charged in USD (sandbox). Paying in USD avoids about {formatInr(result.cost.dccSavingPaise)} in merchant conversion.</p>
              {paidTxn ? (
                <p className="text-sm text-good">Payment complete.</p>
              ) : (
                <PayButton mock={mock} clientId={clientId} payload={payload} onPaid={setPaidTxn} />
              )}
            </div>
          </>
        )}
      </div>
      {paidTxn && <TagSheet txnId={paidTxn} defaultItem={form.item} />}
    </div>
  );
}

function CostTable({ result }: { result: CheckResult }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="font-semibold">True cost in INR</div>
        <div className="text-xs text-muted">
          1 USD = ₹{result.fx.usdInr.toFixed(2)} {result.fx.source === "fallback" && <MockBadge label="Fallback rate" />}
        </div>
      </div>
      <table className="w-full text-sm tabular">
        <thead className="text-left text-xs text-muted">
          <tr><th className="py-1 font-normal">Method</th><th className="font-normal">Markup + GST</th><th className="text-right font-normal">Total</th></tr>
        </thead>
        <tbody>
          {result.cost.rows.map((r) => (
            <tr key={r.id} className={`border-t border-border ${r.cheapest ? "font-semibold" : ""}`}>
              <td className="py-2">
                {r.label}
                {r.cheapest && <span className="ml-2 rounded-full bg-good/10 px-2 py-0.5 text-xs text-good">Cheapest</span>}
              </td>
              <td>{formatInr(r.markupPaise + r.gstPaise + r.feePaise)}</td>
              <td className="text-right">{formatInr(r.totalPaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {result.cost.rows[0].dutyPaise > 0 && <p className="mt-2 text-xs text-muted">Includes import duty estimate of {formatInr(result.cost.rows[0].dutyPaise)}.</p>}
      <p className="mt-2 text-xs text-muted">
        Budget: {formatInr(result.budget.spentPaise)} of {formatInr(result.budget.budgetPaise)} spent this month.
      </p>
    </div>
  );
}

function TrustMeter({ trust }: { trust: TrustResult }) {
  const color = trust.label === "Trusted" ? "bg-good" : trust.label === "Caution" ? "bg-warn" : "bg-bad";
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-2 flex justify-between">
        <span className="font-semibold">Store trust</span>
        <span className="text-sm tabular">{trust.score}/100 · {trust.label}</span>
      </div>
      <div className="h-2 rounded-full bg-surface-2" role="meter" aria-valuenow={trust.score} aria-valuemin={0} aria-valuemax={100} aria-label="Store trust score">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${trust.score}%` }} />
      </div>
      <ul className="mt-2 list-disc pl-5 text-xs text-muted">
        {trust.signals.map((s) => <li key={s}>{s}</li>)}
      </ul>
    </div>
  );
}
