import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db/client";
import { amountMatches, captureOrder, getOrder, PayPalError } from "@/lib/paypal";
import { currentUserId } from "@/lib/session";

const Body = z.object({ orderId: z.string().min(1).max(64) });

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const o = schema.orders;
  const [stored] = await db.select().from(o).where(and(eq(o.id, parsed.data.orderId), eq(o.ownerId, userId)));
  if (!stored) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Idempotent: a repeated capture returns the existing transaction.
  const [existing] = await db.select().from(schema.transactions).where(eq(schema.transactions.paypalOrderId, stored.id));
  if (existing) return NextResponse.json({ txnId: existing.id, status: existing.status });

  const expected = { amountCents: stored.amountCents, currency: stored.currency };
  try {
    const before = await getOrder(stored.id, expected);
    if (!amountMatches(before, expected)) {
      await db.update(o).set({ status: "FAILED" }).where(eq(o.id, stored.id));
      return NextResponse.json({ error: "The payment amount did not match. Nothing was charged." }, { status: 409 });
    }

    const captured = await captureOrder(stored.id, expected);
    const cap = captured.purchase_units?.[0]?.payments?.captures?.[0];
    const ok = captured.status === "COMPLETED" && cap?.status === "COMPLETED"
      && cap.amount.currency_code === expected.currency && cap.amount.value === (expected.amountCents / 100).toFixed(2);
    if (!ok) {
      await db.update(o).set({ status: "FAILED" }).where(eq(o.id, stored.id));
      return NextResponse.json({ error: "PayPal did not complete the payment. You were not charged; try again." }, { status: 402 });
    }

    const txnId = `txn_${randomUUID()}`;
    await db.insert(schema.transactions).values({
      id: txnId,
      ownerId: userId,
      amountPaise: stored.totalPaise,
      amountCents: stored.amountCents,
      currency: stored.currency,
      fxRate: stored.fxRate,
      feesPaise: stored.feesPaise,
      status: "COMPLETED",
      tag: null,
      category: stored.category,
      item: stored.item,
      merchant: stored.merchant,
      paypalOrderId: stored.id,
      captureId: cap.id,
      createdAt: new Date().toISOString(),
    });
    await db.update(o).set({ status: "COMPLETED" }).where(eq(o.id, stored.id));
    return NextResponse.json({ txnId, status: "COMPLETED", captureId: cap.id, mock: stored.mock });
  } catch (e) {
    const issue = e instanceof PayPalError ? e.issue : "UNAVAILABLE";
    const msg = issue === "INSTRUMENT_DECLINED"
      ? "Your payment method was declined. Try another card or balance in PayPal."
      : "We could not finish the payment. Check PayPal before trying again so you do not pay twice.";
    return NextResponse.json({ error: msg, issue }, { status: 502 });
  }
}
