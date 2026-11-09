import Link from "next/link";
import { CollectSimulator, LinkChecker, MerchantTrust, OtpQuiz, QrScanner } from "@/components/protect/tools";
import { StatusLabel, type Status } from "@/components/status-label";
import type { Key } from "@/lib/i18n/dict";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

const TOOLS = [
  { id: "link", status: "live" },
  { id: "qr", status: "live" },
  { id: "collect", status: "demo" },
  { id: "otp", status: "live" },
  { id: "trust", status: "live" },
] as const satisfies readonly { id: string; status: Status }[];
type Tool = (typeof TOOLS)[number]["id"];

const STATUS_KEY: Record<Status, Key> = { live: "status.live", demo: "status.demo", prototype: "status.prototype", soon: "status.soon" };

export default async function ProtectPage({ searchParams }: { searchParams: Promise<{ tool?: string; qr?: string }> }) {
  const [{ t }, q] = await Promise.all([getT(), searchParams]);
  const qr = q.qr === "scam" || q.qr === "safe" ? q.qr : undefined;
  const tool: Tool = qr ? "qr" : TOOLS.find((x) => x.id === q.tool)?.id ?? "link";
  const active = TOOLS.find((x) => x.id === tool)!;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold">{t("protect.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("protect.desc")}</p>
      </header>

      <nav aria-label={t("protect.title")} className="-mx-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-2">
          {TOOLS.map((x) => (
            <li key={x.id}>
              <Link
                href={`/protect?tool=${x.id}`}
                aria-current={x.id === tool ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
                  x.id === tool ? "border-accent bg-accent text-on-accent" : "glass hover:border-accent/50",
                )}
              >
                {t(`protect.${x.id}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{t(`protect.${tool}`)}</h2>
        <StatusLabel status={active.status} label={t(STATUS_KEY[active.status])} />
      </div>
      <p className="-mt-3 text-sm text-muted">{t(`protect.${tool}.desc`)}</p>

      {tool === "link" && <LinkChecker />}
      {tool === "qr" && <QrScanner key={qr ?? "none"} initial={qr} />}
      {tool === "collect" && <CollectSimulator simLabel={t("sim.bank")} />}
      {tool === "otp" && <OtpQuiz />}
      {tool === "trust" && <MerchantTrust />}
    </div>
  );
}
