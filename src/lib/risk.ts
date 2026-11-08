// Merchant trust score from the link text only. Never fetches the URL.

export type TrustLabel = "Trusted" | "Caution" | "High risk";

export interface TrustResult {
  score: number;
  label: TrustLabel;
  signals: string[];
}

const KNOWN_STORES = [
  "amazon.com", "amazon.in", "bestbuy.com", "walmart.com", "target.com", "ebay.com",
  "apple.com", "flipkart.com", "etsy.com", "newegg.com", "costco.com", "ikea.com",
];
const RISKY_TLDS = ["zip", "xyz", "top", "click", "shop", "buzz", "rest", "icu", "loan"];
const SUSPICIOUS_WORDS = ["free", "giveaway", "90-off", "90off", "clearance-sale", "crypto", "verify", "login", "gift-card", "lucky"];

const isKnown = (host: string) => KNOWN_STORES.some((s) => host === s || host.endsWith(`.${s}`));

export function trustScore(link: string): TrustResult {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return { score: 10, label: "High risk", signals: ["Link could not be read"] };
  }
  const host = url.hostname.toLowerCase();
  const signals: string[] = [];
  let score = 55;

  if (url.protocol === "https:") score += 10;
  else { score -= 25; signals.push("Not a secure (https) link"); }

  if (isKnown(host)) { score += 30; signals.push("Well-known store"); }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) { score -= 35; signals.push("Uses a raw IP address"); }
  if (host.includes("xn--")) { score -= 25; signals.push("Look-alike characters in domain"); }

  const tld = host.split(".").pop() ?? "";
  if (RISKY_TLDS.includes(tld)) { score -= 15; signals.push(`Uncommon domain ending .${tld}`); }

  const label = host.split(".").slice(0, -1).join(".");
  if ((label.match(/-/g) ?? []).length >= 2) { score -= 10; signals.push("Many hyphens in domain"); }
  if (/\d{3,}/.test(label)) { score -= 5; signals.push("Long number in domain"); }
  if (!isKnown(host) && KNOWN_STORES.some((s) => host.includes(s.split(".")[0]))) {
    score -= 30; signals.push("Store name used on a different domain");
  }

  const path = (url.pathname + url.search).toLowerCase();
  const hits = SUSPICIOUS_WORDS.filter((w) => path.includes(w) || host.includes(w));
  if (hits.length) { score -= 10 * hits.length; signals.push(`Suspicious words: ${hits.join(", ")}`); }

  score = Math.max(0, Math.min(100, score));
  const result: TrustLabel = score >= 70 ? "Trusted" : score >= 40 ? "Caution" : "High risk";
  if (signals.length === 0) signals.push("No high risk signals found");
  return { score, label: result, signals };
}
