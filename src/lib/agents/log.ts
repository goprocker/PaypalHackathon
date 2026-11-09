// Shared activity log. Every agent writes here; the Command Centre renders it.

export const AGENTS = ["fraud", "fx", "budget", "router", "verdict", "payment", "tracker", "proof", "dispute", "assistant"] as const;
export type AgentId = (typeof AGENTS)[number];

export const AGENT_INFO: Record<AgentId, { name: string; job: string }> = {
  fraud: { name: "Fraud", job: "Checks QR codes, links and collect requests for risk signals." },
  fx: { name: "FX / Cost", job: "Works out the final INR cost of each way to pay." },
  budget: { name: "Budget", job: "Compares a spend with this month's category budget." },
  router: { name: "Router", job: "Picks the best payment method and blocks unsafe ones." },
  verdict: { name: "Verdict", job: "Says whether the purchase is a good idea." },
  payment: { name: "Payment", job: "Runs the payment. Simulated – no bank connected." },
  tracker: { name: "Tracker", job: "Follows status, refunds and expected dates." },
  proof: { name: "Proof", job: "Saves the receipt and transaction ID." },
  dispute: { name: "Dispute", job: "Drafts a complaint when money is stuck or charged twice." },
  assistant: { name: "Assistant", job: "Explains what the agents found in plain words." },
};

export type EventKind = "start" | "result" | "handoff" | "warn" | "block";

export type AgentEvent = {
  seq: number;
  agent: AgentId;
  kind: EventKind;
  message: string;
  to?: AgentId;
  data?: Record<string, unknown>;
};

export class ActivityLog {
  readonly events: AgentEvent[] = [];
  emit(agent: AgentId, kind: EventKind, message: string, extra: { to?: AgentId; data?: Record<string, unknown> } = {}) {
    this.events.push({ seq: this.events.length + 1, agent, kind, message, ...extra });
  }
  handoff(from: AgentId, to: AgentId, message: string, data?: Record<string, unknown>) {
    this.emit(from, "handoff", message, { to, data });
  }
  /** Agents that wrote at least one event, in first-seen order. */
  get used(): AgentId[] {
    return [...new Set(this.events.map((e) => e.agent))];
  }
}
