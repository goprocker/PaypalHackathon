import { config } from "./config";
import type { ViewTxn } from "./privacy";

export type HubView = "individual" | "family";

export interface HubSummary {
  spentPaise: number;
  budgetPaise: number;
  budgetLeftPaise: number;
  count: number;
  byCategory: { category: string; paise: number }[];
  byMember: { name: string; paise: number }[];
  budgets: { category: string; spentPaise: number; limitPaise: number; pct: number }[];
}

/** Summaries over already privacy-shaped rows. Individual = viewer's own rows only. */
export function summarize(rows: ViewTxn[], view: HubView, memberCount: number): HubSummary {
  const done = rows.filter((r) => r.status === "COMPLETED" && (view === "family" || r.isMine));
  const sum = (xs: ViewTxn[]) => xs.reduce((s, r) => s + r.amountPaise, 0);
  const group = (key: (r: ViewTxn) => string) => {
    const m = new Map<string, number>();
    for (const r of done) m.set(key(r), (m.get(key(r)) ?? 0) + r.amountPaise);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  const scale = view === "family" ? memberCount : 1;
  const budgetPaise = Object.values(config.budgets).reduce((a, b) => a + b, 0) * scale;
  const spentPaise = sum(done);
  const byCategory = group((r) => r.category).map(([category, paise]) => ({ category, paise }));
  const spentIn = new Map(byCategory.map((c) => [c.category, c.paise]));

  return {
    spentPaise,
    budgetPaise,
    budgetLeftPaise: budgetPaise - spentPaise,
    count: done.length,
    byCategory,
    byMember: view === "family" ? group((r) => r.ownerName).map(([name, paise]) => ({ name, paise })) : [],
    budgets: Object.entries(config.budgets).map(([category, base]) => {
      const limitPaise = base * scale;
      const spent = spentIn.get(category) ?? 0;
      return { category, spentPaise: spent, limitPaise, pct: Math.round((spent / limitPaise) * 100) };
    }),
  };
}
