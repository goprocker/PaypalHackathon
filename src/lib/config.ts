// Editable assumptions. Every number here is an estimate shown to users as such.

export type PaymentMethodId = "paypal" | "credit_card" | "forex_card";

export interface MethodAssumption {
  id: PaymentMethodId;
  label: string;
  /** FX markup over the mid-market rate, as a fraction (0.035 = 3.5%). */
  fxMarkup: number;
  /** GST charged on the markup amount, as a fraction. */
  gstOnMarkup: number;
  /** Flat fee per transaction in INR paise. */
  flatFeePaise: number;
}

export const config = {
  /** Mid-market USD→INR used when the live FX source is unavailable. */
  fallbackUsdInr: 88.5,
  fxCacheMs: 60 * 60 * 1000,
  methods: [
    { id: "paypal", label: "PayPal balance", fxMarkup: 0.04, gstOnMarkup: 0, flatFeePaise: 0 },
    { id: "credit_card", label: "Indian credit card", fxMarkup: 0.035, gstOnMarkup: 0.18, flatFeePaise: 0 },
    { id: "forex_card", label: "Forex card", fxMarkup: 0.01, gstOnMarkup: 0.18, flatFeePaise: 0 },
  ] satisfies MethodAssumption[],
  /** Extra markup if the merchant converts to INR for you (dynamic currency conversion). */
  dccMarkup: 0.05,
  /** Estimated import duty on goods value for personal courier imports. */
  importDutyRate: 0.42,
  /** Monthly category budgets in INR paise. */
  budgets: {
    Groceries: 1500000,
    Bills: 1200000,
    Shopping: 1000000,
    Food: 800000,
    Subscriptions: 300000,
    Friends: 500000,
    Other: 500000,
  } as Record<string, number>,
} as const;

export const CATEGORIES = Object.keys(config.budgets);
