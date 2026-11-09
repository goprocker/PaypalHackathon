import { ArrowUpRight, LayoutDashboard, PlayCircle, MessageCircle, ScanSearch, Users } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { TagChip } from "@/components/badges";
import { DemoLogin } from "@/components/demo-login";
import { config } from "@/lib/config";
import { familyMonth } from "@/lib/db/family";
import { budgets, monthSummary } from "@/lib/money";

type MemberId = DemoPayment["ownerId"];
import type { DemoPayment } from "@/lib/demo/data";
import { currentUserId } from "@/lib/session";
import { formatInr, formatUsd, trueCost } from "@/lib/truecost";
import { cn } from "@/lib/utils";

// Worked example shown on Home: the same calculation the checkout runs.
const EXAMPLE_CENTS = 12999;
const example = trueCost({ priceCents: EXAMPLE_CENTS, usdInr: config.fallbackUsdInr });

const AVATAR_TINTS = ["bg-accent-fill/20 text-accent ring-1 ring-accent/30", "bg-good/15 text-good ring-1 ring-good/30", "bg-warn/15 text-warn ring-1 ring-warn/30", "bg-private/15 text-private ring-1 ring-private/30"];

const ACTIONS = [
  { href: "/pay", label: "Check price", icon: ScanSearch },
  { href: "/hub", label: "Money hub", icon: LayoutDashboard },
  { href: "/chat", label: "Ask AI", icon: MessageCircle },
  { href: "/hub?view=family", label: "Family", icon: Users },
] as const;

export default async function Home() {
  await connection();
  const userId = await currentUserId();
  const data = userId ? await familyMonth(userId) : null;
  return data && userId ? <Dashboard data={data} userId={userId as MemberId} /> : <Welcome />;
}

