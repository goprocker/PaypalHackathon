// The connected agents. Each is a plain typed function: it reads its input,
// writes what it did to the shared log, and returns a result the next agent uses.

import { config, type PaymentMethodId } from "../config";
import { DEMO_PAYMENTS, type DemoPayment } from "../demo/data";
import { trustScore, type TrustResult } from "../risk";
import { formatInr, trueCost, type TrueCostResult } from "../truecost";
import { ruleVerdict, type Verdict } from "../verdict";
import type { ActivityLog } from "./log";

const DAY = 24 * 60 * 60 * 1000;

// ---------- Fraud ----------

export type RiskLevel = "safe" | "caution" | "high";
export type FraudResult = { level: RiskLevel; score: number; signals: string[]; payee?: string };

const BRANDS = ["amazon", "flipkart", "paytm", "phonepe", "gpay", "google", "sbi", "hdfc", "icici", "axis", "bigbasket", "swiggy", "zomato"];
const BAIT = ["refund", "kyc", "help", "support", "cashback", "reward", "lottery", "prize", "verify", "update"];

const level = (score: number): RiskLevel => (score >= 70 ? "safe" : score >= 40 ? "caution" : "high");

/** Reads a UPI QR payload (upi://pay?...) without contacting anyone. */
export function fraudCheckQr(log: ActivityLog, payload: string): FraudResult {
  log.emit("fraud", "start", "Scanning QR code");
  let params: URLSearchParams;
  try {
    const url = new URL(payload.trim());
    if (url.protocol !== "upi:") throw new Error("not upi");
    params = url.searchParams;
  } catch {
    const r = { level: "high" as const, score: 10, signals: ["Not a UPI payment QR"] };
    log.emit("fraud", "warn", "QR is not a UPI payment code", { data: r });
    return r;
  }
  const pa = (params.get("pa") ?? "").toLowerCase();
  const pn = (params.get("pn") ?? "").toLowerCase();
  const note = (params.get("tn") ?? "").toLowerCase();
  const signals: string[] = [];
  let score = 80;
  const brand = BRANDS.find((b) => pn.includes(b));
  if (brand && !pa.startsWith(brand)) { score -= 30; signals.push(`Name says "${params.get("pn")}" but money goes to ${pa}`); }
  const bait = BAIT.filter((w) => pa.includes(w) || pn.includes(w) || note.includes(w));
  if (bait.length) { score -= 15 * Math.min(bait.length, 2); signals.push(`Bait words: ${bait.join(", ")}`); }
  if (params.get("am") && /refund|cashback|reward|prize/.test(pn + note)) {
    score -= 25; signals.push("Asks you to pay to receive money. Receiving money never needs a QR scan or PIN.");
  }
  if (!pa.includes("@")) { score -= 40; signals.push("No valid UPI ID"); }
  score = Math.max(0, Math.min(100, score));
  if (!signals.length) signals.push("No risk signals found");
  const r = { level: level(score), score, signals, payee: pa };
  log.emit("fraud", r.level === "safe" ? "result" : "warn", `QR risk ${r.level} (${score}/100) for ${pa || "unknown payee"}`, { data: r });
  return r;
}

export function fraudCheckLink(log: ActivityLog, link: string): FraudResult & { trust: TrustResult } {
  log.emit("fraud", "start", "Checking store link");
  const trust = trustScore(link);
  const r = { level: level(trust.score), score: trust.score, signals: trust.signals, trust };
  log.emit("fraud", r.level === "safe" ? "result" : "warn", `Link trust ${trust.score}/100 (${trust.label})`, { data: { signals: trust.signals } });
  return r;
}

/** A collect request asks you to approve a debit. Unknown payees and "refund" wording are red flags. */
export function fraudCheckCollect(log: ActivityLog, p: DemoPayment): FraudResult {
  log.emit("fraud", "start", `Checking collect request from ${p.payee}`);
  const known = DEMO_PAYMENTS.some((q) => q.id !== p.id && q.payee === p.payee && q.status === "success");
  const signals: string[] = [];
  let score = 70;
  if (!known) { score -= 25; signals.push("You have never paid this UPI ID before"); }
  const bait = BAIT.filter((w) => p.payee.includes(w) || p.item.toLowerCase().includes(w));
  if (bait.length) { score -= 20; signals.push(`Bait words: ${bait.join(", ")}`); }
  if (/sbi|hdfc|icici|axis/.test(p.payee) && !p.payee.endsWith("@sbi")) { score -= 15; signals.push("Bank name used in a personal UPI ID"); }
  score = Math.max(0, score);
  const r = { level: level(score), score, signals, payee: p.payee };
  log.emit("fraud", r.level === "safe" ? "result" : "warn", `Collect request risk ${r.level} (${score}/100)`, { data: r });
  return r;
}

