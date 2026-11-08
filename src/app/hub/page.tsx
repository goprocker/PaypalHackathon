import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { TagChip } from "@/components/badges";
import { CategoryDonut, MemberBars } from "@/components/charts";
import { familyMonth } from "@/lib/db/family";
import { summarize, type HubView } from "@/lib/hub";
import { currentUserId } from "@/lib/session";
import { formatInr } from "@/lib/truecost";

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Money Hub</h1>
          <p className="text-sm text-muted">{month} so far</p>
        </div>
        <div role="tablist" aria-label="View" className="flex rounded-full bg-surface-2 p-1 text-sm">
          {(["individual", "family"] as const).map((v) => (
            <Link
              key={v}
              role="tab"
              aria-selected={view === v}
              href={`/hub?view=${v}`}
              className={`min-h-9 rounded-full px-4 py-2 capitalize ${view === v ? "bg-surface font-semibold shadow-sm" : "text-muted"}`}
            >
              {v}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card label="Spent this month" value={formatInr(s.spentPaise)} sub={`${s.count} payments`} />
        <Card
          label="Budget left"
          value={formatInr(Math.max(0, s.budgetLeftPaise))}
          sub={s.budgetLeftPaise < 0 ? `Over by ${formatInr(-s.budgetLeftPaise)}` : `of ${formatInr(s.budgetPaise)}`}
          tone={s.budgetLeftPaise < 0 ? "bad" : undefined}
        />
        <Card label="Top category" value={s.byCategory[0]?.category ?? "—"} sub={s.byCategory[0] ? formatInr(s.byCategory[0].paise) : "No spending yet"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 font-semibold">Where it went</h2>
          {s.byCategory.length ? <CategoryDonut data={s.byCategory} /> : <Empty />}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-semibold">Budgets</h2>
          <ul className="space-y-3">
            {s.budgets.map((b) => <BudgetBar key={b.category} {...b} />)}
          </ul>
        </section>

        {view === "family" && (
          <section className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="mb-2 font-semibold">By member</h2>
            <MemberBars data={s.byMember} />
          </section>
        )}

        <section className={`rounded-2xl border border-border bg-surface p-4 ${view === "family" ? "" : "md:col-span-2"}`}>
          <h2 className="mb-2 font-semibold">Recent</h2>
          {list.length === 0 ? <Empty /> : (
            <ul className="divide-y divide-border text-sm">
              {list.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{r.item}</div>
                    <div className="text-xs text-muted">
                      {view === "family" && `${r.ownerName} · `}{r.merchant ?? "Hidden"} · {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <TagChip tag={r.tag} />
                  <div className="tabular w-24 text-right">{formatInr(r.amountPaise)}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Card({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "bad" }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className={`tabular mt-1 text-2xl font-semibold ${tone === "bad" ? "text-bad" : ""}`}>{value}</div>
      <div className={`text-xs ${tone === "bad" ? "text-bad" : "text-muted"}`}>{sub}</div>
    </div>
  );
}

function BudgetBar({ category, spentPaise, limitPaise, pct }: { category: string; spentPaise: number; limitPaise: number; pct: number }) {
  const color = pct >= 100 ? "bg-bad" : pct >= 80 ? "bg-warn" : "bg-good";
  const note = pct >= 100 ? "Over budget" : pct >= 80 ? "Near limit" : "";
  return (
    <li>
      <div className="flex justify-between text-sm">
        <span>{category} {note && <span className={pct >= 100 ? "text-bad" : "text-warn"}>· {note}</span>}</span>
        <span className="tabular text-muted">{formatInr(spentPaise)} / {formatInr(limitPaise)}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${category} budget used`}>
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </li>
  );
}

function Empty() {
  return (
    <p className="py-6 text-center text-sm text-muted">
      Nothing yet this month. <Link href="/pay" className="text-primary underline">Make a payment</Link>
    </p>
  );
}
