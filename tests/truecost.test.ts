import { describe, expect, it } from "vitest";
import { config } from "../src/lib/config";
import { methodCost, trueCost } from "../src/lib/truecost";

const byId = (id: string) => config.methods.find((m) => m.id === id)!;

describe("trueCost", () => {
  const input = { priceCents: 10000, shippingCents: 0, usdInr: 88 }; // $100 → ₹8,800

  it("PayPal: base plus 4% markup, no GST", () => {
    const r = methodCost(input, byId("paypal"));
    expect(r.basePaise).toBe(880000);
    expect(r.markupPaise).toBe(35200);
    expect(r.gstPaise).toBe(0);
    expect(r.totalPaise).toBe(915200);
  });

  it("credit card: 3.5% markup plus 18% GST on markup", () => {
    const r = methodCost(input, byId("credit_card"));
    expect(r.markupPaise).toBe(30800);
    expect(r.gstPaise).toBe(5544);
    expect(r.totalPaise).toBe(916344);
  });

  it("forex card: 1% markup plus GST, cheapest", () => {
    const res = trueCost(input);
    const fc = res.rows.find((r) => r.id === "forex_card")!;
    expect(fc.totalPaise).toBe(880000 + 8800 + 1584);
    expect(res.cheapest).toBe("forex_card");
    expect(res.rows.filter((r) => r.cheapest)).toHaveLength(1);
  });

  it("adds shipping to base and duty only on item price", () => {
    const r = methodCost({ ...input, shippingCents: 1000, includeDuty: true }, byId("paypal"));
    expect(r.basePaise).toBe(968000);
    expect(r.dutyPaise).toBe(Math.round(880000 * config.importDutyRate));
  });

  it("reports DCC saving", () => {
    expect(trueCost(input).dccSavingPaise).toBe(Math.round(880000 * config.dccMarkup));
  });

  it("rejects bad input", () => {
    expect(() => trueCost({ priceCents: 1.5, usdInr: 88 })).toThrow();
    expect(() => trueCost({ priceCents: -1, usdInr: 88 })).toThrow();
    expect(() => trueCost({ priceCents: 100, usdInr: 0 })).toThrow();
  });
});
