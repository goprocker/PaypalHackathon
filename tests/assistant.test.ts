import { describe, expect, it } from "vitest";
import { ruleAnswer, type Ctx } from "../src/lib/assistant";

const ctx: Ctx = { viewer: "u_me", privacy: {}, rates: { USD: 88, EUR: 95, GBP: 110, SGD: 66, AUD: 57 }, now: Date.UTC(2026, 10, 10) };

describe("assistant rules", () => {
  it("lists problem payments with Don't pay again", () => {
    const a = ruleAnswer("Any problems with my payments?", "en", ctx);
    expect(a.reply).toMatch(/Croma/);
    expect(a.reply).toMatch(/Don't pay again/);
    expect(a.agents).toContain("tracker");
  });
  it("finds the double charge and links to dispute", () => {
    const a = ruleAnswer("Was I charged twice?", "en", ctx);
    expect(a.reply).toMatch(/ACT Fibernet/);
    expect(a.links.some((l) => l.href.startsWith("/track?tool=dispute"))).toBe(true);
  });
  it("flags the scam QR via the Fraud agent", () => {
    const a = ruleAnswer("Is upi://pay?pa=paytm.refund.help@ybl&pn=Amazon%20Refund%20Desk&am=4999 safe?", "en", ctx);
    expect(a.reply).toMatch(/High risk/);
    expect(a.agents).toContain("fraud");
  });
  it("prices a USD purchase", () => {
    expect(ruleAnswer("What would $120 really cost?", "en", ctx).agents).toContain("fx");
  });
  it("replies in Tamil and Hindi", () => {
    expect(ruleAnswer("என் கட்டணங்களில் சிக்கல் உண்டா?", "ta", ctx).reply).toMatch(/கவனிக்க/);
    expect(ruleAnswer("क्या दो बार पैसे कटे?", "hi", ctx).reply).toMatch(/बार पैसे काटे/);
  });
  it("never names another member's private items in family answers", () => {
    const a = ruleAnswer("How much did the family spend?", "en", ctx);
    expect(a.reply).toMatch(/Lakshmi/);
    expect(a.reply).not.toMatch(/Saree|Apollo/);
  });
});
