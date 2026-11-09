import { describe, expect, it } from "vitest";
import { DEMO_PAYMENTS, SCAM_QR, SCENARIOS, paymentById } from "../src/lib/demo/data";

describe("demo dataset", () => {
  it("has about 60 payments with unique ids and txn ids", () => {
    expect(DEMO_PAYMENTS.length).toBeGreaterThanOrEqual(55);
    expect(new Set(DEMO_PAYMENTS.map((p) => p.id)).size).toBe(DEMO_PAYMENTS.length);
    expect(new Set(DEMO_PAYMENTS.map((p) => p.txnId)).size).toBe(DEMO_PAYMENTS.length);
  });

  it("covers every scenario problem", () => {
    const has = (s: string) => DEMO_PAYMENTS.some((p) => p.status === s);
    expect(has("failed") && has("refund_pending") && has("pending") && has("refunded")).toBe(true);
    const [a, b] = [paymentById("s_dup1")!, paymentById("s_dup2")!];
    expect([a.payee, a.amountPaise]).toEqual([b.payee, b.amountPaise]);
    expect(new Set(DEMO_PAYMENTS.map((p) => p.ownerId)).size).toBe(3);
    expect(DEMO_PAYMENTS.some((p) => p.private)).toBe(true);
    expect(SCAM_QR).toMatch(/^upi:\/\/pay\?/);
  });

  it("points scenario focus at real rows", () => {
    for (const s of SCENARIOS) if (s.focus) expect(paymentById(s.focus)).toBeDefined();
  });
});
