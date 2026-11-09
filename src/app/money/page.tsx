import { CopyCheck, Repeat } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { CategoryDonut } from "@/components/charts";
import { BudgetEditor, Goals } from "@/components/money/tools";
import { StatusLabel, type Status } from "@/components/status-label";
import { getInrRates } from "@/lib/fx";
import type { Key } from "@/lib/i18n/dict";
import { getT } from "@/lib/i18n/server";
import { budgets, DEMO_GOALS, duplicateGroups, LRS_LIMIT_USD, lrs, monthSummary, netWorth, subscriptions } from "@/lib/money";
import { viewer } from "@/lib/money-server";
import { METHOD_LABEL } from "@/lib/track";
import { formatInr } from "@/lib/truecost";
import { cn } from "@/lib/utils";

const TOOLS = [
  { id: "summary", status: "demo" },
  { id: "subs", status: "demo" },
  { id: "dups", status: "demo" },
  { id: "budgets", status: "demo" },
  { id: "goals", status: "demo" },
  { id: "worth", status: "prototype" },
  { id: "lrs", status: "demo" },
] as const satisfies readonly { id: string; status: Status }[];
type Tool = (typeof TOOLS)[number]["id"];

const STATUS_KEY: Record<Status, Key> = { live: "status.live", demo: "status.demo", prototype: "status.prototype", soon: "status.soon" };
const panel = "glass rounded-2xl p-5";
const usd = (n: number) => `USD ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export default async function MoneyPage({ searchParams }: { searchParams: Promise<{ tool?: string; focus?: string }> }) {
  await connection(); // per-member data and live FX
  const [{ t }, me, q] = await Promise.all([getT(), viewer(), searchParams]);
  const tool: Tool = TOOLS.find((x) => x.id === q.tool)?.id ?? (q.focus === "duplicates" ? "dups" : "summary");
  const active = TOOLS.find((x) => x.id === tool)!;
  const fx = tool === "lrs" ? await getInrRates() : null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold">{t("money.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("money.desc")} · {me.name}</p>
      </header>

      <nav aria-label={t("money.title")} className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-2">
          {TOOLS.map((x) => (
            <li key={x.id}>
              <Link
                href={`/money?tool=${x.id}`}
                aria-current={x.id === tool ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
                  x.id === tool ? "border-accent/50 bg-accent-fill/20 font-semibold text-text" : "glass text-muted hover:text-text",
                )}
              >
                {t(`money.${x.id}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{t(`money.${tool}`)}</h2>
        <StatusLabel status={active.status} label={t(STATUS_KEY[active.status])} />
      </div>
      <p className="-mt-3 text-sm text-muted">{t(`money.${tool}.desc`)} {t("sim.bank")}.</p>

      {tool === "summary" && <Summary id={me.id} />}
      {tool === "subs" && <Subs id={me.id} />}
      {tool === "dups" && <Dups id={me.id} />}
      {tool === "budgets" && <BudgetEditor owner={me.id} rows={budgets(me.id)} />}
      {tool === "goals" && <Goals owner={me.id} initial={DEMO_GOALS[me.id]} />}
      {tool === "worth" && <Worth id={me.id} />}
      {tool === "lrs" && fx && <Lrs id={me.id} rates={fx.rates} live={fx.source === "live"} />}
    </div>
  );
}

type Id = Awaited<ReturnType<typeof viewer>>["id"];

function Summary({ id }: { id: Id }) {
  const s = monthSummary(id);
  if (!s.count) return <p className={cn(panel, "text-sm text-muted")}>No payments this month yet.</p>;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className={cn(panel, "space-y-4")}>
        <div>
          <p className="text-sm text-muted">Spent in the last 30 days</p>
          <p className="amount text-4xl">{formatInr(s.totalPaise)}</p>
          <p className="text-xs text-muted">{s.count} payments{s.failed ? ` · ${s.failed} failed or pending not counted` : ""}</p>
        </div>
        <CategoryDonut data={s.categories} />
      </section>
      <section className={cn(panel, "space-y-3")}>
        <h3 className="font-semibold">Biggest payments</h3>
        <ul className="divide-y divide-border text-sm">
          {s.biggest.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.merchant}</span><span className="block truncate text-xs text-muted">{p.item}</span></span>
              <span className="tabular">{formatInr(p.amountPaise)}</span>
            </li>
          ))}
        </ul>
        <Link href="/money?tool=budgets" className="inline-flex min-h-11 items-center text-sm font-medium text-accent hover:underline">Check budgets</Link>
      </section>
    </div>
  );
}

