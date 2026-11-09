"use client";

import { Ban, CircleCheck, ShieldAlert, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { MockBadge } from "@/components/badges";
import { Input, Label, Select } from "@/components/ui/input";
import {
  CURRENCIES, IntlInput, intlCost, largeCheck, LargeInput, RouterInput, smartRoute, zodMessages, type Currency,
} from "@/lib/pay";
import { formatInr } from "@/lib/truecost";
import { cn } from "@/lib/utils";

const panel = "glass space-y-4 rounded-2xl p-5";
const check = "size-5 accent-[var(--accent)]";

function Errors({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return (
    <ul role="alert" className="space-y-1 rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-bad">
      {messages.map((m) => <li key={m}>{m}</li>)}
    </ul>
  );
}

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className={check} />
      {children}
    </label>
  );
}

function Line({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-3 py-2", strong ? "border-t border-border text-base font-semibold" : "text-sm")}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd className="tabular">{formatInr(value)}</dd>
    </div>
  );
}

// ---------- International Calculator ----------

export function IntlCalculator({ rates, live, initial }: { rates: Record<Currency, number>; live: boolean; initial: { price?: string; currency?: Currency } }) {
  const [f, setF] = useState({
    price: initial.price ?? "85", shipping: "0", currency: initial.currency ?? ("USD" as Currency),
    rate: String(rates[initial.currency ?? "USD"]), markupPct: "3.5", dutyPct: "0", gstOnMarkup: true,
  });
  const parsed = IntlInput.safeParse(f);
  const r = parsed.success ? intlCost(parsed.data) : null;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <form className={panel} onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
          <Label>Price<Input className="tabular" type="number" inputMode="decimal" min="0" step="0.01" value={f.price} onChange={set("price")} /></Label>
          <Label>Currency
            <Select value={f.currency} onChange={(e) => { const c = e.target.value as Currency; setF({ ...f, currency: c, rate: String(rates[c]) }); }}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Label>Shipping ({f.currency})<Input className="tabular" type="number" inputMode="decimal" min="0" step="0.01" value={f.shipping} onChange={set("shipping")} /></Label>
          <Label>Rate (₹ per {f.currency})<Input className="tabular" type="number" inputMode="decimal" min="0" step="0.01" value={f.rate} onChange={set("rate")} /></Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Label>Bank markup %<Input className="tabular" type="number" inputMode="decimal" min="0" step="0.1" value={f.markupPct} onChange={set("markupPct")} /></Label>
          <Label>Customs duty %<Input className="tabular" type="number" inputMode="decimal" min="0" step="0.1" value={f.dutyPct} onChange={set("dutyPct")} /></Label>
        </div>
        <Toggle checked={f.gstOnMarkup} onChange={(v) => setF({ ...f, gstOnMarkup: v })}>Add 18% GST on the bank markup</Toggle>
        <p className="text-xs text-muted">
          Rate: {live ? "today's reference rate" : <MockBadge label="Fallback rate" />}. Customs duty applies to goods shipped to India
          (often around 40% for personal courier imports); leave it at 0 for services and digital goods.
        </p>
      </form>

      <section aria-live="polite" className={panel}>
        {!parsed.success ? <Errors messages={zodMessages(parsed.error)} /> : r && (
          <>
            <p className="text-sm text-muted">Final cost in India</p>
            <p className="amount text-5xl">{formatInr(r.totalPaise)}</p>
            <p className="text-xs text-muted">That is ₹{r.effectiveRate.toFixed(2)} per {f.currency} once everything is added.</p>
            <dl>
              <Line label="Goods" value={r.goodsPaise} />
              <Line label="Shipping" value={r.shippingPaise} />
              <Line label="Bank markup" value={r.markupPaise} />
              <Line label="GST on markup" value={r.gstPaise} />
              <Line label="Customs duty" value={r.dutyPaise} />
              <Line label="Total" value={r.totalPaise} strong />
            </dl>
          </>
        )}
      </section>
    </div>
  );
}

// ---------- Smart Payment Router ----------

