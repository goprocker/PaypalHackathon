import { NextResponse } from "next/server";
import { z } from "zod";
import { CATEGORIES, config } from "@/lib/config";
import { getUsdInr } from "@/lib/fx";
import { trustScore } from "@/lib/risk";
import { trueCost } from "@/lib/truecost";
import { aiVerdict } from "@/lib/verdict";

const Body = z.object({
  link: z.string().max(2000),
  item: z.string().min(1).max(200),
  priceCents: z.number().int().positive().max(10_000_000),
  shippingCents: z.number().int().min(0).max(1_000_000).default(0),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  includeDuty: z.boolean().default(false),
  // Until the DB lands (H2), the client may pass month-to-date spend.
  spentPaise: z.number().int().min(0).default(0),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const b = parsed.data;

  const fx = await getUsdInr();
  const cost = trueCost({ priceCents: b.priceCents, shippingCents: b.shippingCents, usdInr: fx.usdInr, includeDuty: b.includeDuty });
  const best = cost.rows.find((r) => r.cheapest)!;
  const trust = trustScore(b.link);
  const verdict = await aiVerdict({
    item: b.item,
    category: b.category,
    totalPaise: best.totalPaise,
    budgetPaise: config.budgets[b.category] ?? 0,
    spentPaise: b.spentPaise,
    trust,
  });

  return NextResponse.json({ fx, cost, trust, verdict });
}
