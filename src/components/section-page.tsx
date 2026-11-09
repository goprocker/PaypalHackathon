import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { StatusLabel, type Status } from "@/components/status-label";
import type { Key } from "@/lib/i18n/dict";
import { getT } from "@/lib/i18n/server";

export type Feature = { title: string; desc: string; status: Status; href?: string };

const STATUS_KEY: Record<Status, Key> = { live: "status.live", demo: "status.demo", prototype: "status.prototype", soon: "status.soon" };

/** Section landing: translated header plus a card per feature with its status label. */
export async function SectionPage({ section, features }: { section: "pay" | "protect" | "track" | "money" | "family" | "ai"; features: Feature[] }) {
  const { t } = await getT();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold">{t(`${section}.title`)}</h1>
        <p className="mt-1 text-sm text-muted">{t(`${section}.desc`)}</p>
      </header>
      <ul className="grid gap-3 md:grid-cols-2">
        {features.map((f) => {
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{f.title}</h2>
                <StatusLabel status={f.status} label={t(STATUS_KEY[f.status])} />
              </div>
              <p className="mt-1 text-sm text-muted">{f.desc}</p>
              {f.href && <ArrowUpRight aria-hidden className="mt-2 size-4 text-accent" />}
            </>
          );
          return (
            <li key={f.title}>
              {f.href ? (
                <Link href={f.href} className="glass block rounded-2xl p-4 transition-colors hover:border-accent/50">{body}</Link>
              ) : (
                <div className="glass rounded-2xl p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
