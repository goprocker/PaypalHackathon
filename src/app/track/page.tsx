import { Ban, CircleCheck, CircleDashed, FileWarning } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { StatusLabel, type Status } from "@/components/status-label";
import { DisputeBuilder, ProofVault, type DisputeCase, type Receipt } from "@/components/track/tools";
import { DEMO_MEMBERS, type DemoPayment } from "@/lib/demo/data";
import type { Key } from "@/lib/i18n/dict";
import { getT } from "@/lib/i18n/server";
import { currentUserId } from "@/lib/session";
import { buildDispute, clock, METHOD_LABEL, timeline, trackList, type Issue } from "@/lib/track";
import { formatInr } from "@/lib/truecost";
import { cn } from "@/lib/utils";

const TOOLS = [
  { id: "tracker", status: "demo" },
  { id: "vault", status: "live" },
  { id: "dispute", status: "live" },
] as const satisfies readonly { id: string; status: Status }[];
type Tool = (typeof TOOLS)[number]["id"];

const STATUS_KEY: Record<Status, Key> = { live: "status.live", demo: "status.demo", prototype: "status.prototype", soon: "status.soon" };
const DAY = 24 * 60 * 60 * 1000;

const ISSUE: Record<Issue, string> = {
  failed_debit: "Failed but debited",
  duplicate: "Charged twice",
  refund_overdue: "Refund overdue",
  refund_pending: "Refund on the way",
};
const STATUS_TEXT: Record<DemoPayment["status"], string> = {
  success: "Successful", failed: "Failed", pending: "Pending", refund_pending: "Refund pending", refunded: "Refunded",
};

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ tool?: string; txn?: string }> }) {
  await connection(); // dates are relative to today
  const [{ t }, userId, q] = await Promise.all([getT(), currentUserId(), searchParams]);
  const owner = (DEMO_MEMBERS.find((m) => m.id === userId) ?? DEMO_MEMBERS[0]);
  const now = clock();
  const list = trackList(owner.id, now);
  const tool: Tool = TOOLS.find((x) => x.id === q.tool)?.id ?? "tracker";
  const active = TOOLS.find((x) => x.id === tool)!;
  const date = (p: DemoPayment) => new Date(now - p.daysAgo * DAY).toISOString().slice(0, 10);

  const receipts: Receipt[] = list.map(({ p }) => ({
    id: p.id, txnId: p.txnId, merchant: p.merchant, item: p.item, amount: formatInr(p.amountPaise),
    method: METHOD_LABEL[p.method], date: date(p), status: STATUS_TEXT[p.status],
  }));
  const cases: DisputeCase[] = list.flatMap(({ p, issue }, i) => {
    if (!issue || issue === "refund_pending") return [];
    const d = buildDispute(p, issue);
    return [{ ...receipts[i], issue: ISSUE[issue], ...d }];
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold">{t("track.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("track.desc")}</p>
      </header>

      <nav aria-label={t("track.title")} className="-mx-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-2">
          {TOOLS.map((x) => (
            <li key={x.id}>
              <Link
                href={`/track?tool=${x.id}${q.txn ? `&txn=${encodeURIComponent(q.txn)}` : ""}`}
                aria-current={x.id === tool ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
                  x.id === tool ? "border-accent bg-accent text-on-accent" : "glass hover:border-accent/50",
                )}
              >
                {t(`track.${x.id}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{t(`track.${tool}`)}</h2>
        <StatusLabel status={active.status} label={t(STATUS_KEY[active.status])} />
      </div>
      <p className="-mt-3 text-sm text-muted">{t(`track.${tool}.desc`)} {t("sim.bank")}.</p>

      {tool === "tracker" && <Tracker list={list} selected={q.txn} now={now} date={date} />}
      {tool === "vault" && <ProofVault receipts={receipts} initial={q.txn} />}
      {tool === "dispute" && <DisputeBuilder cases={cases} initial={q.txn} name={owner.name} />}
    </div>
  );
}

function Tracker({ list, selected, now, date }: { list: ReturnType<typeof trackList>; selected?: string; now: number; date: (p: DemoPayment) => string }) {
  const cur = list.find((x) => x.p.id === selected) ?? list[0];
  if (!cur) return <p className="glass rounded-2xl p-5 text-sm text-muted">No payments yet.</p>;
  const { p, t, issue } = cur;
  const steps = timeline(p, now);
  const attention = list.filter((x) => x.issue || x.t.dontPayAgain);

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section aria-label="Payments" className="glass max-h-[32rem] overflow-y-auto rounded-2xl md:order-none">
        <p className="px-4 pt-3 text-xs text-muted">{attention.length} need attention</p>
        <ul className="divide-y divide-border">
          {list.map((x) => (
            <li key={x.p.id}>
              <Link
                href={`/track?txn=${x.p.id}`}
                aria-current={x.p.id === p.id ? "true" : undefined}
                className={cn("flex min-h-14 items-center gap-3 px-4 py-2 text-sm hover:bg-surface-2/60", x.p.id === p.id && "bg-accent/10")}
              >
                <span className={cn("size-2 shrink-0 rounded-full", x.issue || x.t.dontPayAgain ? "bg-warn" : x.p.status === "success" || x.p.status === "refunded" ? "bg-good" : "bg-bad")} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{x.p.merchant}</span>
                  <span className="block truncate text-xs text-muted">{x.issue ? ISSUE[x.issue] : STATUS_TEXT[x.p.status]} · {date(x.p)}</span>
                </span>
                <span className="tabular">{formatInr(x.p.amountPaise)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="txn-title" className="glass space-y-4 rounded-2xl p-5">
        {t.dontPayAgain && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-bad/50 bg-bad/10 p-3 text-bad">
            <Ban aria-hidden className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-bold">Don&apos;t pay again</p>
              <p className="text-sm text-text">
                {p.status === "pending" ? "This payment is still being confirmed. Paying again could charge you twice." : `Your ${formatInr(p.refund?.amountPaise ?? p.amountPaise)} is on its way back${t.refundEta ? ` by ${t.refundEta}` : ""}. Paying again would charge you twice.`}
              </p>
            </div>
          </div>
        )}
        {issue === "duplicate" && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-warn/50 bg-warn/10 p-3 text-warn">
            <FileWarning aria-hidden className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm text-text"><span className="font-bold text-warn">Charged twice. </span>Same payee and amount on the same day. Ask for this one back.</p>
          </div>
        )}
        <div>
          <h3 id="txn-title" className="text-xl font-bold">{p.merchant} <span className="text-base font-normal text-muted">· {p.item}</span></h3>
          <p className="amount mt-2 text-4xl">{formatInr(p.amountPaise)}</p>
          <p className="text-sm text-muted">{p.status === "failed" && p.refund ? "Debited from your bank" : "Amount"}</p>
        </div>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">Status</dt><dd className="font-medium">{STATUS_TEXT[p.status]}</dd>
          <dt className="text-muted">Transaction ID</dt><dd className="tabular break-all">{p.txnId}</dd>
          <dt className="text-muted">Paid to</dt><dd className="break-all">{p.payee}</dd>
          <dt className="text-muted">Method</dt><dd>{METHOD_LABEL[p.method]}</dd>
          <dt className="text-muted">Date</dt><dd>{date(p)}</dd>
          {t.refundEta && <><dt className="text-muted">Refund expected</dt><dd className="font-semibold text-accent">{t.refundEta}</dd></>}
        </dl>
        <ol aria-label="Progress" className="space-y-3">
          {steps.map((s) => (
            <li key={s.label} className="flex items-start gap-3 text-sm">
              {s.done ? <CircleCheck aria-hidden className="size-5 shrink-0 text-good" /> : <CircleDashed aria-hidden className="size-5 shrink-0 text-muted" />}
              <span className={cn("flex-1", !s.done && "text-muted")}>{s.label}</span>
              {s.date && <span className="tabular text-xs text-muted">{s.done ? s.date : `est. ${s.date}`}</span>}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          {issue && issue !== "refund_pending" && (
            <Link href={`/track?tool=dispute&txn=${p.id}`} className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent">Build dispute</Link>
          )}
          <Link href={`/track?tool=vault&txn=${p.id}`} className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-semibold hover:bg-surface-2">Add proof</Link>
        </div>
      </section>
    </div>
  );
}
