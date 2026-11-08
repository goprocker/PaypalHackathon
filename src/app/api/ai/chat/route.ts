import { NextResponse } from "next/server";
import { chat, ChatBody } from "@/lib/chat";
import { currentUserId } from "@/lib/session";

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const parsed = ChatBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.messages.at(-1)?.role !== "user") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const out = await chat(userId, parsed.data.messages);
  if (!out) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  return NextResponse.json(out);
}
