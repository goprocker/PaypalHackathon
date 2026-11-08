import { config } from "./config";

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
