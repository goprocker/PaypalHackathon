import { describe, expect, it, vi } from "vitest";
import { verifyWebhook } from "../src/lib/paypal";
import { handleWebhook } from "../src/lib/webhook";

const event = JSON.stringify({ event_type: "PAYMENT.CAPTURE.DENIED", resource: { id: "CAP1", status: "DENIED" } });

describe("handleWebhook", () => {
  it("rejects unverified events without touching data", async () => {
    const apply = vi.fn();
    expect(await handleWebhook(new Headers(), event, async () => false, apply)).toBe(401);
    expect(apply).not.toHaveBeenCalled();
  });

  it("applies verified capture status changes", async () => {
    const apply = vi.fn(async () => {});
    expect(await handleWebhook(new Headers(), event, async () => true, apply)).toBe(200);
    expect(apply).toHaveBeenCalledWith("CAP1", "FAILED");
  });

  it("ignores unrelated verified events", async () => {
    const apply = vi.fn();
    const other = JSON.stringify({ event_type: "CHECKOUT.ORDER.APPROVED", resource: { id: "O1" } });
    expect(await handleWebhook(new Headers(), other, async () => true, apply)).toBe(200);
    expect(apply).not.toHaveBeenCalled();
  });
});

describe("verifyWebhook", () => {
  it("never trusts events without PayPal keys and a webhook id", async () => {
    vi.stubEnv("PAYPAL_CLIENT_ID", "");
    vi.stubEnv("PAYPAL_WEBHOOK_ID", "");
    expect(await verifyWebhook(new Headers({ "paypal-transmission-sig": "forged" }), event)).toBe(false);
    vi.unstubAllEnvs();
  });

  it("rejects a body that is not a single JSON object", async () => {
    vi.stubEnv("PAYPAL_CLIENT_ID", "id");
    vi.stubEnv("PAYPAL_CLIENT_SECRET", "secret");
    vi.stubEnv("PAYPAL_WEBHOOK_ID", "WH1");
    const headers = new Headers({
      "paypal-auth-algo": "a", "paypal-cert-url": "c", "paypal-transmission-id": "i", "paypal-transmission-sig": "s", "paypal-transmission-time": "t",
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(await verifyWebhook(headers, `{}, "webhook_id": "attacker"`)).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    vi.unstubAllEnvs();
  });
});
