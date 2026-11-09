import { describe, expect, it } from "vitest";
import { paymentById } from "../src/lib/demo/data";
import { buildDispute, duplicateIds, timeline, trackList } from "../src/lib/track";

const NOW = Date.UTC(2026, 10, 10);

describe("track", () => {
  it("lists problem payments first with the right issue", () => {
    const list = trackList("u_me", NOW);
    const top = list.slice(0, 3).map((x) => [x.p.id, x.issue]);
    expect(top).toEqual(expect.arrayContaining([["s_failed", "failed_debit"], ["s_refund", "refund_pending"], ["s_dup2", "duplicate"]]));
    expect(list.every((x) => x.p.ownerId === "u_me")).toBe(true);
  });

  it("marks only the second duplicate as the extra charge", () => {
    expect([...duplicateIds("u_me")]).toEqual(["s_dup2"]);
  });

  it("builds a refund timeline with an estimated credit date", () => {
    const steps = timeline(paymentById("s_refund")!, NOW);
    expect(steps.map((s) => s.done)).toEqual([true, true, true, true, false]);
    expect(steps.at(-1)!.date).toBe("2026-11-13"); // requested 4 days ago + 7 day ETA
    expect(timeline(paymentById("s_refunded")!, NOW).every((s) => s.done)).toBe(true);
  });

  it("drafts a dispute with the txn id and amount", () => {
    const d = buildDispute(paymentById("s_failed")!, "failed_debit");
    expect(d.subject).toContain(paymentById("s_failed")!.txnId);
    expect(d.body).toMatch(/debited/);
  });
});
