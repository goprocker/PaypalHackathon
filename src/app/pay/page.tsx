import Link from "next/link";
import { connection } from "next/server";
import { Checkout } from "@/components/checkout/checkout";
import { IntlCalculator, LargePaymentCheck, SmartRouter } from "@/components/pay/tools";
import { StatusLabel, type Status } from "@/components/status-label";
import { getInrRates } from "@/lib/fx";
import type { Key } from "@/lib/i18n/dict";
import { getT } from "@/lib/i18n/server";
import { CURRENCIES, type Currency } from "@/lib/pay";
import { paypalMock } from "@/lib/paypal";
import { currentUserId } from "@/lib/session";
import { cn } from "@/lib/utils";

const TOOLS = [
  { id: "copilot", status: "live" },
  { id: "router", status: "demo" },
  { id: "intl", status: "live" },
  { id: "large", status: "demo" },
] as const satisfies readonly { id: string; status: Status }[];
type Tool = (typeof TOOLS)[number]["id"];

const STATUS_KEY: Record<Status, Key> = { live: "status.live", demo: "status.demo", prototype: "status.prototype", soon: "status.soon" };

export default async function PayPage({ searchParams }: { searchParams: Promise<{ tool?: string; price?: string; cur?: string; risky?: string }> }) {
  await connection(); // live FX rates per request
  const [{ t }, userId, q, fx] = await Promise.all([getT(), currentUserId(), searchParams, getInrRates()]);
  const tool: Tool = TOOLS.find((x) => x.id === q.tool)?.id ?? "copilot";
  const active = TOOLS.find((x) => x.id === tool)!;
  const mock = paypalMock() || !process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const cur = CURRENCIES.includes(q.cur as Currency) ? (q.cur as Currency) : undefined;
  const price = q.price && /^\d{1,7}(\.\d{1,2})?$/.test(q.price) ? q.price : undefined;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold">{t("pay.title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("pay.desc")}</p>
      </header>

      <nav aria-label={t("pay.title")} className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <ul className="flex w-max gap-2">
          {TOOLS.map((x) => (
            <li key={x.id}>
              <Link
                href={`/pay?tool=${x.id}`}
                aria-current={x.id === tool ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
                  x.id === tool ? "border-accent/50 bg-accent-fill/20 font-semibold text-text" : "glass text-muted hover:text-text",
                )}
              >
                {t(`pay.${x.id}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{t(`pay.${tool}`)}</h2>
        <StatusLabel status={active.status} label={t(STATUS_KEY[active.status])} />
      </div>
      <p className="-mt-3 text-sm text-muted">{t(`pay.${tool}.desc`)}</p>

      {tool === "copilot" &&
        (userId ? (
          <Checkout mock={mock} clientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ""} />
        ) : (
          <p className="glass rounded-2xl p-5 text-sm">
            {t("pay.signin")}{" "}
            <Link href="/" className="font-medium text-accent underline-offset-4 hover:underline">{t("nav.home")}</Link>
          </p>
        ))}
      {tool === "router" && <SmartRouter usdInr={fx.rates.USD} initialRisky={q.risky === "1"} />}
      {tool === "intl" && <IntlCalculator rates={fx.rates} live={fx.source === "live"} initial={{ price, currency: cur }} />}
      {tool === "large" && <LargePaymentCheck simLabel={t("sim.bank")} />}
    </div>
  );
}
