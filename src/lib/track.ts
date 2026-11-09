// Track section: payment status, refund timeline and dispute drafts, built
// on the Tracker, Proof and Dispute agents over the demo dataset.

import { draftDispute, findDuplicates, saveProof, track, type DisputeDraft, type TrackResult } from "./agents/agents";
import { ActivityLog } from "./agents/log";
import { DEMO_PAYMENTS, type DemoPayment } from "./demo/data";

const DAY = 24 * 60 * 60 * 1000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

export type Issue = "failed_debit" | "duplicate" | "refund_overdue" | "refund_pending";

/** Duplicate charges for one member (the later payment in each group is the extra one). */
export function duplicateIds(ownerId: string): Set<string> {
  const groups = findDuplicates(DEMO_PAYMENTS.filter((p) => p.ownerId === ownerId && p.status === "success"));
  return new Set(groups.flatMap((g) => g.slice(1).map((p) => p.id)));
}

export function issueFor(p: DemoPayment, t: TrackResult, dups: Set<string>): Issue | null {
  if (dups.has(p.id)) return "duplicate";
  if (p.status === "failed" && p.refund) return "failed_debit";
  if (t.overdue) return "refund_overdue";
  if (p.status === "refund_pending") return "refund_pending";
  return null;
}

/** Payments that need attention first, then the rest of the member's history. */
export function trackList(ownerId: string, now = Date.now()) {
  const dups = duplicateIds(ownerId);
  return DEMO_PAYMENTS.filter((p) => p.ownerId === ownerId).map((p) => {
    const t = track(new ActivityLog(), p, now);
    return { p, t, issue: issueFor(p, t, dups) };
  }).sort((a, b) => Number(!!b.issue || b.t.dontPayAgain) - Number(!!a.issue || a.t.dontPayAgain) || a.p.daysAgo - b.p.daysAgo);
}

export type Step = { label: string; date: string | null; done: boolean };

/** Timeline from payment to refund credit. Future steps carry the estimated date. */
export function timeline(p: DemoPayment, now = Date.now()): Step[] {
  const paid = now - p.daysAgo * DAY;
  const steps: Step[] = [{ label: p.status === "failed" ? "Payment failed, money debited" : "Paid", date: iso(paid), done: true }];
  if (!p.refund) {
    if (p.status === "pending") steps.push({ label: "Waiting for the bank to confirm", date: null, done: false });
    return steps;
  }
  const req = now - p.refund.requestedDaysAgo * DAY;
  const eta = req + p.refund.etaDays * DAY;
  const labels = ["Refund requested", "Merchant accepted", "Bank processing", "Credited to your account"];
  labels.forEach((label, i) => {
    const done = p.refund!.stage >= i;
    // Done steps are spread between request and ETA; the credit step shows the ETA until it happens.
    const at = i === 0 ? req : req + Math.round(((eta - req) * i) / 3);
    steps.push({ label, date: done ? iso(Math.min(at, now)) : i === 3 ? iso(eta) : null, done });
  });
  return steps;
}

export function buildDispute(p: DemoPayment, issue: Exclude<Issue, "refund_pending">): DisputeDraft {
  const log = new ActivityLog();
  const proof = saveProof(log, p, issue);
  return draftDispute(log, proof, issue);
}

export const METHOD_LABEL: Record<DemoPayment["method"], string> = {
  upi: "UPI", card: "Card", paypal: "PayPal", netbanking: "Net banking", forex: "Forex card",
};

/** Current time; call after `connection()` so the page renders per request. */
export const clock = () => Date.now();
