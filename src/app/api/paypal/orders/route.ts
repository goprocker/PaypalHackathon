import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { CheckoutInput, merchantFromLink } from "@/lib/checkout";
import { db, schema } from "@/lib/db/client";
import { getUsdInr } from "@/lib/fx";
import { createOrder, PayPalError, paypalMock } from "@/lib/paypal";
import { currentUserId } from "@/lib/session";
import { trueCost } from "@/lib/truecost";

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const parsed = CheckoutInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const b = parsed.data;

  // Amount is computed here from validated input; the client never sends a final total.
  const amountCents = b.priceCents + b.shippingCents;
  const fx = await getUsdInr();
  const paypalRow = trueCost({ priceCents: b.priceCents, shippingCents: b.shippingCents, usdInr: fx.usdInr, includeDuty: b.includeDuty })
    .rows.find((r) => r.id === "paypal")!;

  try {
    const order = await createOrder({ amountCents, currency: "USD", description: b.item, requestId: randomUUID() });
    await db.insert(schema.orders).values({
      id: order.id,
      ownerId: userId,
      amountCents,
      currency: "USD",
      item: b.item,
      category: b.category,
      merchant: merchantFromLink(b.link),
      fxRate: fx.usdInr,
      totalPaise: paypalRow.totalPaise,
      feesPaise: paypalRow.markupPaise + paypalRow.gstPaise + paypalRow.feePaise,
      status: "CREATED",
      mock: paypalMock(),
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ orderId: order.id, mock: paypalMock() });
  } catch (e) {
    const issue = e instanceof PayPalError ? e.issue : "UNAVAILABLE";
    return NextResponse.json({ error: "Could not start the payment. Please try again in a moment.", issue }, { status: 502 });
  }
}