export function SmartRouter({ usdInr, initialRisky }: { usdInr: number; initialRisky: boolean }) {
  const [f, setF] = useState({ amount: "2500", where: "india" as "india" | "abroad", accepts: { upi: true, card: true, paypal: false }, riskyPayee: initialRisky });
  const parsed = RouterInput.safeParse({
    amount: f.amount, where: f.where, rate: usdInr, riskyPayee: f.riskyPayee,
    merchantAccepts: (Object.keys(f.accepts) as (keyof typeof f.accepts)[]).filter((k) => f.accepts[k]),
  });
  const rows = parsed.success ? smartRoute(parsed.data) : null;
  const best = rows?.find((r) => r.best);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <form className={panel} onSubmit={(e) => e.preventDefault()}>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-1.5 text-sm font-medium">Where is the shop?</legend>
          {(["india", "abroad"] as const).map((w) => (
            <button key={w} type="button" aria-pressed={f.where === w} onClick={() => setF({ ...f, where: w })}
              className={cn("min-h-11 rounded-xl border text-sm", f.where === w ? "border-accent bg-accent/15 text-accent" : "border-border")}>
              {w === "india" ? "In India (₹)" : "Abroad (USD)"}
            </button>
          ))}
        </fieldset>
        <Label>Amount ({f.where === "india" ? "₹" : "USD"})<Input className="tabular" type="number" inputMode="decimal" min="0" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Label>
        <fieldset>
          <legend className="mb-1 text-sm font-medium">The shop accepts</legend>
          {(["upi", "card", "paypal"] as const).map((k) => (
            <Toggle key={k} checked={f.accepts[k]} onChange={(v) => setF({ ...f, accepts: { ...f.accepts, [k]: v } })}>
              {{ upi: "UPI", card: "Cards", paypal: "PayPal" }[k]}
            </Toggle>
          ))}
        </fieldset>
        <Toggle checked={f.riskyPayee} onChange={(v) => setF({ ...f, riskyPayee: v })}>Payee flagged by Protect (risky)</Toggle>
        {f.where === "abroad" && <p className="text-xs text-muted">At ₹{usdInr.toFixed(2)} per USD. Markups are estimates.</p>}
      </form>

      <section aria-live="polite" className={panel}>
        {!parsed.success ? <Errors messages={zodMessages(parsed.error)} /> : (
          <>
            <p className="text-sm text-muted">Best way to pay</p>
            {best ? (
              <>
                <p className="text-2xl font-bold text-accent">{best.label}</p>
                <p className="amount text-4xl">{formatInr(best.totalPaise)}</p>
              </>
            ) : <p className="font-semibold text-bad">No safe method available. Don&apos;t pay this payee.</p>}
            <ul className="divide-y divide-border">
              {rows!.map((r) => (
                <li key={r.id} className={cn("flex items-start gap-3 py-3", !r.available && "opacity-60")}>
                  {r.available ? <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-good" /> : <Ban aria-hidden className="mt-0.5 size-4 shrink-0 text-bad" />}
                  <div className="min-w-0 flex-1">
                    <p className="flex justify-between gap-2 font-medium">
                      <span>{r.label}{r.best && <span className="ml-2 text-xs text-accent">best</span>}</span>
                      {r.available && <span className="tabular">{formatInr(r.totalPaise)}</span>}
                    </p>
                    <p className="text-xs text-muted">{r.why}{r.available && r.feePaise > 0 && ` · fees ${formatInr(r.feePaise)}`}</p>
                    {r.available && <p className="text-xs text-muted">Protection: {r.protection}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

// ---------- Large Payment check ----------

export function LargePaymentCheck({ simLabel }: { simLabel: string }) {
  const [f, setF] = useState<{ amount: string; purpose: LargeInput["purpose"]; newBeneficiary: boolean; nameMatches: LargeInput["nameMatches"]; requestedBy: LargeInput["requestedBy"] }>({
    amount: "250000", purpose: "general", newBeneficiary: true, nameMatches: "not_checked", requestedBy: "me",
  });
  const parsed = LargeInput.safeParse(f);
  const r = parsed.success ? largeCheck(parsed.data) : null;
  const sel = <K extends "purpose" | "nameMatches" | "requestedBy">(k: K) => (e: React.ChangeEvent<HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const tone = r?.risk === "stop" ? "border-bad/50 bg-bad/10 text-bad" : r?.risk === "check" ? "border-warn/50 bg-warn/10 text-warn" : "border-good/50 bg-good/10 text-good";

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <form className={panel} onSubmit={(e) => e.preventDefault()}>
        <Label>Amount (₹)<Input className="tabular" type="number" inputMode="decimal" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Label>
        <Label>What is it for?
          <Select value={f.purpose} onChange={sel("purpose")}>
            <option value="general">General / family / purchase</option>
            <option value="tax">Tax payment</option>
            <option value="hospital">Hospital bill</option>
            <option value="education">School or college fees</option>
          </Select>
        </Label>
        <Label>Who asked you to pay?
          <Select value={f.requestedBy} onChange={sel("requestedBy")}>
            <option value="me">I decided myself</option>
            <option value="caller">Someone on a phone call</option>
            <option value="message">A message or link</option>
          </Select>
        </Label>
        <Label>Does the beneficiary name your bank shows match?
          <Select value={f.nameMatches} onChange={sel("nameMatches")}>
            <option value="not_checked">I have not checked</option>
            <option value="yes">Yes, it matches</option>
            <option value="no">No, it is a different name</option>
          </Select>
        </Label>
        <Toggle checked={f.newBeneficiary} onChange={(v) => setF({ ...f, newBeneficiary: v })}>First time paying this person</Toggle>
        <p className="text-xs text-muted">Typical limits for savings accounts; your bank may set lower ones. {simLabel}.</p>
      </form>

      <section aria-live="polite" className={panel}>
        {!parsed.success ? <Errors messages={zodMessages(parsed.error)} /> : r && (
          <>
            <div className={cn("flex items-start gap-2 rounded-xl border p-3 text-sm font-semibold", tone)}>
              {r.risk === "ok" ? <CircleCheck aria-hidden className="size-4 shrink-0" /> : r.risk === "check" ? <TriangleAlert aria-hidden className="size-4 shrink-0" /> : <ShieldAlert aria-hidden className="size-4 shrink-0" />}
              {r.risk === "stop" ? "Stop. Do not send this payment yet." : r.best ? `Use ${r.rails.find((x) => x.id === r.best)!.label}` : "No rail fits this amount"}
            </div>
            {r.warnings.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm">{r.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
            <div className="overflow-x-auto">
              <table className="tabular w-full text-sm">
                <caption className="sr-only">Transfer methods, limits and fees</caption>
                <thead className="text-left text-xs text-muted">
                  <tr className="border-b border-border"><th className="py-2 font-medium">Method</th><th className="font-medium">This amount</th><th className="font-medium">Fee</th></tr>
                </thead>
                <tbody>
                  {r.rails.map((x) => (
                    <tr key={x.id} className={cn("border-b border-border align-top", x.id === r.best && "font-semibold text-accent")}>
                      <td className="py-2.5 pr-2">{x.label}<div className="text-xs font-normal text-muted">{x.speed}</div></td>
                      <td className={cn("pr-2", !x.ok && "text-bad")}>{x.ok ? "OK" : x.why}</td>
                      <td className="text-xs">{x.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
