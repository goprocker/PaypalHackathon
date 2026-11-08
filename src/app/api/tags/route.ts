import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db/client";
import { currentUserId } from "@/lib/session";

const Body = z.object({
  txnId: z.string().min(1).max(80),
  tag: z.enum(["me", "family", "private"]),
  item: z.string().trim().min(1).max(200).optional(),
});

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { txnId, tag, item } = parsed.data;

  const t = schema.transactions;
  const [txn] = await db.select().from(t).where(and(eq(t.id, txnId), eq(t.ownerId, userId)));
  if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  await db.update(t).set({ tag, ...(item ? { item } : {}) }).where(eq(t.id, txnId));

  // Proof receipt is created once and never changed.
  const [proof] = await db.select().from(schema.proofs).where(eq(schema.proofs.txnId, txnId));
  if (proof) return NextResponse.json({ proofId: proof.id, proof: JSON.parse(proof.data) });

  const data = {
    transactionId: txn.id,
    paypalOrderId: txn.paypalOrderId,
    captureId: txn.captureId,
    item: item ?? txn.item,
    merchant: txn.merchant,
    amountCents: txn.amountCents,
    currency: txn.currency,
    fxRate: txn.fxRate,
    feesPaise: txn.feesPaise,
    totalPaise: txn.amountPaise,
    tag,
    paidAt: txn.createdAt,
  };
  await db.insert(schema.proofs)
    .values({ id: `prf_${randomUUID()}`, txnId, data: JSON.stringify(data), createdAt: new Date().toISOString() })
    .onConflictDoNothing({ target: schema.proofs.txnId });
  // Re-read so a concurrent tag call cannot produce two different proofs.
  const [saved] = await db.select().from(schema.proofs).where(eq(schema.proofs.txnId, txnId));
  return NextResponse.json({ proofId: saved.id, proof: JSON.parse(saved.data) });
}
