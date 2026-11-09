// Protect section checks. All run on text only: nothing is opened, fetched or paid.

import { fraudCheckCollect, fraudCheckQr, type FraudResult, type RiskLevel } from "./agents/agents";
import { ActivityLog } from "./agents/log";
import { DEMO_PAYMENTS, paymentById, type DemoPayment } from "./demo/data";
import { trustScore } from "./risk";

export type Check = { level: RiskLevel; score: number; signals: string[] };

const level = (s: number): RiskLevel => (s >= 70 ? "safe" : s >= 40 ? "caution" : "high");
const clamp = (n: number) => Math.max(0, Math.min(100, n));

// ---------- UPI QR ----------

export type UpiDetails = { payee: string; name: string; amount: string | null; note: string | null };

export function parseUpi(payload: string): UpiDetails | null {
  try {
    const u = new URL(payload.trim());
    if (u.protocol !== "upi:") return null;
    const p = u.searchParams;
    return { payee: p.get("pa") ?? "", name: p.get("pn") ?? "", amount: p.get("am"), note: p.get("tn") };
  } catch {
    return null;
  }
}

export function checkQr(payload: string): FraudResult & { details: UpiDetails | null } {
  return { ...fraudCheckQr(new ActivityLog(), payload), details: parseUpi(payload) };
}

// ---------- Payment link ----------

const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "rb.gy", "is.gd", "cutt.ly", "shorturl.at"];
const LURES = ["kyc", "refund", "reward", "cashback", "lottery", "prize", "electricity-bill", "disconnect", "otp", "verify", "blocked", "upi-pin"];

/** Checks a pasted payment link (https or upi://) for red flags. */
export function checkPaymentLink(raw: string): Check & { kind: "upi" | "web" | "invalid" } {
  const text = raw.trim();
  if (!text) return { kind: "invalid", level: "high", score: 0, signals: ["Paste a link first"] };
  if (text.toLowerCase().startsWith("upi:")) {
    const r = checkQr(text);
    return { kind: "upi", level: r.level, score: r.score, signals: r.signals };
  }
  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return { kind: "invalid", level: "high", score: 10, signals: ["This is not a readable link"] };
  }
  const base = trustScore(url.href);
  let score = base.score;
  const signals = base.signals.filter((s) => s !== "No high risk signals found");
  const host = url.hostname.toLowerCase();
  const all = (host + url.pathname + url.search).toLowerCase();
  if (SHORTENERS.includes(host)) { score -= 20; signals.push("Short link hides where it really goes"); }
  if (url.username) { score -= 25; signals.push("Contains @, which can hide the real site"); }
  if (/\.apk(\?|$)/.test(url.pathname)) { score -= 40; signals.push("Downloads an app file (.apk). Never install apps from links"); }
  const lures = LURES.filter((w) => all.includes(w));
  if (lures.length) { score -= 15 * Math.min(lures.length, 2); signals.push(`Pressure words: ${lures.join(", ")}`); }
  score = clamp(score);
  if (!signals.length) signals.push("No red flags found in the link text");
  return { kind: "web", level: level(score), score, signals };
}

// ---------- Collect requests ----------

export type CollectRequest = { id: string; from: string; name: string; amountPaise: number; message: string; paymentId?: string };

/** Incoming UPI collect requests for the simulator. One is real, the rest are traps. */
export const COLLECT_REQUESTS: CollectRequest[] = [
  { id: "c1", from: "kyc.update.sbi@ybl", name: "SBI KYC Desk", amountPaise: 4999_00, message: "KYC refund – approve to receive ₹4,999", paymentId: "s_rejected" },
  { id: "c2", from: "karthik.r@okicici", name: "Karthik R", amountPaise: 1100_00, message: "Your share of the cab and dinner" },
  { id: "c3", from: "olx.buyer.pay@paytm", name: "OLX Buyer", amountPaise: 15000_00, message: "Payment for your sofa – enter PIN to receive" },
  { id: "c4", from: "electricity.bill.tneb@axl", name: "TNEB Alert", amountPaise: 2_00, message: "Bill unpaid, power cut tonight. Pay ₹2 to verify" },
];

export type CollectVerdict = Check & { correct: "approve" | "decline"; lesson: string };

