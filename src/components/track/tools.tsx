"use client";

import { Copy, Download, FileText, Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const panel = "glass space-y-4 rounded-2xl p-5";

export type Receipt = { id: string; txnId: string; merchant: string; item: string; amount: string; method: string; date: string; status: string };
export type DisputeCase = Receipt & { issue: string; to: string; subject: string; body: string };

// ---------- Proof Vault (uploads live in this browser only) ----------

type Upload = { id: string; name: string; type: string; txnId: string; kind: "screenshot" | "invoice" | "other"; dataUrl: string; addedAt: string };
const KEY = "payhub_vault";
const MAX_BYTES = 1_500_000;

function loadUploads(): Upload[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Upload[]; } catch { return []; }
}
function storeUploads(u: Upload[]): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(u)); return true; } catch { return false; }
}

function useUploads() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  // localStorage is only readable after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setUploads(loadUploads()), []);
  return [uploads, setUploads] as const;
}

export function ProofVault({ receipts, initial }: { receipts: Receipt[]; initial?: string }) {
  const [uploads, setUploads] = useUploads();
  const [txnId, setTxnId] = useState((receipts.find((r) => r.id === initial) ?? receipts[0])?.txnId ?? "");
  const [kind, setKind] = useState<Upload["kind"]>("screenshot");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!/^image\/|^application\/pdf$/.test(file.type)) return setError("Add an image (PNG, JPG) or a PDF.");
    if (file.size > MAX_BYTES) return setError("File is over 1.5 MB. Take a smaller screenshot or compress the PDF.");
    setBusy(true);
    const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); }).catch(() => null);
    setBusy(false);
    if (!dataUrl) return setError("Could not read that file.");
    const next = [{ id: crypto.randomUUID(), name: file.name.slice(0, 80), type: file.type, txnId, kind, dataUrl, addedAt: new Date().toISOString().slice(0, 10) }, ...uploads];
    if (!storeUploads(next)) return setError("This browser's storage is full or blocked. Remove an older file and try again.");
    setUploads(next);
  }

  function remove(id: string) {
    const next = uploads.filter((u) => u.id !== id);
    storeUploads(next);
    setUploads(next);
  }

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <form className={panel} onSubmit={(e) => e.preventDefault()}>
        <h3 className="font-semibold">Add proof</h3>
        <Label>For which payment?
          <Select value={txnId} onChange={(e) => setTxnId(e.target.value)}>
            {receipts.map((r) => <option key={r.id} value={r.txnId}>{r.merchant} · {r.amount} · {r.date}</option>)}
          </Select>
        </Label>
        <Label>Type
          <Select value={kind} onChange={(e) => setKind(e.target.value as Upload["kind"])}>
            <option value="screenshot">Screenshot</option>
            <option value="invoice">Invoice or bill</option>
            <option value="other">Other</option>
          </Select>
        </Label>
        <label className={cn("inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-on-accent", busy && "opacity-60")}>
          {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Upload aria-hidden className="size-4" />} Choose file
          <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={onFile} disabled={busy || !txnId} />
        </label>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
        <p className="text-xs text-muted">Files stay in this browser only. They are not uploaded anywhere.</p>
      </form>

      <section className="space-y-3" aria-label="Saved proof">
        {receipts.map((r) => {
          const files = uploads.filter((u) => u.txnId === r.txnId);
          return (
            <article key={r.id} className={cn(panel, "space-y-2 p-4")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{r.merchant} <span className="font-normal text-muted">· {r.item}</span></p>
                  <p className="text-xs break-all text-muted">Txn {r.txnId} · {r.method} · {r.date} · {r.status}</p>
                </div>
                <span className="tabular font-semibold">{r.amount}</span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-good"><FileText aria-hidden className="size-3.5" /> Receipt saved automatically</p>
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
                  {f.type.startsWith("image/")
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={f.dataUrl} alt={`${f.kind} for ${r.merchant}`} className="size-12 rounded-lg object-cover" />
                    : <span className="grid size-12 place-items-center rounded-lg bg-surface-2"><ImageIcon aria-hidden className="size-5 text-muted" /></span>}
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium">{f.name}</p>
                    <p className="text-xs text-muted">{f.kind} · added {f.addedAt}</p>
                  </div>
                  <a href={f.dataUrl} download={f.name} className="grid size-11 place-items-center rounded-full hover:bg-surface-2" aria-label={`Download ${f.name}`}><Download aria-hidden className="size-4" /></a>
                  <button type="button" onClick={() => remove(f.id)} className="grid size-11 place-items-center rounded-full text-bad hover:bg-surface-2" aria-label={`Remove ${f.name}`}><Trash2 aria-hidden className="size-4" /></button>
                </div>
              ))}
            </article>
          );
        })}
      </section>
    </div>
  );
}

