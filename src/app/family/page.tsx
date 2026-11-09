import { EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { CategoryDonut, MemberBars } from "@/components/charts";
import { PrivacySetting } from "@/components/money/tools";
import { StatusLabel, type Status } from "@/components/status-label";
import type { Key } from "@/lib/i18n/dict";
import { getT } from "@/lib/i18n/server";
import { familyView, privateItems, type MemberView, type Share } from "@/lib/money";
import { getPrivacy, viewer } from "@/lib/money-server";
import { formatInr } from "@/lib/truecost";
import { cn } from "@/lib/utils";

const TOOLS = [
  { id: "individual", status: "demo" },
  { id: "family", status: "demo" },
  { id: "private", status: "demo" },
  { id: "privacy", status: "demo" },
] as const satisfies readonly { id: string; status: Status }[];
type Tool = (typeof TOOLS)[number]["id"];

const STATUS_KEY: Record<Status, Key> = { live: "status.live", demo: "status.demo", prototype: "status.prototype", soon: "status.soon" };
const SHARE_BADGE: Record<Share, string> = { items: "Shares items", categories: "Shares category totals", total: "Shares total only" };
const panel = "glass rounded-2xl p-5";

export default async function FamilyPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await connection(); // depends on session and privacy cookies
  const [{ t }, me, privacy, q] = await Promise.all([getT(), viewer(), getPrivacy(), searchParams]);
  const tool: Tool = TOOLS.find((x) => x.id === q.view)?.id ?? "family";
  const active = TOOLS.find((x) => x.id === tool)!;
  const members = familyView(me.id, privacy);
  const self = members.find((m) => m.self)!;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold">{t("family.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("family.desc")} · {t("family.as")} {me.name} (<Link href="/switch" className="text-accent hover:underline">{t("family.switch")}</Link>)</p>
      </header>

      <nav aria-label={t("family.title")} className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-2">
          {TOOLS.map((x) => (
            <li key={x.id}>
              <Link
                href={`/family?view=${x.id}`}
                aria-current={x.id === tool ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
                  x.id === tool ? "border-accent/50 bg-accent-fill/20 font-semibold text-text" : "glass text-muted hover:text-text",
                )}
              >
                {t(`family.${x.id}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{t(`family.${tool}`)}</h2>
        <StatusLabel status={active.status} label={t(STATUS_KEY[active.status])} />
      </div>
      <p className="-mt-3 text-sm text-muted">{t(`family.${tool}.desc`)}</p>

      {tool === "individual" && <Member m={self} />}
      {tool === "family" && (
        <div className="space-y-5">
          <section className={panel} aria-label="Spending by member">
            <p className="text-sm text-muted">Household, last 30 days</p>
            <p className="amount text-3xl">{formatInr(members.reduce((s, m) => s + m.totalPaise, 0))}</p>
            <MemberBars data={members.map((m) => ({ name: m.self ? `${m.name} (you)` : m.name, paise: m.totalPaise }))} />
          </section>
          <div className="grid gap-5 md:grid-cols-3">
            {members.map((m) => <Member key={m.id} m={m} compact />)}
          </div>
        </div>
      )}
      {tool === "private" && <Private id={me.id} name={me.name} />}
      {tool === "privacy" && (
        <div className="grid gap-5 md:grid-cols-2">
          <PrivacySetting current={self.share} name={me.name} />
          <section className={cn(panel, "space-y-2")}>
            <h3 className="font-semibold">Everyone&apos;s setting</h3>
            <ul className="divide-y divide-border text-sm">
              {members.map((m) => (
                <li key={m.id} className="flex justify-between gap-3 py-2"><span>{m.name} <span className="text-muted">· {m.relation}</span></span><span className="text-muted">{SHARE_BADGE[m.share]}</span></li>
              ))}
            </ul>
            <p className="text-xs text-muted">Each member changes only their own setting. Switch member to try another view.</p>
          </section>
        </div>
      )}
    </div>
  );
}

function Member({ m, compact }: { m: MemberView; compact?: boolean }) {
  return (
    <section className={cn(panel, "space-y-3")} aria-label={m.name}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{m.name} <span className="text-sm font-normal text-muted">· {m.self ? "You" : m.relation}</span></h3>
        {!m.self && <span className="text-xs text-muted">{SHARE_BADGE[m.share]}</span>}
      </div>
      <p className="amount text-2xl">{formatInr(m.totalPaise)}</p>
      {!m.self && m.privateCount > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted"><EyeOff aria-hidden className="size-3.5" />{m.privateCount} private item{m.privateCount === 1 ? "" : "s"} hidden ({formatInr(m.privatePaise)})</p>
      )}
      {m.categories ? (
        compact ? (
          <ul className="space-y-1 text-sm">
            {m.categories.slice(0, 5).map((c) => <li key={c.category} className="flex justify-between"><span className={cn(c.category === "Private" && "text-muted")}>{c.category}</span><span className="tabular">{formatInr(c.paise)}</span></li>)}
          </ul>
        ) : <CategoryDonut data={m.categories} />
      ) : (
        <p className="text-sm text-muted">{m.name} shares only the monthly total.</p>
      )}
      {m.items && !compact && (
        <ul className="divide-y divide-border text-sm">
          {m.items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              {p.private && <Lock aria-label="Private" className="size-3.5 shrink-0 text-muted" />}
              <span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.merchant}</span><span className="block truncate text-xs text-muted">{p.item} · {p.category}</span></span>
              <span className="tabular">{formatInr(p.amountPaise)}</span>
            </li>
          ))}
        </ul>
      )}
      {m.items && compact && <p className="text-xs text-muted">{m.items.length} items visible</p>}
    </section>
  );
}

function Private({ id, name }: { id: MemberView["id"]; name: string }) {
  const items = privateItems(id);
  if (!items.length) return <p className={cn(panel, "text-sm text-muted")}>{name} has no private payments.</p>;
  return (
    <section className={cn(panel, "space-y-3")}>
      <p className="flex items-center gap-2 text-sm"><Lock aria-hidden className="size-4 text-accent" />Only you can see these. Family sees one &quot;Private&quot; total.</p>
      <ul className="divide-y divide-border text-sm">
        {items.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2">
            <span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.merchant}</span><span className="block truncate text-xs text-muted">{p.item} · {p.category}{p.status !== "success" ? ` · ${p.status}` : ""}</span></span>
            <span className="tabular">{formatInr(p.amountPaise)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
