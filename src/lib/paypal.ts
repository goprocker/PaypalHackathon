// PayPal REST Orders v2 via server-side fetch. Falls back to a labelled mock provider without keys.

export const paypalMock = () => !process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET;

const apiBase = () =>
  process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

let token: { value: string; expires: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.expires > Date.now() + 60_000) return token.value;
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: body.access_token, expires: Date.now() + body.expires_in * 1000 };
  return token.value;
}

async function call<T>(path: string, init: RequestInit & { requestId?: string } = {}): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await accessToken()}`,
    "Content-Type": "application/json",
  };
  if (init.requestId) headers["PayPal-Request-Id"] = init.requestId;
  const res = await fetch(`${apiBase()}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const issue = (body as { details?: { issue?: string }[] }).details?.[0]?.issue ?? (body as { name?: string }).name;
    throw new PayPalError(res.status, issue ?? "UNKNOWN");
  }
  return body as T;
}

export class PayPalError extends Error {
  constructor(public status: number, public issue: string) {
    super(`PayPal ${status}: ${issue}`);
  }
}

export interface PayPalAmount { currency_code: string; value: string }
export interface PayPalOrder {
  id: string;
  status: string;
  purchase_units?: {
    amount?: PayPalAmount;
    payments?: { captures?: { id: string; status: string; amount: PayPalAmount }[] };
  }[];
}

export const centsToValue = (cents: number) => (cents / 100).toFixed(2);

export async function createOrder(o: { amountCents: number; currency: "USD"; description: string; requestId: string }) {
  if (paypalMock()) return { id: `MOCK-${o.requestId}`, status: "CREATED" } as PayPalOrder;
  return call<PayPalOrder>("/v2/checkout/orders", {
    method: "POST",
    requestId: o.requestId,
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: o.currency, value: centsToValue(o.amountCents) },
        description: o.description.slice(0, 127),
      }],
    }),
  });
}

export async function getOrder(id: string, expected: { amountCents: number; currency: string }): Promise<PayPalOrder> {
  if (paypalMock()) {
    return { id, status: "APPROVED", purchase_units: [{ amount: { currency_code: expected.currency, value: centsToValue(expected.amountCents) } }] };
  }
  return call<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(id)}`);
}

export async function captureOrder(id: string, expected: { amountCents: number; currency: string }): Promise<PayPalOrder> {
  if (paypalMock()) {
    const amount = { currency_code: expected.currency, value: centsToValue(expected.amountCents) };
    return { id, status: "COMPLETED", purchase_units: [{ amount, payments: { captures: [{ id: `MOCKCAP-${id.slice(5, 17)}`, status: "COMPLETED", amount }] } }] };
  }
  return call<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`, { method: "POST", requestId: `cap-${id}` });
}

/** True only if the order's amount exactly matches what the server stored. */
export function amountMatches(order: PayPalOrder, expected: { amountCents: number; currency: string }): boolean {
  const a = order.purchase_units?.[0]?.amount;
  return !!a && a.currency_code === expected.currency && a.value === centsToValue(expected.amountCents);
}
