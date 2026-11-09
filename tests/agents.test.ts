import { describe, expect, it } from "vitest";
import { fraudCheckQr, findDuplicates } from "../src/lib/agents/agents";
import { ActivityLog } from "../src/lib/agents/log";
import { runWorkflow, WORKFLOWS } from "../src/lib/agents/workflows";
import { DEMO_PAYMENTS, SAFE_QR, SCAM_QR } from "../src/lib/demo/data";

const run = (id: Parameters<typeof runWorkflow>[0]) => runWorkflow(id, { usdInr: 88.5, now: Date.UTC(2026, 10, 10) });

describe("agents", () => {
  it("flags the scam QR and passes the safe one", () => {
    expect(fraudCheckQr(new ActivityLog(), SCAM_QR).level).toBe("high");
    expect(fraudCheckQr(new ActivityLog(), SAFE_QR).level).toBe("safe");
    expect(fraudCheckQr(new ActivityLog(), "hello").level).toBe("high");
  });

  it("scam QR: fraud → router blocks → payment stopped → assistant explains", () => {
    const { log, answer } = run("scam_qr");
    expect(log.events.some((e) => e.agent === "router" && e.kind === "block")).toBe(true);
    expect(log.events.some((e) => e.agent === "payment" && e.kind === "block")).toBe(true);
    expect(log.events.some((e) => e.agent === "payment" && e.kind === "result")).toBe(false);
    expect(answer).toMatch(/Don't pay/);
  });

  it("international prices every method; verdict gates payment and proof", () => {
    const { log, answer } = run("international");
    expect(log.used).toEqual(expect.arrayContaining(["fx", "budget", "fraud", "router", "verdict", "payment", "assistant"]));
    expect(answer).toMatch(/Forex card/);
    const paid = log.events.some((e) => e.agent === "payment" && e.kind === "result");
    expect(log.used.includes("proof")).toBe(paid);
  });

  it("failed debit and duplicate end in a dispute draft", () => {
    for (const id of ["failed", "duplicate"] as const) {
      const { log } = run(id);
      expect(log.events.some((e) => e.agent === "dispute")).toBe(true);
    }
    expect(run("refund").answer).toMatch(/Don't pay Flipkart again/);
  });

  it("finds exactly the seeded double charge", () => {
    const groups = findDuplicates(DEMO_PAYMENTS);
    expect(groups.map((g) => g.map((p) => p.id).sort())).toEqual([["s_dup1", "s_dup2"]]);
  });

  it("every workflow runs, numbers events in order and records handoffs", () => {
    for (const w of WORKFLOWS) {
      const { log } = run(w.id);
      expect(log.events.map((e) => e.seq)).toEqual(log.events.map((_, i) => i + 1));
      expect(log.events.some((e) => e.kind === "handoff" && e.to)).toBe(true);
      expect(log.events.at(-1)!.agent).toBe("assistant");
    }
  });
});
