import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_USERS, setSession } from "@/lib/session";

const Body = z.object({ userId: z.enum(DEMO_USERS) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unknown demo user" }, { status: 400 });
  await setSession(parsed.data.userId);
  return NextResponse.json({ ok: true });
}
