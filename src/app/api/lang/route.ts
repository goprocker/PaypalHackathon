import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCALES } from "@/lib/i18n/dict";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

const Body = z.object({ locale: z.enum(LOCALES) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  (await cookies()).set(LOCALE_COOKIE, parsed.data.locale, { sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return NextResponse.json({ ok: true });
}
