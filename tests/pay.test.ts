import { describe, expect, it } from "vitest";
import { IntlInput, intlCost, largeCheck, LargeInput, RouterInput, smartRoute, zodMessages } from "../src/lib/pay";

describe("international calculator", () => {
  it("adds markup, GST on markup and duty on landed value", () => {
    const r = intlCost({ price: 100, shipping: 10, currency: "USD", rate: 88, markupPct: 3.5, dutyPct: 42, gstOnMarkup: true });
    expect(r.goodsPaise).toBe(880000);
    expect(r.shippingPaise).toBe(88000);
    expect(r.markupPaise).toBe(33880);
    expect(r.gstPaise).toBe(6098);
    expect(r.dutyPaise).toBe(406560);
    expect(r.totalPaise).toBe(968000 + 33880 + 6098 + 406560);
  });

  it("gives readable validation errors", () => {
    const p = IntlInput.safeParse({ price: "0", shipping: "-1", currency: "USD", rate: "abc", markupPct: 2, dutyPct: 0, gstOnMarkup: false });
    expect(p.success).toBe(false);
    expect(zodMessages(p.error!)).toEqual(expect.arrayContaining(["Price must be more than 0", "Shipping cannot be negative", "Rate must be a number"]));
  });
});

describe("smart payment router", () => {
  const route = (o: Partial<RouterInput>) => smartRoute(RouterInput.parse({ amount: 1000, where: "india", merchantAccepts: ["upi", "card", "paypal"], ...o }));

  it("in India prefers a free method and never offers PayPal or forex", () => {
    const rows = route({});
    expect(rows.find((r) => r.id === "paypal")!.available).toBe(false);
    expect(rows.find((r) => r.id === "forex")!.available).toBe(false);
    expect(rows.find((r) => r.best)!.totalPaise).toBe(100000);
  });

  it("blocks UPI for a risky payee and above ₹1 lakh", () => {
    expect(route({ riskyPayee: true }).find((r) => r.id === "upi")!.available).toBe(false);
    expect(route({ amount: 150000 }).find((r) => r.id === "upi")!.available).toBe(false);
  });

  it("abroad picks the forex card when the shop takes cards", () => {
    const rows = route({ where: "abroad", amount: 85, rate: 88.5 });
    expect(rows.find((r) => r.best)!.id).toBe("forex");
    expect(rows.find((r) => r.id === "upi")!.available).toBe(false);
    expect(route({ where: "abroad", amount: 85, merchantAccepts: ["paypal"] }).find((r) => r.best)!.id).toBe("paypal");
  });

  it("rejects an empty method list", () => {
    expect(RouterInput.safeParse({ amount: 10, where: "india", merchantAccepts: [] }).success).toBe(false);
  });
});

describe("large payment check", () => {
  const check = (o: Partial<LargeInput>) => largeCheck({ amount: 300000, purpose: "general", newBeneficiary: false, nameMatches: "yes", requestedBy: "me", ...o });

  it("applies UPI, IMPS and RTGS limits", () => {
    const r = check({});
    const ok = Object.fromEntries(r.rails.map((x) => [x.id, x.ok]));
    expect(ok).toEqual({ upi: false, imps: true, neft: true, rtgs: true });
    expect(r.best).toBe("neft");
    expect(check({ purpose: "hospital" }).best).toBe("upi");
    expect(check({ amount: 50000 }).rails.find((x) => x.id === "rtgs")!.ok).toBe(false);
  });

  it("stops on a name mismatch or a caller asking for money to a new payee", () => {
    expect(check({ nameMatches: "no" }).risk).toBe("stop");
    expect(check({ requestedBy: "caller", newBeneficiary: true }).best).toBeNull();
    expect(check({ newBeneficiary: true }).risk).toBe("check");
    expect(check({}).risk).toBe("ok");
  });
});
