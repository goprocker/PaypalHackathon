import { ArrowRight, Ban, Bot, CircleCheck, Play, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { StatusLabel } from "@/components/status-label";
import { AGENT_INFO, AGENTS, type EventKind } from "@/lib/agents/log";
import { isWorkflow, runWorkflow, WORKFLOWS, type WorkflowId } from "@/lib/agents/workflows";
import { activeScenario } from "@/lib/demo/server";
import { getUsdInr } from "@/lib/fx";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

const KIND = {
  start: ["text-muted", Play],
  result: ["text-good", CircleCheck],
  handoff: ["text-accent", ArrowRight],
  warn: ["text-warn", TriangleAlert],
  block: ["text-bad", Ban],
} satisfies Record<EventKind, readonly [string, unknown]>;

export default async function CommandCentrePage({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  await connection(); // refund dates and FX rate are per request
  const [{ t }, scenario, fx, { run }] = await Promise.all([getT(), activeScenario(), getUsdInr(), searchParams]);
  const id: WorkflowId = isWorkflow(run) ? run : isWorkflow(scenario?.id) ? scenario.id : "scam_qr";
  const { log, answer } = runWorkflow(id, { usdInr: fx.usdInr });
  const used = new Set(log.used);

  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold">{t("cc.title")}</h1>
          <StatusLabel status="demo" label={t("status.demo")} />
        </div>
        <p className="mt-1 text-sm text-muted">{t("cc.desc")} {t("sim.bank")}.</p>
      </header>

      <nav aria-label="Situations" className="flex flex-wrap gap-2">
        {WORKFLOWS.map((w) => (
          <Link
            key={w.id}
            href={`/ai/command?run=${w.id}`}
            aria-current={w.id === id ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
              w.id === id ? "border-accent bg-accent text-on-accent" : "glass hover:border-accent/50",
            )}
          >
            {w.title}
          </Link>
        ))}
      </nav>

      <section aria-labelledby="cc-answer" className="glass rounded-2xl border-accent/40 p-4">
        <h2 id="cc-answer" className="flex items-center gap-2 text-sm font-semibold text-accent">
          <Bot aria-hidden className="size-4" /> {t("cc.answer")}
        </h2>
        <p className="mt-2 leading-relaxed">{answer}</p>
      </section>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section aria-labelledby="cc-agents">
          <h2 id="cc-agents" className="mb-2 text-sm font-semibold text-muted">{t("cc.agents")}</h2>
          <ul className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {AGENTS.map((a) => (
              <li key={a} className={cn("glass rounded-xl p-3", !used.has(a) && "opacity-50")}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{AGENT_INFO[a].name}</span>
                  <span className={cn("text-[11px]", used.has(a) ? "text-good" : "text-muted")}>{used.has(a) ? t("cc.ran") : t("cc.idle")}</span>
                </div>
                <p className="mt-1 hidden text-xs text-muted md:block">{AGENT_INFO[a].job}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="cc-feed">
          <h2 id="cc-feed" className="mb-2 text-sm font-semibold text-muted">{t("cc.feed")}</h2>
          <ol className="glass divide-y divide-border rounded-2xl">
            {log.events.map((e) => {
              const [cls, Icon] = KIND[e.kind];
              return (
                <li key={e.seq} className="flex gap-3 p-3 text-sm">
                  <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", cls)} />
                  <div className="min-w-0">
                    <p className="text-xs text-muted">
                      <span className="font-semibold text-text">{AGENT_INFO[e.agent].name}</span>
                      {e.to && <> → <span className="font-semibold text-accent">{AGENT_INFO[e.to].name}</span></>}
                    </p>
                    <p className="break-words">{e.message}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