// ---------- FX / Cost ----------

export function fxCost(log: ActivityLog, input: { priceCents: number; shippingCents?: number; usdInr: number; includeDuty?: boolean }): TrueCostResult {
  log.emit("fx", "start", `Pricing USD ${(input.priceCents / 100).toFixed(2)} at ₹${input.usdInr.toFixed(2)}/USD`);
  const r = trueCost(input);
  const best = r.rows.find((x) => x.cheapest)!;
  const worst = r.rows.reduce((a, b) => (b.totalPaise > a.totalPaise ? b : a));
  log.emit("fx", "result", `Cheapest: ${best.label} at ${formatInr(best.totalPaise)}; ${formatInr(worst.totalPaise - best.totalPaise)} less than ${worst.label}`, {
    data: { rows: r.rows.map((x) => ({ id: x.id, total: x.totalPaise })) },
  });
  return r;
}

// ---------- Budget ----------

export type BudgetResult = { category: string; budgetPaise: number; spentPaise: number; afterPaise: number; pct: number; duplicates: DemoPayment[][] };

/** Spend this month (last 30 days, successful only) for one member and category. */
export function budgetCheck(log: ActivityLog, ownerId: string, category: string, addPaise = 0, excludeId?: string): BudgetResult {
  log.emit("budget", "start", `Reading ${category} spend for this month`);
  const mine = DEMO_PAYMENTS.filter((p) => p.ownerId === ownerId && p.status === "success" && p.daysAgo < 30 && p.id !== excludeId);
  const spentPaise = mine.filter((p) => p.category === category).reduce((s, p) => s + p.amountPaise, 0);
  const budgetPaise = config.budgets[category] ?? 0;
  const afterPaise = spentPaise + addPaise;
  const pct = budgetPaise ? Math.round((afterPaise / budgetPaise) * 100) : 0;
  const duplicates = findDuplicates(mine);
  log.emit("budget", pct >= 80 ? "warn" : "result", `${category}: ${formatInr(afterPaise)} of ${formatInr(budgetPaise)} (${pct}%)`, { data: { pct } });
  for (const d of duplicates) log.emit("budget", "warn", `Possible double charge: ${d[0].merchant} ${formatInr(d[0].amountPaise)} × ${d.length}`, { data: { ids: d.map((p) => p.id) } });
  return { category, budgetPaise, spentPaise, afterPaise, pct, duplicates };
}

