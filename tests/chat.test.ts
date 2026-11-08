import { describe, expect, it } from "vitest";
import { ruleReply, runTool } from "../src/lib/chat";
import { shapeForViewer, type Member, type RawTxn } from "../src/lib/privacy";

const me: Member = { id: "u_me", name: "Arun", relation: "Me", familyId: "f1" };
const mom: Member = { id: "u_mom", name: "Lakshmi", relation: "Mom", familyId: "f1" };
const txn = (id: string, ownerId: string, tag: RawTxn["tag"], category = "Food"): RawTxn => ({
  id, ownerId, amountPaise: 50000, tag, status: "COMPLETED", category, item: `item-${id}`, merchant: `shop-${id}`, createdAt: "2026-11-01T00:00:00Z",
});
const rows = shapeForViewer(me, [txn("a", "u_me", "me"), txn("b", "u_mom", "private", "Shopping"), txn("c", "u_mom", "family")], [me, mom]);

describe("chat tools", () => {
  it("individual view returns only the viewer's rows", () => {
    const out = runTool("get_transactions", { view: "individual" }, rows, 2) as { item: string }[];
    expect(out.map((r) => r.item)).toEqual(["item-a"]);
  });

  it("family view never leaks another member's private item", () => {
    const out = JSON.stringify(runTool("get_transactions", { view: "family" }, rows, 2));
    expect(out).not.toContain("item-b");
    expect(out).not.toContain("shop-b");
    expect(out).toContain("Personal – Other");
  });

  it("budget summary keeps private amounts in family totals", () => {
    const s = runTool("budget_summary", { view: "family" }, rows, 2) as { spent_inr: number };
    expect(s.spent_inr).toBe(1500);
  });

  it("rejects unknown tools", () => {
    expect(() => runTool("delete_everything", {}, rows, 2)).toThrow();
  });
});

describe("ruleReply", () => {
  it("answers category questions", () => {
    expect(ruleReply("How much did I spend on food?", rows, 2)).toContain("Food");
  });
  it("redirects off-topic questions", () => {
    expect(ruleReply("Write me a poem", rows, 2)).toContain("I can answer");
  });
});
