// Pay section maths: Smart Payment Router, International Calculator and
// Large Payment check. Pure functions; every number is an editable estimate.

import { z } from "zod";
import { config } from "./config";

const GST = 0.18;

// ---------- International Calculator ----------

export const CURRENCIES = ["USD", "EUR", "GBP", "SGD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Mid-market INR per unit, used when the live rate cannot be fetched. */
export const FALLBACK_INR: Record<Currency, number> = { USD: 88.5, EUR: 102.5, GBP: 117.5, SGD: 68.2, AUD: 57.8 };

const money = (label: string, max = 10_000_000) =>
  z.coerce.number({ message: `${label} must be a number` }).min(0, `${label} cannot be negative`).max(max, `${label} is too large`);

export const IntlInput = z.object({
  price: money("Price").positive("Price must be more than 0"),
  shipping: money("Shipping"),
  currency: z.enum(CURRENCIES),
  rate: z.coerce.number({ message: "Rate must be a number" }).positive("Rate must be more than 0").max(1000, "Rate looks wrong"),
  markupPct: money("Bank markup", 20),
  dutyPct: money("Customs duty", 150),
  gstOnMarkup: z.boolean(),
});
export type IntlInput = z.infer<typeof IntlInput>;

export type IntlResult = {
  goodsPaise: number;
  shippingPaise: number;
  markupPaise: number;
  gstPaise: number;
  dutyPaise: number;
  totalPaise: number;
  effectiveRate: number;
};

/** Final INR: converted goods + shipping, bank markup, GST on markup, customs duty on landed value. */
export function intlCost(i: IntlInput): IntlResult {
  const goodsPaise = Math.round(i.price * i.rate * 100);
  const shippingPaise = Math.round(i.shipping * i.rate * 100);
  const base = goodsPaise + shippingPaise;
  const markupPaise = Math.round((base * i.markupPct) / 100);
  const gstPaise = i.gstOnMarkup ? Math.round(markupPaise * GST) : 0;
  const dutyPaise = Math.round((base * i.dutyPct) / 100);
  const totalPaise = base + markupPaise + gstPaise + dutyPaise;
  return { goodsPaise, shippingPaise, markupPaise, gstPaise, dutyPaise, totalPaise, effectiveRate: totalPaise / 100 / (i.price + i.shipping) };
}

// ---------- Smart Payment Router ----------

export type RouteMethod = "upi" | "card" | "paypal" | "forex";
export type RouteRow = {
  id: RouteMethod;
  label: string;
  available: boolean;
  why: string;
  feePaise: number;
  totalPaise: number;
  protection: string;
  best?: boolean;
};

export const RouterInput = z.object({
  amount: money("Amount").positive("Amount must be more than 0"),
  where: z.enum(["india", "abroad"]),
  /** For abroad: rate INR per unit of the merchant currency. For India: ignored. */
  rate: z.coerce.number().positive().default(FALLBACK_INR.USD),
  merchantAccepts: z.array(z.enum(["upi", "card", "paypal"])).min(1, "Pick at least one method the shop accepts"),
  riskyPayee: z.boolean().default(false),
});
export type RouterInput = z.infer<typeof RouterInput>;

const UPI_LIMIT_PAISE = 1_00_000_00;

export function smartRoute(i: RouterInput): RouteRow[] {
  const abroad = i.where === "abroad";
  const base = Math.round(i.amount * (abroad ? i.rate : 1) * 100);
  const m = Object.fromEntries(config.methods.map((x) => [x.id, x]));
  const fx = (markup: number, gst: number) => (abroad ? Math.round(base * markup * (1 + gst)) : 0);
  const accepts = (k: "upi" | "card" | "paypal") => i.merchantAccepts.includes(k);

  const rows: RouteRow[] = [
    (() => {
      let why = "Free, instant";
      let available = accepts("upi") && !abroad && base <= UPI_LIMIT_PAISE;
      if (!accepts("upi")) why = "Shop does not take UPI";
      else if (abroad) why = "UPI works at only a few shops abroad";
      else if (base > UPI_LIMIT_PAISE) why = "Above the usual ₹1 lakh UPI limit per payment";
      if (available && i.riskyPayee) { available = false; why = "Blocked: UPI cannot be reversed if the payee is risky"; }
      return { id: "upi" as const, label: "UPI", available, why, feePaise: 0, totalPaise: base, protection: "None – payments are final" };
    })(),
    (() => {
      const fee = fx(m.credit_card.fxMarkup, m.credit_card.gstOnMarkup);
      return {
        id: "card" as const, label: "Credit card", available: accepts("card"),
        why: accepts("card") ? (abroad ? `${m.credit_card.fxMarkup * 100}% forex markup + GST` : "No fee in India") : "Shop does not take cards",
        feePaise: fee, totalPaise: base + fee, protection: "Chargeback through your bank",
      };
    })(),
    (() => {
      const fee = fx(m.paypal.fxMarkup, m.paypal.gstOnMarkup);
      const available = accepts("paypal") && abroad;
      return {
        id: "paypal" as const, label: "PayPal", available,
        why: !accepts("paypal") ? "Shop does not take PayPal" : abroad ? `About ${m.paypal.fxMarkup * 100}% conversion spread` : "PayPal does not handle payments between Indian accounts",
        feePaise: fee, totalPaise: base + fee, protection: "PayPal Buyer Protection",
      };
    })(),
    (() => {
      const fee = fx(m.forex_card.fxMarkup, m.forex_card.gstOnMarkup);
      const available = abroad && accepts("card");
      return {
        id: "forex" as const, label: "Forex card", available,
        why: !abroad ? "Only for foreign-currency spends" : !accepts("card") ? "Needs a shop that takes cards" : "Lowest markup, load it before you buy",
        feePaise: fee, totalPaise: base + fee, protection: "Limited – card issuer dispute",
      };
    })(),
  ];
  // Cheapest available wins; on a tie, prefer the one with buyer protection (card/PayPal over UPI).
  const order: RouteMethod[] = ["card", "paypal", "forex", "upi"];
  const open = rows.filter((r) => r.available).sort((a, b) => a.totalPaise - b.totalPaise || order.indexOf(a.id) - order.indexOf(b.id));
  if (open[0]) open[0].best = true;
  return rows;
}

// ---------- Large Payment check ----------

export type Rail = "upi" | "imps" | "neft" | "rtgs";

/** Typical rules for savings accounts; banks can set lower limits. */
export const RAILS: Record<Rail, { label: string; minPaise: number; maxPaise: number | null; speed: string; fee: string }> = {
  upi: { label: "UPI", minPaise: 100, maxPaise: 1_00_000_00, speed: "Instant, 24×7", fee: "Free" },
  imps: { label: "IMPS", minPaise: 100, maxPaise: 5_00_000_00, speed: "Instant, 24×7", fee: "₹0–15 + GST, set by bank" },
  neft: { label: "NEFT", minPaise: 100, maxPaise: null, speed: "Half-hourly batches, 24×7", fee: "Free online" },
  rtgs: { label: "RTGS", minPaise: 2_00_000_00, maxPaise: null, speed: "Real time, 24×7", fee: "Free online" },
};

export const UPI_HIGHER_LIMIT_PURPOSES = ["tax", "hospital", "education"] as const;

export const LargeInput = z.object({
  amount: money("Amount", 100_00_00_000).positive("Amount must be more than 0"),
  purpose: z.enum(["general", ...UPI_HIGHER_LIMIT_PURPOSES]),
  newBeneficiary: z.boolean(),
  nameMatches: z.enum(["yes", "no", "not_checked"]),
  requestedBy: z.enum(["me", "caller", "message"]),
});
export type LargeInput = z.infer<typeof LargeInput>;

export type LargeResult = {
  rails: { id: Rail; label: string; ok: boolean; why: string; speed: string; fee: string }[];
  best: Rail | null;
  warnings: string[];
  risk: "ok" | "check" | "stop";
};

export function largeCheck(i: LargeInput): LargeResult {
  const paise = Math.round(i.amount * 100);
  const upiMax = i.purpose === "general" ? 1_00_000_00 : 5_00_000_00;
  const rails = (Object.keys(RAILS) as Rail[]).map((id) => {
    const r = RAILS[id];
    const max = id === "upi" ? upiMax : r.maxPaise;
    let ok = paise >= r.minPaise && (max === null || paise <= max);
    let why = ok ? "Within limit" : paise < r.minPaise ? `Minimum ₹${(r.minPaise / 100).toLocaleString("en-IN")}` : `Above ₹${(max! / 100).toLocaleString("en-IN")} limit`;
    if (ok && id === "upi" && i.newBeneficiary && paise > 5_000_00) { ok = false; why = "Many banks cap new UPI payees at ₹5,000 for the first 24 hours"; }
    return { id, label: r.label, ok, why, speed: r.speed, fee: r.fee };
  });
  const warnings: string[] = [];
  if (i.requestedBy !== "me") warnings.push(`Asked to pay by a ${i.requestedBy === "caller" ? "phone call" : "message"}. Banks, police and courier firms never ask you to move money. Call back on an official number first.`);
  if (i.nameMatches === "no") warnings.push("The account name does not match who you expect. Stop and confirm in person.");
  if (i.nameMatches === "not_checked") warnings.push("Check the beneficiary name your bank shows before you confirm.");
  if (i.newBeneficiary) warnings.push("New payee: send ₹1 first and confirm it arrived. Many banks limit the first 24 hours.");
  const risk = i.nameMatches === "no" || (i.requestedBy !== "me" && i.newBeneficiary) ? "stop" : warnings.length ? "check" : "ok";
  // Prefer the cheapest instant rail that fits, then NEFT, then RTGS.
  const pref: Rail[] = ["upi", "neft", "rtgs", "imps"];
  const best = risk === "stop" ? null : pref.find((p) => rails.find((r) => r.id === p)!.ok) ?? null;
  return { rails, best, warnings, risk };
}

/** Turns a Zod error into one readable line per field. */
export const zodMessages = (e: z.ZodError) => [...new Set(e.issues.map((x) => x.message))];
