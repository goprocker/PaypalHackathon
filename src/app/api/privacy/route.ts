import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrivacy, PRIVACY_COOKIE, viewer } from "@/lib/money-server";

const Body = z.object({ share: z.enum(["items", "categories", "total"]) });

/** Members can only change their own sharing setting. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose what your family can see" }, { status: 400 });
  const [me, privacy] = await Promise.all([viewer(), getPrivacy()]);
  const next = { ...privacy, [me.id]: parsed.data.share };
  (await cookies()).set(PRIVACY_COOKIE, JSON.stringify(next), { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return NextResponse.json({ ok: true, privacy: next });
}
