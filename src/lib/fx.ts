import { config } from "./config";
import { CURRENCIES, FALLBACK_INR, type Currency } from "./pay";

export interface FxRate {
  usdInr: number;
  source: "live" | "fallback";
  fetchedAt: string;
}

let cache: { rate: FxRate; expires: number } | null = null;

/** USD→INR mid-market rate from Frankfurter, cached in memory, with a static fallback. */
export async function getUsdInr(): Promise<FxRate> {
  if (cache && cache.expires > Date.now()) return cache.rate;
  const base = process.env.FX_API_URL || "https://api.frankfurter.dev/v1";
  try {
    const res = await fetch(`${base}/latest?base=USD&symbols=INR`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`fx ${res.status}`);
    const body = (await res.json()) as { rates?: { INR?: number } };
    const usdInr = body.rates?.INR;
    if (typeof usdInr !== "number" || !(usdInr > 0)) throw new Error("fx bad body");
    const rate: FxRate = { usdInr, source: "live", fetchedAt: new Date().toISOString() };
    cache = { rate, expires: Date.now() + config.fxCacheMs };
    return rate;
  } catch {
    return { usdInr: config.fallbackUsdInr, source: "fallback", fetchedAt: new Date().toISOString() };
  }
}

let multiCache: { rates: InrRates; expires: number } | null = null;
export type InrRates = { rates: Record<Currency, number>; source: "live" | "fallback" };

/** INR per unit for each calculator currency (Frankfurter, ECB reference rates). */
export async function getInrRates(): Promise<InrRates> {
  if (multiCache && multiCache.expires > Date.now()) return multiCache.rates;
  const base = process.env.FX_API_URL || "https://api.frankfurter.dev/v1";
  try {
    const res = await fetch(`${base}/latest?base=INR&symbols=${CURRENCIES.join(",")}`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`fx ${res.status}`);
    const body = (await res.json()) as { rates?: Partial<Record<Currency, number>> };
    const rates = { ...FALLBACK_INR };
    for (const c of CURRENCIES) {
      const perInr = body.rates?.[c];
      if (typeof perInr !== "number" || !(perInr > 0)) throw new Error("fx bad body");
      rates[c] = Math.round((1 / perInr) * 100) / 100;
    }
    const out: InrRates = { rates, source: "live" };
    multiCache = { rates: out, expires: Date.now() + config.fxCacheMs };
    return out;
  } catch {
    return { rates: { ...FALLBACK_INR }, source: "fallback" };
  }
}
