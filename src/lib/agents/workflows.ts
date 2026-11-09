// Workflows chain the agents for each demo scenario. Output: the shared log
// (for the Command Centre) plus the final answer the Assistant gives.

import { paymentById, SCAM_QR, SAFE_QR, DEMO_MEMBERS, DEMO_PAYMENTS } from "../demo/data";
import { formatInr } from "../truecost";
import type { ScenarioId } from "../demo/data";
import * as A from "./agents";
import { ActivityLog } from "./log";

export type WorkflowId = ScenarioId | "safe_qr";
export type WorkflowRun = { id: WorkflowId; log: ActivityLog; answer: string };

export const WORKFLOWS: { id: WorkflowId; title: string }[] = [
  { id: "scam_qr", title: "Scam QR scanned" },
  { id: "safe_qr", title: "Safe shop QR" },
  { id: "international", title: "Buying from abroad" },
  { id: "failed", title: "Failed payment, money debited" },
  { id: "refund", title: "Refund still pending" },
  { id: "duplicate", title: "Charged twice" },
  { id: "family", title: "Family budget check" },
];
export const isWorkflow = (v: unknown): v is WorkflowId => WORKFLOWS.some((w) => w.id === v);

const need = (id: string) => {
  const p = paymentById(id);
  if (!p) throw new Error(`demo payment ${id} missing`);
  return p;
};

function qr(log: ActivityLog, payload: string): string {
  const fraud = A.fraudCheckQr(log, payload);
  log.handoff("fraud", "router", `Risk ${fraud.level} for ${fraud.payee}`, { level: fraud.level });
  const amount = Number(new URL(payload).searchParams.get("am") ?? 0) * 100;
  const r = A.route(log, { fraud, domestic: true });
  log.handoff("router", "payment", r.pick ? `Pay by ${r.pick.label}` : "Do not pay");
  const paid = A.pay(log, { route: r, amountPaise: amount, merchant: fraud.payee ?? "payee" });
  log.handoff(paid ? "payment" : "router", "assistant", paid ? "Payment done" : "Payment stopped");
  return A.explain(log, fraud.level === "high"
    ? `Don't pay. This QR claims to be "${new URL(payload).searchParams.get("pn")}" but sends money to ${fraud.payee}. ${fraud.signals.at(-1)}`
    : `This QR looks fine: ${fraud.signals[0]}. Paid by ${r.pick?.label} (simulated).`);
}

function international(log: ActivityLog, usdInr: number): string {
  const p = need("s_forex");
  const cost = A.fxCost(log, { priceCents: 8500, usdInr });
  const best = cost.rows.find((r) => r.cheapest)!;
  log.handoff("fx", "budget", `Cheapest total ${formatInr(best.totalPaise)}`);
  const budget = A.budgetCheck(log, p.ownerId, p.category, best.totalPaise, p.id);
  log.handoff("budget", "router", `${budget.category} at ${budget.pct}% after this`);
  const fraud = A.fraudCheckLink(log, "https://www.etsy.com/listing/handmade-lamp");
  log.handoff("fraud", "router", `Store risk ${fraud.level}`);
  const r = A.route(log, { cost, fraud });
  log.handoff("router", "verdict", `Method ${r.pick?.label}`);
  const v = A.verdict(log, { item: p.item, budget, addPaise: best.totalPaise, trust: fraud.trust });
  log.handoff("verdict", "payment", v.verdict);
  const paid = v.verdict === "NOT WORTH IT" ? A.pay(log, { route: { pick: null, options: r.options }, amountPaise: 0, merchant: p.merchant }) : A.pay(log, { route: r, amountPaise: best.totalPaise, merchant: p.merchant });
  if (paid) {
    log.handoff("payment", "proof", `Ref ${paid.ref}`);
    A.saveProof(log, { txnId: paid.ref, merchant: p.merchant, amountPaise: paid.amountPaise, method: paid.method, status: "success (simulated)" }, "Purchase receipt");
  }
  log.handoff(paid ? "proof" : "verdict", "assistant", "Summary ready");
  const worst = cost.rows.reduce((a, b) => (b.totalPaise > a.totalPaise ? b : a));
  return A.explain(log, `${v.verdict}: ${v.reason} If you buy, pay with ${best.label}: ${formatInr(best.totalPaise)}, which saves ${formatInr(worst.totalPaise - best.totalPaise)} over ${worst.label}. Pay in USD, not INR, to avoid about ${formatInr(cost.dccSavingPaise)} in merchant conversion.`);
}

function stuck(log: ActivityLog, id: "s_failed" | "s_refund", now: number): string {
  const p = need(id);
  const t = A.track(log, p, now);
  log.handoff("tracker", "proof", `Status ${p.status}`);
  const proof = A.saveProof(log, p, id === "s_failed" ? "Failed but debited" : "Refund pending");
  if (t.needsDispute) {
    log.handoff("proof", "dispute", "Evidence ready");
    A.draftDispute(log, proof, t.overdue ? "refund_overdue" : "failed_debit");
    log.handoff("dispute", "assistant", "Draft ready");
  } else log.handoff("proof", "assistant", "No dispute needed yet");
  const eta = t.refundEta ? ` Refund of ${formatInr(p.refund!.amountPaise)} expected by ${t.refundEta}.` : "";
  return A.explain(log, `Don't pay ${p.merchant} again.${eta}${t.needsDispute ? " I drafted a dispute you can send with the saved receipt." : " Your receipt is saved if it is late."}`);
}

function duplicate(log: ActivityLog): string {
  const dup = need("s_dup2");
  const budget = A.budgetCheck(log, dup.ownerId, dup.category);
  const group = budget.duplicates.find((g) => g.some((p) => p.id === dup.id));
  if (!group) return A.explain(log, "No double charges found this month.");
  log.handoff("budget", "tracker", `${group.length} matching charges`);
  A.track(log, dup);
  log.handoff("tracker", "proof", "Both payments succeeded");
  const proof = A.saveProof(log, dup, "Duplicate charge");
  log.handoff("proof", "dispute", "Evidence ready");
  A.draftDispute(log, proof, "duplicate");
  log.handoff("dispute", "assistant", "Draft ready");
  return A.explain(log, `You paid ${dup.merchant} ${formatInr(dup.amountPaise)} twice on the same day. I drafted a refund request for the second charge (txn ${dup.txnId}).`);
}

function family(log: ActivityLog): string {
  const lines: string[] = [];
  for (const m of DEMO_MEMBERS) {
    const b = A.budgetCheck(log, m.id, "Groceries");
    const hidden = DEMO_PAYMENTS.filter((p) => p.ownerId === m.id && p.private).length;
    lines.push(`${m.name} ${b.pct}%`);
    log.handoff("budget", "assistant", `${m.name}: groceries ${b.pct}%, ${hidden} private item(s) kept hidden`);
  }
  return A.explain(log, `Family groceries this month: ${lines.join(", ")} of budget. Private items count in totals but their details stay hidden.`);
}

export function runWorkflow(id: WorkflowId, opts: { usdInr: number; now?: number }): WorkflowRun {
  const log = new ActivityLog();
  const now = opts.now ?? Date.now();
  const answer = {
    scam_qr: () => qr(log, SCAM_QR),
    safe_qr: () => qr(log, SAFE_QR),
    international: () => international(log, opts.usdInr),
    failed: () => stuck(log, "s_failed", now),
    refund: () => stuck(log, "s_refund", now),
    duplicate: () => duplicate(log),
    family: () => family(log),
  }[id]();
  return { id, log, answer };
}