function Subs({ id }: { id: Id }) {
  const subs = subscriptions(id);
  if (!subs.length) return <p className={cn(panel, "text-sm text-muted")}>No recurring charges found.</p>;
  const monthly = subs.reduce((s, x) => s + x.monthlyPaise, 0);
  return (
    <section className={cn(panel, "space-y-4")}>
      <p><span className="amount text-3xl">{formatInr(monthly)}</span> <span className="text-sm text-muted">a month · {formatInr(monthly * 12)} a year</span></p>
      <ul className="divide-y divide-border text-sm">
        {subs.map((x) => (
          <li key={x.merchant} className="flex items-center gap-3 py-3">
            <Repeat aria-hidden className="size-4 shrink-0 text-accent" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{x.merchant}</span>
              <span className="block text-xs text-muted">{x.item} · {METHOD_LABEL[x.method]} · renews in about {x.nextInDays} days</span>
              {x.sharedWith.length > 0 && <span className="block text-xs text-warn">{x.sharedWith.join(", ")} also pays for this. A family plan may cost less.</span>}
            </span>
            <span className="tabular text-right">{formatInr(x.monthlyPaise)}<span className="block text-xs text-muted">{formatInr(x.yearlyPaise)}/yr</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Dups({ id }: { id: Id }) {
  const groups = duplicateGroups(id);
  if (!groups.length) return <p className={cn(panel, "text-sm text-muted")}>No double charges found this month.</p>;
  return (
    <ul className="space-y-3">
      {groups.map((g) => (
        <li key={g.kept.id} role="alert" className="glass space-y-3 rounded-2xl border-warn/50 p-5">
          <p className="flex items-center gap-2 font-semibold text-warn"><CopyCheck aria-hidden className="size-5" />Charged {g.extra.length + 1} times: {g.kept.merchant}</p>
          <p className="text-sm">Same payee <span className="break-all">({g.kept.payee})</span>, same amount, same day. You can ask for <span className="font-semibold">{formatInr(g.extraPaise)}</span> back.</p>
          <ul className="text-sm text-muted">
            {[g.kept, ...g.extra].map((p, i) => <li key={p.id} className="tabular">{i ? "Extra" : "Kept"} · {formatInr(p.amountPaise)} · txn {p.txnId}{p.note ? ` · ${p.note}` : ""}</li>)}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Link href={`/track?tool=dispute&txn=${g.extra[0].id}`} className="inline-flex h-11 items-center rounded-full bg-accent-fill px-5 text-sm font-semibold text-on-accent">Build dispute</Link>
            <Link href={`/track?txn=${g.extra[0].id}`} className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-semibold hover:bg-surface-2">Open in tracker</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Worth({ id }: { id: Id }) {
  const w = netWorth(id);
  return (
    <section className={cn(panel, "space-y-4")}>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div><p className="text-muted">Have</p><p className="tabular font-semibold text-good">{formatInr(w.assetsPaise)}</p></div>
        <div><p className="text-muted">Owe</p><p className="tabular font-semibold text-bad">{formatInr(w.debtsPaise)}</p></div>
        <div><p className="text-muted">Net worth</p><p className="tabular font-semibold">{formatInr(w.netPaise)}</p></div>
      </div>
      <ul className="divide-y divide-border text-sm">
        {w.accounts.map((a) => (
          <li key={a.name} className="flex items-center justify-between gap-3 py-2">
            <span>{a.name} <span className="text-xs text-muted">· {a.kind}</span></span>
            <span className={cn("tabular", a.balancePaise < 0 && "text-bad")}>{formatInr(a.balancePaise)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">Sample balances. Linking real accounts (Account Aggregator) is not built.</p>
    </section>
  );
}

function Lrs({ id, rates, live }: { id: Id; rates: Parameters<typeof lrs>[1]; live: boolean }) {
  const l = lrs(id, rates);
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className={cn(panel, "space-y-3")}>
        <p className="text-sm text-muted">Used this financial year (Apr–Mar)</p>
        <p className="amount text-3xl">{usd(l.usedUsd)}</p>
        <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={l.pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-accent-fill" style={{ width: `${Math.max(Math.min(l.pct, 100), 1)}%` }} />
        </div>
        <p className="text-sm">{l.pct}% of {usd(LRS_LIMIT_USD)} · {usd(l.leftUsd)} left</p>
        <p className="text-sm">{l.tcsLeftPaise > 0 ? <>You can spend about <span className="font-semibold">{formatInr(l.tcsLeftPaise)}</span> more abroad before 20% TCS applies.</> : <span className="text-warn">You are past the TCS threshold. Banks collect 20% TCS on further spend (claimable in your tax return).</span>}</p>
        <p className="text-xs text-muted">Typical rules: USD 2.5 lakh LRS limit, TCS above ₹10 lakh a year. Your bank may differ. Rates {live ? "live" : "from fallback table"}.</p>
      </section>
      <section className={cn(panel, "space-y-2")}>
        <h3 className="font-semibold">Foreign payments</h3>
        <ul className="divide-y divide-border text-sm">
          {l.earlierUsd > 0 && <li className="flex justify-between py-2"><span className="text-muted">Earlier this year</span><span className="tabular">{usd(l.earlierUsd)}</span></li>}
          {l.items.map(({ p, usd: u }) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.merchant}</span><span className="block truncate text-xs text-muted">{p.item} · {METHOD_LABEL[p.method]}</span></span>
              <span className="tabular">{usd(u)}</span>
            </li>
          ))}
          {!l.items.length && !l.earlierUsd && <li className="py-2 text-muted">No foreign payments this year.</li>}
        </ul>
      </section>
    </div>
  );
}
