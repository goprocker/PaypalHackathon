import { connection, NextResponse } from "next/server";
import { chat, ChatBody } from "@/lib/chat";
import { getInrRates } from "@/lib/fx";
import { getLocale } from "@/lib/i18n/server";
import { getPrivacy, viewer } from "@/lib/money-server";
import { clock } from "@/lib/track";

/** Works without sign-in: the viewer defaults to the demo member Arun. */
export async function POST(req: Request) {
  await connection();
  const parsed = ChatBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return NextResponse.json({ error: "Type a question first (up to 2000 characters)" }, { status: 400 });
  }
  const [locale, me, privacy, fx] = await Promise.all([getLocale(), viewer(), getPrivacy(), getInrRates()]);
  return NextResponse.json(await chat(parsed.data.messages, locale, { viewer: me.id, privacy, rates: fx.rates, now: clock() }));
}