export function judgeCollect(c: CollectRequest): CollectVerdict {
  const p: DemoPayment = (c.paymentId && paymentById(c.paymentId)) || {
    id: c.id, txnId: "", ownerId: "u_me", merchant: c.name, payee: c.from, item: c.message, category: "Other",
    amountPaise: c.amountPaise, method: "upi", status: "pending", private: false, daysAgo: 0,
  };
  const r = fraudCheckCollect(new ActivityLog(), p);
  const signals = r.signals.filter(Boolean);
  let score = r.score;
  if (/receive|refund|verify/i.test(c.message)) { score -= 30; signals.push("Says you will receive money. A collect request always takes money from you"); }
  if (/power cut|tonight|blocked|urgent/i.test(c.message)) { score -= 15; signals.push("Uses urgency to rush you"); }
  const knownFriend = DEMO_PAYMENTS.some((q) => q.payee === c.from && q.category === "Friends");
  if (knownFriend) { score += 25; signals.push("You have paid this friend before"); }
  score = clamp(score);
  const lv = level(score);
  return {
    level: lv, score, signals: signals.length ? signals : ["No red flags"],
    correct: lv === "safe" ? "approve" : "decline",
    lesson: lv === "safe"
      ? "Fine to approve if you really owe this. Check the amount first."
      : "Decline. Entering your UPI PIN always sends money out – you never need a PIN to receive.",
  };
}

// ---------- Merchant Trust Score ----------

/** Score a merchant from a website or a UPI ID, using only the text and your own payment history. */
export function merchantTrust(raw: string): Check & { kind: "web" | "upi"; history: number } {
  const text = raw.trim().toLowerCase();
  if (text.includes("@") && !text.includes("/")) {
    const vpa = text.replace(/^upi:\/\/pay\?pa=/, "");
    const history = DEMO_PAYMENTS.filter((p) => p.payee === vpa && p.status === "success").length;
    const r = checkQr(`upi://pay?pa=${encodeURIComponent(vpa)}`);
    let score = r.score - 10;
    const signals = r.signals.filter((s) => s !== "No risk signals found");
    if (history) { score += Math.min(25, 8 * history); signals.push(`You paid this UPI ID ${history} time(s) before`); }
    else signals.push("You have never paid this UPI ID");
    if (/^[a-z]+\.?[a-z]*@(ok|ybl|paytm|axl|ibl)/.test(vpa) && !history) { score -= 5; signals.push("Looks like a personal UPI ID, not a registered shop"); }
    score = clamp(score);
    return { kind: "upi", level: level(score), score, signals, history };
  }
  const r = checkPaymentLink(text);
  return { kind: "web", level: r.level, score: r.score, signals: r.signals, history: 0 };
}

// ---------- OTP awareness quiz ----------

export type QuizQ = { q: string; options: string[]; answer: number; why: string };

export const OTP_QUIZ: QuizQ[] = [
  { q: "A caller says they are from your bank and asks for the OTP to stop a fraud charge. What do you do?", options: ["Share it quickly to stop the charge", "Hang up and call the number on your card"], answer: 1, why: "Banks never ask for an OTP. Anyone asking for it is trying to take money." },
  { q: "You are selling a sofa online. The buyer sends a QR and says scan it to receive payment.", options: ["Scan and enter PIN", "Refuse – scanning a QR only ever pays"], answer: 1, why: "Scanning a QR and entering your PIN sends money. To receive, you share your QR or UPI ID." },
  { q: "An SMS says your electricity will be cut tonight unless you call a number.", options: ["Call the number now", "Check on the official board app or website"], answer: 1, why: "Urgency is the trick. Utilities do not cut power after one SMS from a mobile number." },
  { q: "Someone asks you to install AnyDesk or a 'support app' to fix a refund.", options: ["Install it so they can help", "Never install screen-sharing apps for strangers"], answer: 1, why: "Screen-sharing apps let them see your OTPs and PIN." },
  { q: "Your OTP message says 'Do not share. Rs 9,999 debit to XYZ'. The caller says it is a refund.", options: ["It is a refund, share it", "Read the SMS – it says debit, so never share"], answer: 1, why: "Always read the OTP SMS. It tells you the real action and amount." },
];
