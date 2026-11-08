import { config, type MethodAssumption, type PaymentMethodId } from "./config";

export interface TrueCostInput {
  /** Item price in USD cents. */
  priceCents: number;
  /** Shipping in USD cents. */
  shippingCents?: number;
  /** Mid-market USD→INR rate. */
  usdInr: number;
  /** Add an import duty estimate on the item price. */
  includeDuty?: boolean;
}

export interface MethodCost {
  id: PaymentMethodId;
  label: string;
  basePaise: number;
  markupPaise: number;
  gstPaise: number;
  feePaise: number;
  dutyPaise: number;
  totalPaise: number;
  cheapest: boolean;
}

export interface TrueCostResult {
  rows: MethodCost[];
  cheapest: PaymentMethodId;
  /** Extra cost avoided by paying in USD instead of letting the merchant convert to INR. */
  dccSavingPaise: number;
}

const toPaise = (cents: number, rate: number) => Math.round(cents * rate);

export function methodCost(input: TrueCostInput, m: MethodAssumption): Omit<MethodCost, "cheapest"> {
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0) throw new Error("priceCents must be a non-negative integer");
  const shipping = input.shippingCents ?? 0;
  if (!Number.isInteger(shipping) || shipping < 0) throw new Error("shippingCents must be a non-negative integer");
  if (!(input.usdInr > 0)) throw new Error("usdInr must be positive");

  const basePaise = toPaise(input.priceCents + shipping, input.usdInr);
  const markupPaise = Math.round(basePaise * m.fxMarkup);
  const gstPaise = Math.round(markupPaise * m.gstOnMarkup);
  const dutyPaise = input.includeDuty ? Math.round(toPaise(input.priceCents, input.usdInr) * config.importDutyRate) : 0;
  const totalPaise = basePaise + markupPaise + gstPaise + m.flatFeePaise + dutyPaise;
  return { id: m.id, label: m.label, basePaise, markupPaise, gstPaise, feePaise: m.flatFeePaise, dutyPaise, totalPaise };
}

export function trueCost(input: TrueCostInput, methods: readonly MethodAssumption[] = config.methods): TrueCostResult {
  const raw = methods.map((m) => methodCost(input, m));
  const min = raw.reduce((a, b) => (b.totalPaise < a.totalPaise ? b : a));
  const rows = raw.map((r) => ({ ...r, cheapest: r.id === min.id }));
  const base = toPaise(input.priceCents + (input.shippingCents ?? 0), input.usdInr);
  return { rows, cheapest: min.id, dccSavingPaise: Math.round(base * config.dccMarkup) };
}

export function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
