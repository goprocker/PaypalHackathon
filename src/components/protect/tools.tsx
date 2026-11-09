"use client";

import jsQR from "jsqr";
import { Camera, CircleCheck, ImageUp, Loader2, ShieldAlert, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { RiskLevel } from "@/lib/agents/agents";
import { SAFE_QR, SCAM_QR } from "@/lib/demo/data";
import {
  checkPaymentLink, checkQr, COLLECT_REQUESTS, judgeCollect, merchantTrust, OTP_QUIZ, type Check, type CollectRequest,
} from "@/lib/protect";
import { formatInr } from "@/lib/truecost";
import { cn } from "@/lib/utils";

const panel = "glass space-y-4 rounded-2xl p-5";

const TONE: Record<RiskLevel, { cls: string; label: string; Icon: typeof CircleCheck }> = {
  safe: { cls: "border-good/50 bg-good/10 text-good", label: "Looks safe", Icon: CircleCheck },
  caution: { cls: "border-warn/50 bg-warn/10 text-warn", label: "Be careful", Icon: TriangleAlert },
  high: { cls: "border-bad/50 bg-bad/10 text-bad", label: "High risk – don't pay", Icon: ShieldAlert },
};

/** Risk banner, score meter and the signals behind it. */
export function RiskResult({ check, children }: { check: Check; children?: React.ReactNode }) {
  const t = TONE[check.level];
  return (
    <div aria-live="polite" className="space-y-3">
      <div className={cn("flex items-center gap-2 rounded-xl border p-3 font-semibold", t.cls)}>
        <t.Icon aria-hidden className="size-5 shrink-0" />
        <span className="flex-1">{t.label}</span>
        <span className="tabular text-sm">{check.score}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-2" role="meter" aria-label="Safety score" aria-valuenow={check.score} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("h-1.5 rounded-full", check.level === "safe" ? "bg-good" : check.level === "caution" ? "bg-warn" : "bg-bad")} style={{ width: `${check.score}%` }} />
      </div>
      <ul className="list-disc space-y-1 pl-5 text-sm">{check.signals.map((s) => <li key={s}>{s}</li>)}</ul>
      {children}
    </div>
  );
}

function RouterLink() {
  return (
    <p className="text-sm text-muted">
      The Router agent now blocks UPI for this payee.{" "}
      <Link href="/pay?tool=router&risky=1" className="font-medium text-accent underline-offset-4 hover:underline">See safe ways to pay</Link>
    </p>
  );
}

// ---------- Payment-link checker ----------

export function LinkChecker() {
  const [link, setLink] = useState("");
  const [result, setResult] = useState<ReturnType<typeof checkPaymentLink> | null>(null);
  const samples = ["https://www.amazon.in/gp/cart", "http://sbi-kyc-update.xyz/verify?refund=1", "https://bit.ly/pay-refund"];
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <form className={panel} onSubmit={(e) => { e.preventDefault(); setResult(checkPaymentLink(link)); }}>
        <Label>Paste a payment link<Input value={link} onChange={(e) => { setLink(e.target.value); setResult(null); }} inputMode="url" placeholder="https://… or upi://pay?…" maxLength={2000} /></Label>
        <Button className="w-full" size="lg" variant="accent">Check link</Button>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-muted">Try:</span>
          {samples.map((s) => (
            <button key={s} type="button" className="min-h-9 rounded-full border border-border px-3 hover:border-accent/50" onClick={() => { setLink(s); setResult(checkPaymentLink(s)); }}>
              {new URL(s).hostname}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">We only read the text of the link. It is never opened.</p>
      </form>
      <section className={panel}>
        {result ? (result.kind === "invalid" ? <p role="alert" className="text-sm text-bad">{result.signals[0]}</p> : <RiskResult check={result}>{result.level !== "safe" && <RouterLink />}</RiskResult>)
          : <p className="text-sm text-muted">Results show here.</p>}
      </section>
    </div>
  );
}

// ---------- QR risk scan ----------

function decode(img: CanvasImageSource, w: number, h: number, canvas: HTMLCanvasElement): string | null {
  const scale = Math.min(1, 1000 / Math.max(w, h));
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data.data, data.width, data.height)?.data ?? null;
}

export function QrScanner({ initial }: { initial?: "scam" | "safe" }) {
  const [payload, setPayload] = useState<string | null>(initial === "scam" ? SCAM_QR : initial === "safe" ? SAFE_QR : null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!camera) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        const tick = () => {
          const v = video.current;
          if (stopped || !v || !canvas.current) return;
          const found = v.videoWidth ? decode(v, v.videoWidth, v.videoHeight, canvas.current) : null;
          if (found) { setPayload(found); setCamera(false); return; }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setError("Camera not available. Allow camera access, or upload a photo of the QR instead.");
        setCamera(false);
      }
    })();
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [camera]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file (PNG or JPG).");
    setBusy(true); setError(null); setPayload(null);
    try {
      const bmp = await createImageBitmap(file);
      const found = canvas.current ? decode(bmp, bmp.width, bmp.height, canvas.current) : null;
      if (found) setPayload(found); else setError("No QR code found in that image. Try a sharper, closer photo.");
    } catch {
      setError("Could not read that image.");
    } finally {
      setBusy(false);
    }
  }

  const result = payload ? checkQr(payload) : null;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className={panel}>
        <div className="grid grid-cols-2 gap-2">
          <label className={cn("inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-accent-fill text-sm font-semibold text-on-accent", busy && "opacity-60")}>
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <ImageUp aria-hidden className="size-4" />} Upload QR
            <input type="file" accept="image/*" className="sr-only" onChange={onFile} disabled={busy} />
          </label>
          <Button size="lg" variant="outline" onClick={() => { setError(null); setPayload(null); setCamera((c) => !c); }}>
            {camera ? <X aria-hidden /> : <Camera aria-hidden />} {camera ? "Stop" : "Camera"}
          </Button>
        </div>
        {camera && <video ref={video} muted playsInline className="aspect-square w-full rounded-xl bg-black object-cover" aria-label="Camera preview" />}
        <canvas ref={canvas} className="hidden" />
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-muted">Demo:</span>
          <button type="button" className="min-h-9 rounded-full border border-border px-3 hover:border-accent/50" onClick={() => { setError(null); setPayload(SCAM_QR); }}>“Refund desk” QR</button>
          <button type="button" className="min-h-9 rounded-full border border-border px-3 hover:border-accent/50" onClick={() => { setError(null); setPayload(SAFE_QR); }}>Shop QR</button>
        </div>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
        <p className="text-xs text-muted">The image stays on your phone. Scanning here never pays anyone.</p>
      </div>
      <section className={panel}>
        {result ? (
          <>
            {result.details && (
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted">Shows as</dt><dd className="font-medium break-words">{result.details.name || "–"}</dd>
                <dt className="text-muted">Money goes to</dt><dd className="font-medium break-all">{result.details.payee || "–"}</dd>
                {result.details.amount && <><dt className="text-muted">Asks you to pay</dt><dd className="font-semibold text-warn">{formatInr(Math.round(Number(result.details.amount) * 100))}</dd></>}
                {result.details.note && <><dt className="text-muted">Note</dt><dd className="break-words">{result.details.note}</dd></>}
              </dl>
            )}
            <RiskResult check={result}>{result.level !== "safe" && <RouterLink />}</RiskResult>
          </>
        ) : <p className="text-sm text-muted">Upload or scan a QR to see who really gets paid.</p>}
      </section>
    </div>
  );
}

