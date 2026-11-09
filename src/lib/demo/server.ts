import { cookies } from "next/headers";
import { isScenario, SCENARIOS } from "./data";

export const SCENARIO_COOKIE = "payhub_scenario";

export async function activeScenario() {
  const v = (await cookies()).get(SCENARIO_COOKIE)?.value;
  return isScenario(v) ? SCENARIOS.find((s) => s.id === v)! : null;
}
