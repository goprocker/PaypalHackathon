import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { SCENARIOS } from "@/lib/demo/data";
import { SCENARIO_COOKIE } from "@/lib/demo/server";
import { currentUserId, setSession } from "@/lib/session";

const Body = z.object({ scenario: z.enum(SCENARIOS.map((s) => s.id) as [string, ...string[]]).nullable() });

/** Load a demo scenario (signs in as Arun if needed) or clear it with `null`. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });
  const jar = await cookies();
  const { scenario } = parsed.data;
  if (!scenario) {
    jar.delete(SCENARIO_COOKIE);
    return NextResponse.json({ ok: true });
  }
  if (!(await currentUserId())) await setSession("u_me");
  jar.set(SCENARIO_COOKIE, scenario, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
  return NextResponse.json({ ok: true, href: SCENARIOS.find((s) => s.id === scenario)!.href });
}
