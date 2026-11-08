import { eq } from "drizzle-orm";
import { db, schema } from "./db/client";

export interface WebhookEvent {
  event_type?: string;
  resource?: { id?: string; status?: string };
}

const STATUS: Record<string, string> = {
  "PAYMENT.CAPTURE.COMPLETED": "COMPLETED",
  "PAYMENT.CAPTURE.DENIED": "FAILED",
  "PAYMENT.CAPTURE.REFUNDED": "REFUNDED",
  "PAYMENT.CAPTURE.REVERSED": "REFUNDED",
};

export type Verify = (headers: Headers, rawBody: string) => Promise<boolean>;
export type ApplyStatus = (captureId: string, status: string) => Promise<void>;

export const applyCaptureStatus: ApplyStatus = async (captureId, status) => {
  await db.update(schema.transactions).set({ status }).where(eq(schema.transactions.captureId, captureId));
};

/** Verify first, then apply. Returns the HTTP status to answer PayPal with. */
export async function handleWebhook(headers: Headers, rawBody: string, verify: Verify, apply: ApplyStatus = applyCaptureStatus): Promise<number> {
  if (!(await verify(headers, rawBody))) return 401;
  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return 400;
  }
  const status = event.event_type ? STATUS[event.event_type] : undefined;
  const captureId = event.resource?.id;
  if (status && captureId) await apply(captureId, status);
  return 200;
}