/** Same payee, same amount, same day: likely paid twice. */
export function findDuplicates(payments: DemoPayment[]): DemoPayment[][] {
  const groups = new Map<string, DemoPayment[]>();
  for (const p of payments) {
    const k = `${p.ownerId}|${p.payee}|${p.amountPaise}|${p.daysAgo}`;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

// ---------- Router ----------

export type RouteOption = { id: PaymentMethodId | "upi"; label: string; totalPaise?: number; blocked?: string };
export type RouteResult = { pick: RouteOption | null; options: RouteOption[] };

export function route(log: ActivityLog, input: { cost?: TrueCostResult; fraud?: FraudResult; domestic?: boolean }): RouteResult {
  log.emit("router", "start", "Choosing how to pay");
  const options: RouteOption[] = input.domestic
    ? [{ id: "upi", label: "UPI" }, { id: "credit_card", label: "Indian credit card" }]
    : (input.cost?.rows ?? []).map((r) => ({ id: r.id, label: r.label, totalPaise: r.totalPaise }));
  if (input.fraud && input.fraud.level === "high") {
    for (const o of options) o.blocked = "Fraud agent found high risk signals";
    log.emit("router", "block", "Blocked every method: the payee shows high risk signals", { data: { payee: input.fraud.payee } });
  } else if (input.fraud?.level === "caution") {
    const upi = options.find((o) => o.id === "upi");
    if (upi) { upi.blocked = "UPI cannot be reversed; use a card for buyer protection"; log.emit("router", "block", "Blocked UPI for a caution-level payee (no chargeback on UPI)"); }
  }
  const open = options.filter((o) => !o.blocked).sort((a, b) => (a.totalPaise ?? 0) - (b.totalPaise ?? 0));
  const pick = open[0] ?? null;
  log.emit("router", "result", pick ? `Recommend ${pick.label}${pick.totalPaise ? ` (${formatInr(pick.totalPaise)})` : ""}` : "No safe way to pay");
  return { pick, options };
}

// ---------- Verdict ----------

export function verdict(log: ActivityLog, input: { item: string; budget: BudgetResult; addPaise: number; trust?: TrustResult; fraud?: FraudResult }): Verdict {
  log.emit("verdict", "start", `Judging "${input.item}"`);
  const trust: TrustResult = input.trust ?? {
    score: input.fraud?.score ?? 80,
    label: input.fraud?.level === "high" ? "High risk" : input.fraud?.level === "caution" ? "Caution" : "Trusted",
    signals: input.fraud?.signals ?? [],
  };
  const v = ruleVerdict({ item: input.item, category: input.budget.category, totalPaise: input.addPaise, budgetPaise: input.budget.budgetPaise, spentPaise: input.budget.spentPaise, trust });
  log.emit("verdict", v.verdict === "GOOD FOR YOU" ? "result" : "warn", `${v.verdict}: ${v.reason}`);
  return v;
}

// ---------- Payment (simulated) ----------

export type PaymentResult = { ok: boolean; ref: string; method: string; amountPaise: number; simulated: true };

export function pay(log: ActivityLog, input: { route: RouteResult; amountPaise: number; merchant: string }): PaymentResult | null {
  if (!input.route.pick) {
    log.emit("payment", "block", `Payment to ${input.merchant} stopped before any money moved`);
    return null;
  }
  log.emit("payment", "start", `Simulated – no bank connected. Paying ${input.merchant} by ${input.route.pick.label}`);
  const ref = `SIM${input.merchant.replace(/\W/g, "").toUpperCase().slice(0, 4)}${input.amountPaise % 100000}`;
  const r = { ok: true, ref, method: input.route.pick.label, amountPaise: input.amountPaise, simulated: true as const };
  log.emit("payment", "result", `Simulated payment approved, ref ${ref}`);
  return r;
}

// ---------- Tracker ----------

export type TrackResult = {
  payment: DemoPayment;
  stage: string;
  refundEta?: string;
  overdue: boolean;
  dontPayAgain: boolean;
  needsDispute: boolean;
};

const STAGES = ["Refund requested", "Merchant accepted", "Bank processing", "Credited"];

export function track(log: ActivityLog, p: DemoPayment, now = Date.now()): TrackResult {
  log.emit("tracker", "start", `Looking up ${p.merchant} txn ${p.txnId}`);
  const refundDue = p.refund ? p.refund.etaDays - p.refund.requestedDaysAgo : undefined; // days from today
  const refundEta = refundDue !== undefined && p.refund!.stage < 3 ? new Date(now + Math.max(refundDue, 0) * DAY).toISOString().slice(0, 10) : undefined;
  const overdue = refundDue !== undefined && refundDue < 0 && p.refund!.stage < 3;
  const moneyStuck = p.status === "failed" && !!p.refund;
  const dontPayAgain = moneyStuck || p.status === "refund_pending" || p.status === "pending";
  const stage = p.refund ? STAGES[p.refund.stage] : p.status;
  const r = { payment: p, stage, refundEta, overdue, dontPayAgain, needsDispute: overdue || moneyStuck };
  log.emit("tracker", dontPayAgain ? "warn" : "result",
    `${p.status.replace("_", " ")} · ${stage}${refundEta ? ` · refund expected by ${refundEta}` : ""}${dontPayAgain ? " · Don't pay again" : ""}`,
    { data: { overdue } });
  return r;
}

// ---------- Proof ----------

export type ProofRecord = { txnId: string; merchant: string; amountPaise: number; method: string; status: string; savedFor: string };

export function saveProof(log: ActivityLog, p: { txnId: string; merchant: string; amountPaise: number; method: string; status: string }, reason: string): ProofRecord {
  const r = { ...p, savedFor: reason };
  log.emit("proof", "result", `Saved receipt for ${p.merchant} ${formatInr(p.amountPaise)}, txn ${p.txnId}`, { data: r });
  return r;
}

// ---------- Dispute ----------

export type DisputeDraft = { to: string; subject: string; body: string };

export function draftDispute(log: ActivityLog, proof: ProofRecord, issue: "failed_debit" | "duplicate" | "refund_overdue"): DisputeDraft {
  const what = {
    failed_debit: "the payment failed but the amount was debited from my account",
    duplicate: "I was charged twice for the same bill",
    refund_overdue: "my refund has not arrived by the promised date",
  }[issue];
  const d = {
    to: `${proof.merchant} support / my bank`,
    subject: `Request to reverse ${formatInr(proof.amountPaise)} – txn ${proof.txnId}`,
    body: `I am writing because ${what}. Transaction ID: ${proof.txnId}. Amount: ${formatInr(proof.amountPaise)}. Method: ${proof.method}. Please reverse the amount to my original payment method. My receipt is attached.`,
  };
  log.emit("dispute", "result", `Drafted dispute: ${d.subject}`, { data: d });
  return d;
}

// ---------- Assistant ----------

export function explain(log: ActivityLog, summary: string) {
  log.emit("assistant", "result", summary);
  return summary;
}
