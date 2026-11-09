import { describe, expect, it } from "vitest";
import { SAFE_QR, SCAM_QR } from "../src/lib/demo/data";
import { checkPaymentLink, checkQr, COLLECT_REQUESTS, judgeCollect, merchantTrust, OTP_QUIZ, parseUpi } from "../src/lib/protect";

describe("protect", () => {
  it("reads UPI QR details and flags the scam QR", () => {
    expect(parseUpi(SCAM_QR)).toMatchObject({ payee: "paytm.refund.help@ybl", name: "Amazon Refund Desk", amount: "4999" });
    expect(checkQr(SCAM_QR).level).toBe("high");
    expect(checkQr(SAFE_QR).level).toBe("safe");
    expect(parseUpi("https://example.com")).toBeNull();
  });

  it("scores payment links", () => {
    expect(checkPaymentLink("https://www.amazon.in/gp/cart").level).toBe("safe");
    expect(checkPaymentLink("http://sbi-kyc-update.xyz/verify?refund=1").level).toBe("high");
    expect(checkPaymentLink("https://bit.ly/3abc").signals.join()).toMatch(/Short link/);
    expect(checkPaymentLink("https://amazon.in@evil.example/pay").signals.join()).toMatch(/@/);
    expect(checkPaymentLink("http://x.example/app.apk").level).toBe("high");
    expect(checkPaymentLink("").kind).toBe("invalid");
    expect(checkPaymentLink(SCAM_QR).kind).toBe("upi");
  });

  it("only the friend's collect request is safe to approve", () => {
    const answers = Object.fromEntries(COLLECT_REQUESTS.map((c) => [c.id, judgeCollect(c).correct]));
    expect(answers).toEqual({ c1: "decline", c2: "approve", c3: "decline", c4: "decline" });
  });

  it("merchant trust uses payment history for UPI IDs", () => {
    const known = merchantTrust("bigbasket@hdfcbank");
    expect(known.history).toBeGreaterThan(0);
    expect(known.level).toBe("safe");
    expect(merchantTrust("paytm.refund.help@ybl").level).not.toBe("safe");
    expect(merchantTrust("https://www.flipkart.com").kind).toBe("web");
  });

  it("quiz answers are valid options", () => {
    for (const q of OTP_QUIZ) expect(q.options[q.answer]).toBeDefined();
  });
});
