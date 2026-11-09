import { ScenarioPicker } from "@/components/scenario-picker";
import { StatusLabel } from "@/components/status-label";
import { DEMO_PAYMENTS } from "@/lib/demo/data";
import { activeScenario } from "@/lib/demo/server";
import { getT } from "@/lib/i18n/server";

export default async function DemoPage() {
  const [{ t }, active] = await Promise.all([getT(), activeScenario()]);
  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold">Demo Mode</h1>
          <StatusLabel status="demo" label={t("status.demo")} />
        </div>
        <p className="mt-1 text-sm text-muted">
          {DEMO_PAYMENTS.length} sample payments for a family of three. Pick a scenario to jump straight to it. {t("sim.bank")}.
        </p>
      </header>
      <ScenarioPicker active={active?.id ?? null} />
    </div>
  );
}
