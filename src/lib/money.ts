// Money and Family sections: monthly summary, subscriptions, duplicates,
// budgets, goals, net worth, LRS and per-member privacy over the demo dataset.

import { z } from "zod";
import { findDuplicates } from "./agents/agents";
import { config } from "./config";
import { DEMO_MEMBERS, DEMO_PAYMENTS, type DemoPayment } from "./demo/data";
import type { Currency } from "./pay";

type MemberId = DemoPayment["ownerId"];
const spent = (p: DemoPayment) => p.status === "success" && p.daysAgo < 30;
const sum = (ps: DemoPayment[]) => ps.reduce((s, p) => s + p.amountPaise, 0);

/** This month's spend by category, biggest first. */
export function monthSummary(ownerId: MemberId) {
  const mine = DEMO_PAYMENTS.filter((p) => p.ownerId === ownerId && spent(p));
  const byCat = new Map<string, number>();
  for (const p of mine) byCat.set(p.category, (byCat.get(p.category) ?? 0) + p.amountPaise);
  const categories = [...byCat].map(([category, paise]) => ({ category, paise })).sort((a, b) => b.paise - a.paise);
  const failed = DEMO_PAYMENTS.filter((p) => p.ownerId === ownerId && p.status !== "success" && p.daysAgo < 30).length;
  return { totalPaise: sum(mine), count: mine.length, failed, categories, biggest: [...mine].sort((a, b) => b.amountPaise - a.amountPaise).slice(0, 3) };
}

export type Subscription = { merchant: string; item: string; monthlyPaise: number; yearlyPaise: number; method: DemoPayment["method"]; nextInDays: number; sharedWith: string[] };

/** Recurring charges, with any other family member paying the same service. */
export function subscriptions(ownerId: MemberId): Subscription[] {
  return DEMO_PAYMENTS.filter((p) => p.ownerId === ownerId && p.category === "Subscriptions" && spent(p)).map((p) => ({
    merchant: p.merchant,
    item: p.item,
    monthlyPaise: p.amountPaise,
    yearlyPaise: p.amountPaise * 12,
    method: p.method,
    nextInDays: 30 - p.daysAgo,
    sharedWith: DEMO_MEMBERS.filter((m) => m.id !== ownerId && DEMO_PAYMENTS.some((q) => q.ownerId === m.id && q.merchant === p.merchant)).map((m) => m.name),
  })).sort((a, b) => a.nextInDays - b.nextInDays);
}

/** Same payee, amount and day. The first payment is kept, the rest are the extra charges. */
export function duplicateGroups(ownerId: MemberId) {
  return findDuplicates(DEMO_PAYMENTS.filter((p) => p.ownerId === ownerId && p.status === "success")).map((g) => ({
    kept: g[0], extra: g.slice(1), extraPaise: sum(g.slice(1)),
  }));
}

export const budgetsSchema = z.record(z.string(), z.number().int().min(0).max(100_000_000));

/** Spend vs limit per category; `limits` overrides the default budgets (paise). */
export function budgets(ownerId: MemberId, limits: Record<string, number> = {}) {
  const mine = DEMO_PAYMENTS.filter((p) => p.ownerId === ownerId && spent(p));
  return Object.entries({ ...config.budgets, ...limits }).map(([category, limitPaise]) => {
    const spentPaise = sum(mine.filter((p) => p.category === category));
    const pct = limitPaise ? Math.round((spentPaise / limitPaise) * 100) : spentPaise ? 100 : 0;
    return { category, limitPaise, spentPaise, pct, state: pct >= 100 ? "over" : pct >= 80 ? "near" : "ok" } as const;
  });
}

export type Goal = { id: string; name: string; targetPaise: number; savedPaise: number; monthlyPaise: number };

export const DEMO_GOALS: Record<MemberId, Goal[]> = {
  u_me: [
    { id: "g1", name: "Singapore trip", targetPaise: 150_000_00, savedPaise: 62_000_00, monthlyPaise: 15_000_00 },
    { id: "g2", name: "Emergency fund", targetPaise: 300_000_00, savedPaise: 210_000_00, monthlyPaise: 10_000_00 },
  ],
  u_mom: [{ id: "g3", name: "Diwali gold", targetPaise: 80_000_00, savedPaise: 54_000_00, monthlyPaise: 6_000_00 }],
  u_dad: [{ id: "g4", name: "Car down payment", targetPaise: 400_000_00, savedPaise: 125_000_00, monthlyPaise: 25_000_00 }],
};

export const goalSchema = z.object({
  name: z.string().trim().min(1, "Give the goal a name").max(40, "Keep the name under 40 characters"),
  target: z.coerce.number({ message: "Enter a target in rupees" }).positive("Target must be more than ₹0").max(10_000_000, "Target is too large"),
  saved: z.coerce.number({ message: "Enter how much you have saved" }).min(0, "Saved can't be negative"),
  monthly: z.coerce.number({ message: "Enter a monthly amount" }).min(0, "Monthly can't be negative"),
}).refine((g) => g.saved <= g.target, { message: "Saved is already more than the target", path: ["saved"] });

/** Months left at the current monthly saving; null if it will never get there. */
export function monthsToGoal(g: Pick<Goal, "targetPaise" | "savedPaise" | "monthlyPaise">): number | null {
  const left = g.targetPaise - g.savedPaise;
  if (left <= 0) return 0;
  return g.monthlyPaise > 0 ? Math.ceil(left / g.monthlyPaise) : null;
}