function Dashboard({ data, userId }: { data: NonNullable<Awaited<ReturnType<typeof familyMonth>>>; userId: MemberId }) {
  // Hero reads the same demo payments as Money, Family and Track so the totals agree.
  const budgetPaise = budgets(userId).reduce((t, b) => t + b.limitPaise, 0);
  const spentPaise = monthSummary(userId).totalPaise;
  const s = { spentPaise, budgetPaise, budgetLeftPaise: budgetPaise - spentPaise };
  const month = new Date().toLocaleString("en-IN", { month: "long" });
  const over = s.budgetLeftPaise < 0;
  const usedPct = s.budgetPaise ? Math.round((s.spentPaise / s.budgetPaise) * 100) : 0;
  const recent = data.rows.filter((r) => r.isMine).slice(0, 5);
  const people = [...new Map(data.rows.map((r) => [r.ownerId, r.ownerName])).values()].slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white">
        <div aria-hidden className="absolute -right-10 -bottom-16 size-56 rounded-full bg-navy-2/60" />
        <div aria-hidden className="absolute -right-2 -bottom-24 size-56 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-sm text-white/75">You spent in {month}</p>
          <div className="amount mt-2 text-5xl">{formatInr(s.spentPaise)}</div>
          <p className="mt-3 text-sm text-white/80">
            {over ? `Over budget by ${formatInr(-s.budgetLeftPaise)}` : `${formatInr(s.budgetLeftPaise)} left of ${formatInr(s.budgetPaise)}`}
          </p>
          <div className="mt-3 h-1.5 w-full max-w-60 rounded-full bg-white/20" role="progressbar" aria-valuenow={usedPct} aria-valuemin={0} aria-valuemax={100} aria-label="Monthly budget used">
            <div className={cn("h-1.5 rounded-full", over ? "bg-bad" : "bg-white")} style={{ width: `${Math.min(100, usedPct)}%` }} />
          </div>
          <Link href="/pay" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-navy">
            Check a purchase <ArrowUpRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="family-h">
        <h2 id="family-h" className="mb-3 text-base font-semibold">Your family</h2>
        <ul className="no-scrollbar flex gap-4 overflow-x-auto">
          {people.map((name, i) => (
            <li key={name}>
              <Link href="/hub?view=family" className="flex min-h-11 w-16 flex-col items-center gap-1.5 text-xs text-muted">
                <span className={cn("grid size-14 place-items-center rounded-full text-base font-bold", AVATAR_TINTS[i % AVATAR_TINTS.length])}>{name[0]}</span>
                <span className="w-full truncate text-center">{name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Link href="/demo" className="glass flex items-center gap-3 rounded-2xl p-4">
        <PlayCircle aria-hidden className="size-6 text-accent" />
        <span className="flex-1"><span className="block font-semibold">Demo Mode</span><span className="block text-sm text-muted">Load a ready-made scenario in one tap</span></span>
        <ArrowUpRight aria-hidden className="size-4 text-muted" />
      </Link>
      <section aria-labelledby="quick-h">
        <h2 id="quick-h" className="mb-3 text-base font-semibold">Quick actions</h2>
        <ul className="grid grid-cols-4 gap-3">
          {ACTIONS.map(({ href, label, icon: Icon }) => (
            <li key={label}>
              <Link href={href} className="flex h-full min-h-24 flex-col items-center justify-center gap-2 glass rounded-2xl px-1 py-3 text-center text-xs font-medium">
                <Icon aria-hidden className="size-6 text-accent" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl glass p-5 ">
        <h2 className="text-base font-semibold">Latest payments</h2>
        {recent.length === 0 ? (
          <p className="py-4 text-sm text-muted">No payments yet this month.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border text-sm">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-bold text-accent">{r.item[0]}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{r.item}</div>
                  <div className="mt-0.5"><TagChip tag={r.tag} /></div>
                </div>
                <div className="tabular font-semibold">{formatInr(r.amountPaise)}</div>
              </li>
            ))}
          </ul>
        )}
        <Link href="/hub" className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-accent">See all in Money hub</Link>
      </section>
    </div>
  );
}

function Welcome() {
  const worst = example.rows.reduce((a, b) => (b.totalPaise > a.totalPaise ? b : a));
  const best = example.rows.find((r) => r.cheapest)!;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white">
        <div aria-hidden className="absolute -right-10 -bottom-16 size-56 rounded-full bg-navy-2/60" />
        <div className="relative">
          <h1 className="text-3xl font-extrabold leading-[1.1]">Know what it really costs before you pay.</h1>
          <p className="mt-3 text-sm text-white/80">
            A {formatUsd(EXAMPLE_CENTS)} price tag isn&apos;t {formatInr(EXAMPLE_CENTS * config.fallbackUsdInr)}. Card markup, GST and conversion fees add up. PayHub shows the real rupee total, then tracks it for the family.
          </p>
        </div>
      </section>

      <Link href="/demo" className="glass flex items-center gap-3 rounded-2xl p-4">
        <PlayCircle aria-hidden className="size-6 text-accent" />
        <span className="flex-1"><span className="block font-semibold">Demo Mode</span><span className="block text-sm text-muted">Load a ready-made scenario in one tap</span></span>
        <ArrowUpRight aria-hidden className="size-4 text-muted" />
      </Link>
      <figure className="rounded-2xl glass p-5 ">
        <figcaption className="flex items-baseline justify-between text-sm text-muted">
          <span>Wireless headphones, {formatUsd(EXAMPLE_CENTS)}</span>
          <span className="tabular">₹{config.fallbackUsdInr}/USD</span>
        </figcaption>
        <div className="mt-3 flex flex-wrap items-end gap-x-3">
          <span className="amount text-5xl">{formatInr(best.totalPaise)}</span>
          <span className="pb-1 text-sm text-muted">with {best.label}</span>
        </div>
        <ul className="mt-4 divide-y divide-border border-t border-border text-sm">
          {example.rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2.5">
              <span className={r.cheapest ? "font-semibold text-good" : ""}>{r.label}</span>
              <span className="tabular">{formatInr(r.totalPaise)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          The right method saves <strong className="tabular text-good">{formatInr(worst.totalPaise - best.totalPaise)}</strong> on this one item.
        </p>
      </figure>

      <DemoLogin />
    </div>
  );
}
