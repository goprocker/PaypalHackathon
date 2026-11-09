import { ArrowUpRight, List, PieChart, Target, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { TagChip } from "@/components/badges";
import { CategoryDonut, MemberBars } from "@/components/charts";
import { Section } from "@/components/ui/card";
import { familyMonth } from "@/lib/db/family";
import { summarize, type HubView } from "@/lib/hub";
import { currentUserId } from "@/lib/session";
import { formatInr } from "@/lib/truecost";
import { cn } from "@/lib/utils";

export default async function HubPage({ searchParams }: PageProps<"/hub">) {
  await connection(); // per-request: month boundaries use the current date
  const userId = await currentUserId();
  if (!userId) redirect("/");
  const data = await familyMonth(userId);
  if (!data) redirect("/");

  const view: HubView = (await searchParams).view === "family" ? "family" : "individual";
  const s = summarize(data.rows, view, data.memberCount);
  const list = data.rows.filter((r) => view === "family" || r.isMine).slice(0, 15);
  const month = new Date().toLocaleString("en-IN", { month: "long" });
  const over = s.budgetLeftPaise < 0;
  const usedPct = s.budgetPaise ? Math.round((s.spentPaise / s.budgetPaise) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-muted">{view === "family" ? "Family" : "You"} spent in {month}</p>
          <div className="amount mt-2 text-5xl">{formatInr(s.spentPaise)}</div>
          <p className={cn("mt-3 text-sm", over ? "text-bad" : "text-muted")}>
            {over
              ? `Over budget by ${formatInr(-s.budgetLeftPaise)}`
              : `${formatInr(s.budgetLeftPaise)} left of ${formatInr(s.budgetPaise)} across ${s.count} payments`}
          </p>
          <div className="mt-3 h-1.5 w-72 max-w-full rounded-full bg-surface-2" role="progressbar" aria-valuenow={usedPct} aria-valuemin={0} aria-valuemax={100} aria-label="Monthly budget used">
            <div className={cn("h-1.5 rounded-full", over ? "bg-bad" : usedPct >= 80 ? "bg-warn" : "bg-accent-fill")} style={{ width: `${Math.min(100, usedPct)}%` }} />
          </div>
        </div>
        <div role="tablist" aria-label="View" className="flex self-start rounded-full glass p-1 text-sm">
          {(["individual", "family"] as const).map((v) => (
            <Link
              key={v}
              role="tab"
              aria-selected={view === v}
              href={`/hub?view=${v}`}
              className={cn("flex h-11 items-center rounded-full px-4 font-semibold", view === v ? "bg-accent-fill text-on-accent" : "text-muted hover:text-text")}
            >
              {v === "individual" ? "Just me" : "Whole family"}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <Section title="Where it went" icon={PieChart}>
          {s.byCategory.length ? <CategoryDonut data={s.byCategory} /> : <Empty />}
        </Section>

        <Section title="Budgets by category" icon={Target}>
          <ul className="space-y-4">
            {s.budgets.map((b) => <BudgetBar key={b.category} {...b} />)}
          </ul>
        </Section>

        {view === "family" && (
          <Section title="By member" icon={Users}>
            <MemberBars data={s.byMember} />
          </Section>
        )}

        <Section title="Recent payments" icon={List} >
          {list.length === 0 ? <Empty /> : (
            <ul className="divide-y divide-border text-sm">
              {list.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{r.item}</div>
                    <div className="text-xs text-muted">
                      {view === "family" && `${r.ownerName}, `}{r.merchant ?? "Hidden"}, {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <TagChip tag={r.tag} />
                  <div className="tabular w-24 text-right font-semibold">{formatInr(r.amountPaise)}</div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function BudgetBar({ category, spentPaise, limitPaise, pct }: { category: string; spentPaise: number; limitPaise: number; pct: number }) {
  const color = pct >= 100 ? "bg-bad" : pct >= 80 ? "bg-warn" : "bg-accent-fill";
  const note = pct >= 100 ? "Over budget" : pct >= 80 ? "Near limit" : "";
  return (
    <li>
      <div className="flex justify-between gap-3 text-sm">
        <span className="font-medium">
          {category} {note && <span className={cn("ml-1 text-xs font-normal", pct >= 100 ? "text-bad" : "text-warn")}>{note}</span>}
        </span>
        <span className="tabular text-muted">{formatInr(spentPaise)} of {formatInr(limitPaise)}</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${category} budget used`}>
        <div className={cn("h-1.5 rounded-full", color)} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </li>
  );
}

function Empty() {
  return (
    <p className="py-6 text-sm text-muted">
      No payments yet this month.{" "}
      <Link href="/pay" className="inline-flex items-center gap-0.5 font-medium text-accent underline-offset-4 hover:underline">
        Check a purchase <ArrowUpRight aria-hidden className="size-3.5" />
      </Link>
    </p>
  );
}
