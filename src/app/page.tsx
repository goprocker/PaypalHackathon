import { DemoLogin } from "@/components/demo-login";
import { config } from "@/lib/config";
import { formatInr, formatUsd, trueCost } from "@/lib/truecost";

// Worked example shown as the hero: the same calculation the checkout runs.
const EXAMPLE_CENTS = 12999;
const example = trueCost({ priceCents: EXAMPLE_CENTS, usdInr: config.fallbackUsdInr });

export default function Home() {
  const worst = example.rows.reduce((a, b) => (b.totalPaise > a.totalPaise ? b : a));
  const best = example.rows.find((r) => r.cheapest)!;

  return (
    <div className="grid gap-12 py-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="max-w-xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold leading-[1.05] md:text-6xl">Know what it really costs before you pay.</h1>
          <p className="max-w-md text-lg text-muted">
            A {formatUsd(EXAMPLE_CENTS)} price tag isn&apos;t {formatInr(EXAMPLE_CENTS * config.fallbackUsdInr)}. Card markup, GST and conversion fees add up. PayHub shows the real rupee total, then tracks it for the family.
          </p>
        </div>

        <figure className="rounded-lg border border-border bg-surface p-5">
          <figcaption className="flex items-baseline justify-between text-sm text-muted">
            <span>Wireless headphones, {formatUsd(EXAMPLE_CENTS)}</span>
            <span className="tabular">₹{config.fallbackUsdInr}/USD</span>
          </figcaption>
          <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="amount text-5xl md:text-6xl">{formatInr(best.totalPaise)}</span>
            <span className="pb-1 text-sm text-muted">with {best.label}</span>
          </div>
          <ul className="mt-5 divide-y divide-border border-t border-border text-sm">
            {example.rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <span className={r.cheapest ? "font-semibold text-accent" : ""}>{r.label}</span>
                <span className="tabular">{formatInr(r.totalPaise)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            Picking the right method saves <strong className="tabular text-accent">{formatInr(worst.totalPaise - best.totalPaise)}</strong> on this one item.
          </p>
        </figure>
      </div>

      <DemoLogin />
    </div>
  );
}
