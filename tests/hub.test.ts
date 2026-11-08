import { describe, expect, it } from "vitest";
import { config } from "../src/lib/config";
import { summarize } from "../src/lib/hub";
import type { ViewTxn } from "../src/lib/privacy";

const row = (id: string, isMine: boolean, category: string, amountPaise: number, status = "COMPLETED"): ViewTxn => ({
  id, ownerId: isMine ? "u_me" : "u_mom", ownerName: isMine ? "You" : "Mom", isMine, amountPaise, status,
  tag: "family", category, item: id, merchant: "m", createdAt: "2026-11-01T00:00:00Z", redacted: false,
});

const rows = [
  row("a", true, "Food", 1000),
  row("b", false, "Food", 2000),
  row("c", false, "Personal", 5000),
  row("d", true, "Shopping", 9999, "FAILED"),
];
const baseBudget = Object.values(config.budgets).reduce((a, b) => a + b, 0);

describe("summarize", () => {
  it("individual counts only the viewer's completed rows", () => {
    const s = summarize(rows, "individual", 3);
    expect(s.spentPaise).toBe(1000);
    expect(s.budgetPaise).toBe(baseBudget);
    expect(s.byMember).toEqual([]);
  });

  it("family includes redacted private amounts and scales budget", () => {
    const s = summarize(rows, "family", 3);
    expect(s.spentPaise).toBe(8000);
    expect(s.budgetPaise).toBe(baseBudget * 3);
    expect(s.byCategory[0]).toEqual({ category: "Personal", paise: 5000 });
    expect(s.byMember).toEqual([{ name: "Mom", paise: 7000 }, { name: "You", paise: 1000 }]);
  });

  it("budget percent per category", () => {
    const food = summarize(rows, "family", 3).budgets.find((b) => b.category === "Food")!;
    expect(food.spentPaise).toBe(3000);
    expect(food.pct).toBe(Math.round((3000 / (config.budgets.Food * 3)) * 100));
  });
});
