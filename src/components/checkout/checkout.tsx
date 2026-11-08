"use client";

import { Loader2, Receipt, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { MockBadge, VerdictBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Card, Section } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/config";
import type { TrustResult } from "@/lib/risk";
import { formatInr, formatUsd, type TrueCostResult } from "@/lib/truecost";
import { cn } from "@/lib/utils";
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
    if (!res.ok) return setError("Check the price and fields, then try again.");
    setResult(await res.json());
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
    setResult(null);
  };

  return (
    <div className="grid gap-5">
      <form onSubmit={check} className="space-y-4 self-start rounded-2xl bg-surface p-5 shadow-[0_1px_2px_rgba(12,27,61,0.06)]">
        <Label>Product link
          <Input value={form.link} onChange={set("link")} inputMode="url" />
        </Label>
        <Label>What is it?
          <Input value={form.item} onChange={set("item")} required maxLength={200} />
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <Label>Price (USD)
            <Input className="tabular" value={form.price} onChange={set("price")} type="number" min="0.01" step="0.01" required />
          </Label>
          <Label>Shipping (USD)
            <Input className="tabular" value={form.shipping} onChange={set("shipping")} type="number" min="0" step="0.01" />
          </Label>
        </div>
        <Label>Category
          <Select value={form.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.includeDuty} onChange={set("includeDuty")} className="size-4 accent-[var(--accent)]" />
          Add an import duty estimate
        </label>
        <Button disabled={loading} size="lg" className="w-full">
          {loading && <Loader2 aria-hidden className="animate-spin" />}
          {loading ? "Checking" : "Check true cost"}
        </Button>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      </form>

      <div className="min-w-0 space-y-8">
        {!result && !loading && (
          <div className="flex h-full min-h-64 flex-col justify-center rounded-lg border border-dashed border-border p-8">
            <p className="amount text-4xl text-muted/40">₹ ?</p>
            <p className="mt-3 max-w-sm text-sm text-muted">Fill in the product and check its true cost. You&apos;ll see the rupee total for each way to pay, how trustworthy the store looks, and a verdict.</p>
          </div>
        )}
        {loading && <div className="h-64 animate-pulse rounded-lg bg-surface-2" aria-label="Loading" />}
        {result && (
          <>
            <CostSummary result={result} />
            <VerdictBadge verdict={result.verdict} />
            <TrustMeter trust={result.trust} />
            <Card className="p-5">
              <div className="mb-1 flex flex-wrap items-center gap-2 font-semibold">
                Pay {formatUsd(payload.priceCents + payload.shippingCents)} with PayPal {mock && <MockBadge label="Mock payment" />}
              </div>
              <p className="mb-4 text-sm text-muted">Charged in USD in the sandbox. Paying in USD avoids about {formatInr(result.cost.dccSavingPaise)} in merchant conversion.</p>
              {paidTxn ? (
                <p className="text-sm font-medium text-good">Payment complete.</p>
              ) : (
                <PayButton mock={mock} clientId={clientId} payload={payload} onPaid={setPaidTxn} />
              )}
            </Card>
          </>
        )}
      </div>
      {paidTxn && <TagSheet txnId={paidTxn} defaultItem={form.item} />}
    </div>
  );
}

function CostSummary({ result }: { result: CheckResult }) {
  const best = result.cost.rows.find((r) => r.cheapest) ?? result.cost.rows[0];
  return (
    <section>
      <p className="text-sm text-muted">True cost with {best.label}</p>
      <div className="amount mt-2 text-5xl">{formatInr(best.totalPaise)}</div>
      <p className="mt-2 text-sm text-muted">
        At ₹{result.fx.usdInr.toFixed(2)} per USD {result.fx.source === "fallback" && <MockBadge label="Fallback rate" />}
      </p>

      <table className="tabular mt-6 w-full text-sm">
        <caption className="sr-only">Cost by payment method</caption>
        <thead className="text-left text-xs text-muted">
          <tr className="border-b border-border"><th className="py-2 font-medium">Method</th><th className="font-medium">Markup, GST and fees</th><th className="text-right font-medium">Total</th></tr>
        </thead>
        <tbody>
          {result.cost.rows.map((r) => (
            <tr key={r.id} className={cn("border-b border-border", r.cheapest && "font-semibold text-accent")}>
              <td className="py-2.5">{r.label}{r.cheapest && <span className="ml-2 text-xs font-medium">cheapest</span>}</td>
              <td>{formatInr(r.markupPaise + r.gstPaise + r.feePaise)}</td>
              <td className="text-right">{formatInr(r.totalPaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {best.dutyPaise > 0 && <p className="mt-2 text-xs text-muted">Includes an import duty estimate of {formatInr(best.dutyPaise)}.</p>}
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        <Receipt aria-hidden className="size-3.5" />
        You&apos;ve spent {formatInr(result.budget.spentPaise)} of your {formatInr(result.budget.budgetPaise)} budget this month.
      </p>
    </section>
  );
}

function TrustMeter({ trust }: { trust: TrustResult }) {
  const color = trust.label === "Trusted" ? "bg-good" : trust.label === "Caution" ? "bg-warn" : "bg-bad";
  return (
    <Section title="Store trust" icon={ShieldCheck}>
      <div className="flex items-center gap-4">
        <div className="h-1.5 flex-1 rounded-full bg-surface-2" role="meter" aria-valuenow={trust.score} aria-valuemin={0} aria-valuemax={100} aria-label="Store trust score">
          <div className={cn("h-1.5 rounded-full", color)} style={{ width: `${trust.score}%` }} />
        </div>
        <span className="tabular text-sm font-semibold">{trust.score}/100, {trust.label}</span>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-muted">
        {trust.signals.map((s) => <li key={s}>{s}</li>)}
      </ul>
    </Section>
  );
}