// ---------- Collect-request simulator ----------

export function CollectSimulator({ simLabel }: { simLabel: string }) {
  const [choices, setChoices] = useState<Record<string, "approve" | "decline">>({});
  const score = COLLECT_REQUESTS.filter((c) => choices[c.id] === judgeCollect(c).correct).length;
  const done = Object.keys(choices).length === COLLECT_REQUESTS.length;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">These requests just arrived in your UPI app. Approve or decline each one. {simLabel}.</p>
      <ul className="grid gap-3 md:grid-cols-2">
        {COLLECT_REQUESTS.map((c) => <CollectCard key={c.id} c={c} choice={choices[c.id]} onChoose={(v) => setChoices({ ...choices, [c.id]: v })} />)}
      </ul>
      {done && (
        <p role="status" className="glass rounded-2xl p-4 font-semibold">
          You got {score} of {COLLECT_REQUESTS.length} right.{" "}
          <button type="button" className="ml-2 text-sm font-medium text-accent underline-offset-4 hover:underline" onClick={() => setChoices({})}>Try again</button>
        </p>
      )}
    </div>
  );
}

function CollectCard({ c, choice, onChoose }: { c: CollectRequest; choice?: "approve" | "decline"; onChoose: (v: "approve" | "decline") => void }) {
  const v = judgeCollect(c);
  return (
    <li className={panel}>
      <div>
        <p className="text-xs text-muted">Collect request from {c.from}</p>
        <p className="font-semibold">{c.name} requests <span className="tabular">{formatInr(c.amountPaise)}</span></p>
        <p className="mt-1 text-sm">“{c.message}”</p>
      </div>
      {!choice ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => onChoose("decline")}>Decline</Button>
          <Button variant="accent" onClick={() => onChoose("approve")}>Approve &amp; pay</Button>
        </div>
      ) : (
        <RiskResult check={v}>
          <p className={cn("text-sm font-semibold", choice === v.correct ? "text-good" : "text-bad")}>
            {choice === v.correct ? "Right call." : choice === "approve" ? `That would have sent ${formatInr(c.amountPaise)} out of your account.` : "This one was safe to approve."}{" "}
            <span className="font-normal text-text">{v.lesson}</span>
          </p>
        </RiskResult>
      )}
    </li>
  );
}

