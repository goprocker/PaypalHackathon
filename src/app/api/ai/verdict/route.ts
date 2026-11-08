import { NextResponse } from "next/server";
import { CheckoutInput } from "@/lib/checkout";
import { config } from "@/lib/config";
import { monthSpent } from "@/lib/db/queries";
import { getUsdInr } from "@/lib/fx";
import { trustScore } from "@/lib/risk";
import { currentUserId } from "@/lib/session";
import { trueCost } from "@/lib/truecost";
import { aiVerdict } from "@/lib/verdict";

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const parsed = CheckoutInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const b = parsed.data;

  const fx = await getUsdInr();
  const cost = trueCost({ priceCents: b.priceCents, shippingCents: b.shippingCents, usdInr: fx.usdInr, includeDuty: b.includeDuty });
  const best = cost.rows.find((r) => r.cheapest)!;
  const trust = trustScore(b.link);
  const budgetPaise = config.budgets[b.category] ?? 0;
  const spentPaise = await monthSpent(userId, b.category);
  const verdict = await aiVerdict({ item: b.item, category: b.category, totalPaise: best.totalPaise, budgetPaise, spentPaise, trust });

  return NextResponse.json({ fx, cost, trust, verdict, budget: { budgetPaise, spentPaise } });
}
