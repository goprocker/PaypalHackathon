import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/paypal";
import { handleWebhook } from "@/lib/webhook";

export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 100_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  const status = await handleWebhook(req.headers, raw, verifyWebhook);
  return NextResponse.json({ ok: status === 200 }, { status });
}