// ---------- OTP quiz ----------

export function OtpQuiz() {
  const [answers, setAnswers] = useState<(number | null)[]>(OTP_QUIZ.map(() => null));
  const right = answers.filter((a, i) => a === OTP_QUIZ[i].answer).length;
  const done = answers.every((a) => a !== null);
  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {OTP_QUIZ.map((q, i) => {
          const a = answers[i];
          return (
            <li key={q.q} className={panel}>
              <p className="font-medium">{i + 1}. {q.q}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o, j) => (
                  <button
                    key={o} type="button" disabled={a !== null}
                    aria-pressed={a === j}
                    onClick={() => setAnswers(answers.map((x, k) => (k === i ? j : x)))}
                    className={cn(
                      "min-h-11 rounded-xl border px-3 py-2 text-left text-sm",
                      a === null ? "border-border hover:border-accent/50" : j === q.answer ? "border-good/60 bg-good/10" : a === j ? "border-bad/60 bg-bad/10" : "border-border opacity-60",
                    )}
                  >{o}</button>
                ))}
              </div>
              {a !== null && <p className={cn("text-sm", a === q.answer ? "text-good" : "text-bad")}>{a === q.answer ? "Correct. " : "Not quite. "}<span className="text-text">{q.why}</span></p>}
            </li>
          );
        })}
      </ol>
      {done && (
        <p role="status" className="glass rounded-2xl p-4 font-semibold">
          Score {right}/{OTP_QUIZ.length}. Golden rule: never share an OTP or UPI PIN with anyone.{" "}
          <button type="button" className="ml-2 text-sm font-medium text-accent underline-offset-4 hover:underline" onClick={() => setAnswers(OTP_QUIZ.map(() => null))}>Retake</button>
        </p>
      )}
    </div>
  );
}

// ---------- Merchant Trust Score ----------

export function MerchantTrust() {
  const [q, setQ] = useState("");
  const [r, setR] = useState<ReturnType<typeof merchantTrust> | null>(null);
  const run = (v: string) => { setQ(v); setR(v.trim() ? merchantTrust(v) : null); };
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <form className={panel} onSubmit={(e) => { e.preventDefault(); run(q); }}>
        <Label>Shop website or UPI ID<Input value={q} onChange={(e) => { setQ(e.target.value); setR(null); }} placeholder="bigbasket@hdfcbank or https://…" maxLength={300} /></Label>
        <Button className="w-full" size="lg" variant="accent" disabled={!q.trim()}>Get trust score</Button>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-muted">Try:</span>
          {["bigbasket@hdfcbank", "paytm.refund.help@ybl", "https://www.flipkart.com"].map((s) => (
            <button key={s} type="button" className="min-h-9 rounded-full border border-border px-3 hover:border-accent/50" onClick={() => run(s)}>{s}</button>
          ))}
        </div>
        <p className="text-xs text-muted">Based on the text and your own payment history only. A low score means risk signals, not proof of fraud.</p>
      </form>
      <section className={panel}>{r ? <RiskResult check={r} /> : <p className="text-sm text-muted">Results show here.</p>}</section>
    </div>
  );
}