export type Account = { name: string; kind: "bank" | "wallet" | "forex" | "investment" | "card" | "loan"; balancePaise: number };

export const DEMO_ACCOUNTS: Record<MemberId, Account[]> = {
  u_me: [
    { name: "HDFC savings", kind: "bank", balancePaise: 84_250_00 },
    { name: "PayPal balance", kind: "wallet", balancePaise: 3_120_00 },
    { name: "Forex card (SGD)", kind: "forex", balancePaise: 9_800_00 },
    { name: "Mutual funds", kind: "investment", balancePaise: 212_400_00 },
    { name: "Credit card due", kind: "card", balancePaise: -18_640_00 },
  ],
  u_mom: [
    { name: "Indian Bank savings", kind: "bank", balancePaise: 46_900_00 },
    { name: "Gold savings", kind: "investment", balancePaise: 54_000_00 },
  ],
  u_dad: [
    { name: "SBI savings", kind: "bank", balancePaise: 1_32_500_00 },
    { name: "Fixed deposit", kind: "investment", balancePaise: 5_00_000_00 },
    { name: "Car loan", kind: "loan", balancePaise: -2_10_000_00 },
  ],
};

export function netWorth(ownerId: MemberId) {
  const accounts = DEMO_ACCOUNTS[ownerId];
  const assets = accounts.filter((a) => a.balancePaise > 0).reduce((s, a) => s + a.balancePaise, 0);
  const debts = -accounts.filter((a) => a.balancePaise < 0).reduce((s, a) => s + a.balancePaise, 0);
  return { accounts, assetsPaise: assets, debtsPaise: debts, netPaise: assets - debts };
}

/** Liberalised Remittance Scheme limit per person per financial year (Apr–Mar). */
export const LRS_LIMIT_USD = 250_000;
/** TCS starts above this much foreign spend in a year (typical rule; bank may differ). */
export const TCS_THRESHOLD_PAISE = 10_00_000_00;
/** Earlier spend this financial year, before the demo month. */
const LRS_EARLIER_USD: Record<MemberId, number> = { u_me: 2_340, u_mom: 0, u_dad: 6_500 };

/** USD value of one foreign payment, from the price in its item text if present. */
export function foreignUsd(p: DemoPayment, rates: Record<Currency, number>): number {
  const m = /\((USD|EUR|GBP|SGD|AUD) ([\d.]+)\)/.exec(p.item);
  const inr = m ? Number(m[2]) * rates[m[1] as Currency] : p.amountPaise / 100;
  return Math.round((inr / rates.USD) * 100) / 100;
}

export function lrs(ownerId: MemberId, rates: Record<Currency, number>) {
  const items = DEMO_PAYMENTS.filter((p) => p.ownerId === ownerId && p.status === "success" && (p.method === "paypal" || p.method === "forex"))
    .map((p) => ({ p, usd: foreignUsd(p, rates) }));
  const usedUsd = Math.round((LRS_EARLIER_USD[ownerId] + items.reduce((s, x) => s + x.usd, 0)) * 100) / 100;
  const usedPaise = Math.round(usedUsd * rates.USD * 100);
  return {
    items, earlierUsd: LRS_EARLIER_USD[ownerId], usedUsd, leftUsd: LRS_LIMIT_USD - usedUsd,
    pct: Math.round((usedUsd / LRS_LIMIT_USD) * 1000) / 10,
    tcsLeftPaise: Math.max(0, TCS_THRESHOLD_PAISE - usedPaise),
  };
}

// ---------- Family privacy ----------

/** What a member lets the rest of the family see. Private-flagged items are never shown to others. */
export type Share = "items" | "categories" | "total";
export const SHARES: Share[] = ["items", "categories", "total"];
export const privacySchema = z.partialRecord(z.enum(["u_me", "u_mom", "u_dad"]), z.enum(["items", "categories", "total"]));
export type Privacy = Partial<Record<MemberId, Share>>;

export type MemberView = {
  id: MemberId; name: string; relation: string; share: Share; self: boolean;
  totalPaise: number; privatePaise: number; privateCount: number;
  categories: { category: string; paise: number }[] | null;
  items: DemoPayment[] | null;
};

/**
 * Family view as seen by `viewerId`. The viewer sees everything of their own;
 * for others, private items collapse into one "Private" total and the rest follows their share setting.
 */
export function familyView(viewerId: MemberId, privacy: Privacy = {}): MemberView[] {
  return DEMO_MEMBERS.map((m) => {
    const self = m.id === viewerId;
    const share: Share = privacy[m.id] ?? "items";
    const all = DEMO_PAYMENTS.filter((p) => p.ownerId === m.id && spent(p));
    const priv = all.filter((p) => p.private);
    const visible = self ? all : all.filter((p) => !p.private);
    const cats = new Map<string, number>();
    for (const p of visible) cats.set(p.category, (cats.get(p.category) ?? 0) + p.amountPaise);
    if (!self && priv.length) cats.set("Private", sum(priv));
    const showCats = self || share !== "total";
    return {
      id: m.id, name: m.name, relation: m.relation, share, self,
      totalPaise: sum(all), privatePaise: sum(priv), privateCount: priv.length,
      categories: showCats ? [...cats].map(([category, paise]) => ({ category, paise })).sort((a, b) => b.paise - a.paise) : null,
      items: self || share === "items" ? visible : null,
    };
  });
}

/** The viewer's own private items, only ever shown to them. */
export const privateItems = (viewerId: MemberId) => DEMO_PAYMENTS.filter((p) => p.ownerId === viewerId && p.private);