// ---------- Dispute builder ----------

export function DisputeBuilder({ cases, initial, name }: { cases: DisputeCase[]; initial?: string; name: string }) {
  const [id, setId] = useState(cases.find((c) => c.id === initial)?.id ?? cases[0]?.id ?? "");
  const c = cases.find((x) => x.id === id);
  const [draft, setDraft] = useState(() => (c ? { to: c.to, subject: c.subject, body: c.body, name } : null));
  const [uploads] = useUploads();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (!c || !draft) return <p className="glass rounded-2xl p-5 text-sm text-muted">No payments need a dispute right now.</p>;
  const attached = uploads.filter((u) => u.txnId === c.txnId);
  const pick = (v: string) => { const n = cases.find((x) => x.id === v)!; setId(v); setDraft({ ...draft, to: n.to, subject: n.subject, body: n.body }); setNote(null); };
  const set = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft({ ...draft, [k]: e.target.value });
  const missing = !draft.subject.trim() || !draft.body.trim() || !draft.name.trim();

  async function pdf() {
    if (!c || !draft || missing) return;
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const ascii = (s: string) => s.replace(/₹/g, "Rs. ").replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[’]/g, "'");
      const w = doc.internal.pageSize.getWidth() - 96;
      let y = 64;
      const write = (text: string, size = 11, bold = false, gap = 6) => {
        doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size);
        const lines = doc.splitTextToSize(ascii(text), w) as string[];
        doc.text(lines, 48, y);
        y += lines.length * size * 1.35 + gap;
      };
      write("Payment dispute", 18, true, 12);
      write(`Date: ${new Date().toISOString().slice(0, 10)}`);
      write(`To: ${draft.to}`);
      write(`Subject: ${draft.subject}`, 11, true, 14);
      write(draft.body, 11, false, 14);
      write("Payment details", 13, true);
      for (const [k, v] of [["Merchant", c.merchant], ["Item", c.item], ["Transaction ID", c.txnId], ["Amount", c.amount], ["Method", c.method], ["Date", c.date], ["Status", c.status]]) write(`${k}: ${v}`, 11, false, 2);
      y += 10;
      write(`Attached proof: ${attached.length ? attached.map((a) => `${a.kind} (${a.name})`).join(", ") : "receipt from PayHub AI Proof Vault"}`);
      write(`Sincerely,\n${draft.name}`, 11, false, 18);
      write("Drafted with PayHub AI (independent demo). Simulated - no bank connected. Check every detail before sending.", 8);
      doc.save(`dispute-${c.txnId}.pdf`);
      setNote("PDF downloaded.");
    } catch {
      setNote("Could not create the PDF. Copy the text instead.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!draft) return;
    try { await navigator.clipboard.writeText(`To: ${draft.to}\nSubject: ${draft.subject}\n\n${draft.body}\n\n${draft.name}`); setNote("Copied."); }
    catch { setNote("Copy is blocked in this browser. Select the text and copy it."); }
  }

  return (
    <form className={panel} onSubmit={(e) => { e.preventDefault(); void pdf(); }}>
      <Label>Payment
        <Select value={id} onChange={(e) => pick(e.target.value)}>
          {cases.map((x) => <option key={x.id} value={x.id}>{x.merchant} · {x.amount} · {x.issue}</option>)}
        </Select>
      </Label>
      <Label>To<Input value={draft.to} onChange={set("to")} maxLength={120} /></Label>
      <Label>Subject<Input value={draft.subject} onChange={set("subject")} maxLength={160} /></Label>
      <Label>Message
        <textarea value={draft.body} onChange={set("body")} rows={7} maxLength={2000}
          className="w-full rounded-xl border border-border bg-surface p-3 text-sm focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/20 focus-visible:outline-none" />
      </Label>
      <Label>Your name<Input value={draft.name} onChange={set("name")} maxLength={80} /></Label>
      <p className="text-xs text-muted">
        Proof attached: {attached.length ? attached.map((a) => a.name).join(", ") : "the saved receipt"} (txn {c.txnId}). Add screenshots in the Proof Vault tab.
      </p>
      {missing && <p role="alert" className="text-sm text-bad">Subject, message and your name are needed.</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={copy}><Copy aria-hidden /> Copy text</Button>
        <Button variant="accent" disabled={busy || missing}>{busy ? <Loader2 aria-hidden className="animate-spin" /> : <Download aria-hidden />} Download PDF</Button>
      </div>
      {note && <p role="status" className="text-sm text-muted">{note}</p>}
    </form>
  );
}
