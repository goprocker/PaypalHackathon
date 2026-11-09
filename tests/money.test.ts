import { describe, expect, it } from "vitest";
import { budgets, duplicateGroups, familyView, foreignUsd, goalSchema, lrs, monthSummary, monthsToGoal, netWorth, privateItems, subscriptions } from "../src/lib/money";
import { paymentById } from "../src/lib/demo/data";

const RATES = { USD: 88, EUR: 95, GBP: 110, SGD: 66, AUD: 57 };

describe("money", () => {
  it("summarises only successful payments this month", () => {
    const s = monthSummary("u_me");
    expect(s.categories.reduce((a, c) => a + c.paise, 0)).toBe(s.totalPaise);
    expect(s.failed).toBeGreaterThan(0);
  });

  it("finds the broadband double charge with the extra amount", () => {
    const [g] = duplicateGroups("u_me");
    expect(g.kept.id).toBe("s_dup1");
    expect(g.extra.map((p) => p.id)).toEqual(["s_dup2"]);
    expect(g.extraPaise).toBe(1179_00);
  });

  it("lists subscriptions with yearly cost", () => {
    const subs = subscriptions("u_me");
    expect(subs.find((x) => x.merchant === "Netflix")?.yearlyPaise).toBe(499_00 * 12);
  });

  it("applies budget overrides", () => {
    const food = budgets("u_me", { Food: 100_00 }).find((b) => b.category === "Food")!;
    expect(food.state).toBe("over");
  });

  it("validates goals and estimates months", () => {
    expect(goalSchema.safeParse({ name: "", target: "0", saved: "0", monthly: "0" }).success).toBe(false);
    expect(goalSchema.safeParse({ name: "x", target: "100", saved: "200", monthly: "0" }).success).toBe(false);
    expect(monthsToGoal({ targetPaise: 1000, savedPaise: 0, monthlyPaise: 300 })).toBe(4);
    expect(monthsToGoal({ targetPaise: 1000, savedPaise: 0, monthlyPaise: 0 })).toBeNull();
  });

  it("nets debts against assets", () => {
    const w = netWorth("u_dad");
    expect(w.netPaise).toBe(w.assetsPaise - w.debtsPaise);
    expect(w.debtsPaise).toBe(2_10_000_00);
  });

  it("reads foreign prices from the item text for LRS", () => {
    expect(foreignUsd(paymentById("s_forex")!, RATES)).toBe(85);
    expect(foreignUsd(paymentById("d19")!, RATES)).toBe(135); // SGD 180 at 66/88
    const l = lrs("u_me", RATES);
    expect(l.usedUsd).toBeGreaterThan(2_340);
    expect(l.leftUsd).toBe(250_000 - l.usedUsd);
  });
});

describe("family privacy", () => {
  it("never shows another member's private items", () => {
    const mom = familyView("u_me").find((m) => m.id === "u_mom")!;
    expect(mom.items!.some((p) => p.private)).toBe(false);
    expect(mom.categories!.find((c) => c.category === "Private")?.paise).toBe(mom.privatePaise);
  });

  it("shows the viewer their own private items", () => {
    const me = familyView("u_me").find((m) => m.self)!;
    expect(me.items!.some((p) => p.private)).toBe(true);
    expect(privateItems("u_me").every((p) => p.ownerId === "u_me" && p.private)).toBe(true);
  });

  it("honours each member's share setting", () => {
    const v = familyView("u_me", { u_mom: "categories", u_dad: "total", u_me: "total" });
    const mom = v.find((m) => m.id === "u_mom")!, dad = v.find((m) => m.id === "u_dad")!, me = v.find((m) => m.self)!;
    expect(mom.items).toBeNull();
    expect(mom.categories).not.toBeNull();
    expect(dad.categories).toBeNull();
    expect(dad.totalPaise).toBeGreaterThan(0);
    expect(me.items).not.toBeNull(); // own setting never hides from yourself
  });
});

describe("privacy cookie", () => {
  it("accepts a partial setting map and rejects bad values", async () => {
    const { privacySchema } = await import("../src/lib/money");
    expect(privacySchema.safeParse({ u_me: "total" }).success).toBe(true);
    expect(privacySchema.safeParse({ u_me: "everything" }).success).toBe(false);
  });
});
