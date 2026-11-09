// Chat assistant over every module. Each tool calls the real agent or module
// function, so answers come from the same data the screens show. Without an
// API key the rule-based router picks one tool from keywords and replies in
// the user's language.

import { z } from "zod";
import { fraudCheckLink, fraudCheckQr, fxCost, track } from "./agents/agents";
import { ActivityLog, type AgentId } from "./agents/log";
import { DEMO_MEMBERS } from "./demo/data";
import type { Locale } from "./i18n/dict";
import { budgets, duplicateGroups, familyView, lrs, monthSummary, subscriptions, type Privacy } from "./money";
import type { Currency } from "./pay";
import { trackList } from "./track";
import { formatInr } from "./truecost";

type MemberId = (typeof DEMO_MEMBERS)[number]["id"];
export type Ctx = { viewer: MemberId; privacy: Privacy; rates: Record<Currency, number>; now: number };
export type Link = { href: string; label: string };
export type Answer = { reply: string; agents: AgentId[]; links: Link[]; source: "ai" | "rules" };

const rupees = (paise: number) => Math.round(paise / 100);

// ---------- Tools (shared by the model and the rule router) ----------

const Cat = z.object({ category: z.string().max(40).optional() });
const Cost = z.object({ price_usd: z.number().positive().max(100_000), shipping_usd: z.number().min(0).max(10_000).default(0), include_duty: z.boolean().default(false) });
const Check = z.object({ text: z.string().min(1).max(500) });
const Merchant = z.object({ merchant: z.string().max(60).optional() });
const Empty = z.object({});

type Tool = { description: string; schema: z.ZodType; params: Record<string, unknown>; required?: string[]; run: (input: never, ctx: Ctx, log: ActivityLog) => unknown };

export const TOOLS = {
  spending: {
    description: "The user's spending in the last 30 days: total, per category and the budget for each category.",
    schema: Cat, params: { category: { type: "string", description: "Optional category, e.g. Food" } },
    run: (a: z.infer<typeof Cat>, ctx: Ctx, log: ActivityLog) => {
      log.emit("budget", "start", `Reading this month's spending${a.category ? ` on ${a.category}` : ""}`);
      const s = monthSummary(ctx.viewer);
      const b = budgets(ctx.viewer).filter((x) => !a.category || x.category.toLowerCase() === a.category.toLowerCase());
      log.emit("budget", "result", `${formatInr(s.totalPaise)} across ${s.count} payments`);
      return { total_inr: rupees(s.totalPaise), payments: s.count, budgets: b.map((x) => ({ category: x.category, spent_inr: rupees(x.spentPaise), limit_inr: rupees(x.limitPaise), pct: x.pct })) };
    },
  },
  family: {
    description: "Family spending per member, with each member's privacy setting applied. Private items appear only as a 'Private' total.",
    schema: Empty, params: {},
    run: (_: object, ctx: Ctx, log: ActivityLog) => {
      log.emit("budget", "start", "Reading family spending with privacy settings");
      return familyView(ctx.viewer, ctx.privacy).map((m) => ({
        name: m.name, you: m.self, total_inr: rupees(m.totalPaise), shares: m.share,
        categories: m.categories?.map((c) => ({ category: c.category, inr: rupees(c.paise) })) ?? "hidden by member",
      }));
    },
  },
  problems: {
    description: "Payments that need attention: failed but debited, charged twice, refunds pending or overdue, with refund dates and 'Don't pay again' flags.",
    schema: Empty, params: {},
    run: (_: object, ctx: Ctx, log: ActivityLog) => {
      const list = trackList(ctx.viewer, ctx.now).filter((x) => x.issue || x.t.dontPayAgain);
      for (const x of list) track(log, x.p, ctx.now);
      return list.map((x) => ({ id: x.p.id, merchant: x.p.merchant, inr: rupees(x.p.amountPaise), issue: x.issue, refund_eta: x.t.refundEta ?? null, dont_pay_again: x.t.dontPayAgain }));
    },
  },
  track_payment: {
    description: "Status and refund progress of one payment, looked up by merchant name.",
    schema: Merchant, params: { merchant: { type: "string" } },
    run: (a: z.infer<typeof Merchant>, ctx: Ctx, log: ActivityLog) => {
      const q = (a.merchant ?? "").toLowerCase();
      const hit = trackList(ctx.viewer, ctx.now).find((x) => q && x.p.merchant.toLowerCase().includes(q));
      if (!hit) return { found: false };
      const t = track(log, hit.p, ctx.now);
      return { found: true, id: hit.p.id, merchant: hit.p.merchant, inr: rupees(hit.p.amountPaise), status: hit.p.status, stage: t.stage, refund_eta: t.refundEta ?? null, dont_pay_again: t.dontPayAgain };
    },
  },
  duplicates: {
    description: "Charges that went through twice (same payee, amount and day).",
    schema: Empty, params: {},
    run: (_: object, ctx: Ctx, log: ActivityLog) => {
      const g = duplicateGroups(ctx.viewer);
      for (const x of g) log.emit("budget", "warn", `Possible double charge: ${x.kept.merchant} ${formatInr(x.kept.amountPaise)}`);
      return g.map((x) => ({ merchant: x.kept.merchant, times: x.extra.length + 1, extra_inr: rupees(x.extraPaise), extra_id: x.extra[0].id }));
    },
  },
  subscriptions: {
    description: "Recurring subscriptions with monthly and yearly cost.",
    schema: Empty, params: {},
    run: (_: object, ctx: Ctx, log: ActivityLog) => {
      log.emit("budget", "start", "Listing subscriptions");
      return subscriptions(ctx.viewer).map((s) => ({ merchant: s.merchant, monthly_inr: rupees(s.monthlyPaise), yearly_inr: rupees(s.yearlyPaise), also_paid_by: s.sharedWith }));
    },
  },
  lrs: {
    description: "Foreign spending this financial year against the USD 250,000 LRS limit, and room left before TCS.",
    schema: Empty, params: {},
    run: (_: object, ctx: Ctx, log: ActivityLog) => {
      log.emit("fx", "start", "Adding up foreign spending for LRS");
      const l = lrs(ctx.viewer, ctx.rates);
      return { used_usd: l.usedUsd, left_usd: l.leftUsd, pct: l.pct, inr_before_tcs: rupees(l.tcsLeftPaise) };
    },
  },
  true_cost: {
    description: "Final INR cost of a USD purchase for each way to pay (FX markup, GST, optional import duty).",
    schema: Cost, required: ["price_usd"],
    params: { price_usd: { type: "number" }, shipping_usd: { type: "number" }, include_duty: { type: "boolean" } },
    run: (a: z.infer<typeof Cost>, ctx: Ctx, log: ActivityLog) => {
      const c = fxCost(log, { priceCents: Math.round(a.price_usd * 100), shippingCents: Math.round(a.shipping_usd * 100), usdInr: ctx.rates.USD, includeDuty: a.include_duty });
      return { usd_inr: ctx.rates.USD, methods: c.rows.map((r) => ({ method: r.label, total_inr: rupees(r.totalPaise), cheapest: r.cheapest })) };
    },
  },
  check_safety: {
    description: "Fraud check of a UPI QR payload (upi://...) or a payment link (https://...).",
    schema: Check, required: ["text"], params: { text: { type: "string" } },
    run: (a: z.infer<typeof Check>, _ctx: Ctx, log: ActivityLog) => {
      const r = a.text.trim().startsWith("upi:") ? fraudCheckQr(log, a.text) : fraudCheckLink(log, a.text);
      return { level: r.level, score: r.score, signals: r.signals };
    },
  },
} satisfies Record<string, Tool>;
export type ToolName = keyof typeof TOOLS;

export function runTool(name: string, input: unknown, ctx: Ctx, log: ActivityLog): unknown {
  const tool = (TOOLS as Record<string, Tool>)[name];
  if (!tool) throw new Error(`Unknown tool ${name}`);
  return tool.run(tool.schema.parse(input ?? {}) as never, ctx, log);
}

// ---------- Rule-based replies in three languages ----------

type Phrases = {
  spent: (total: string, n: number) => string;
  cat: (cat: string, spent: string, limit: string, pct: number) => string;
  left: (left: string, total: string) => string;
  over: (cats: string) => string;
  problems: (n: number) => string;
  noProblems: string;
  problem: (m: string, amt: string, what: string) => string;
  issue: Record<string, string>;
  dontPay: (eta: string | null) => string;
  dups: (m: string, n: number, extra: string) => string;
  noDups: string;
  subs: (n: number, month: string, year: string) => string;
  shared: (m: string, who: string) => string;
  lrs: (used: string, pct: number, tcs: string) => string;
  cost: (usd: string, cheapest: string, total: string) => string;
  safe: Record<"safe" | "caution" | "high", string>;
  family: (rows: string) => string;
  privateNote: string;
  help: string;
  notFound: (m: string) => string;
};

const P: Record<Locale, Phrases> = {
  en: {
    spent: (t, n) => `You spent ${t} across ${n} payments in the last 30 days.`,
    cat: (c, s, l, p) => `${c}: ${s} of ${l} (${p}%).`,
    left: (l, t) => `You have ${l} left of your ${t} monthly budget.`,
    over: (c) => `Over or close to the limit: ${c}.`,
    problems: (n) => `${n} payment${n === 1 ? " needs" : "s need"} attention:`,
    noProblems: "Nothing needs attention. All your payments look fine.",
    problem: (m, a, w) => `• ${m} ${a}: ${w}`,
    issue: { failed_debit: "failed but money was debited", duplicate: "charged twice", refund_overdue: "refund overdue", refund_pending: "refund on the way", pending: "still being confirmed" },
    dontPay: (e) => `Don't pay again${e ? `, refund expected by ${e}` : ""}.`,
    dups: (m, n, x) => `${m} charged you ${n} times. You can ask for ${x} back.`,
    noDups: "No double charges found this month.",
    subs: (n, m, y) => `You have ${n} subscriptions costing ${m} a month (${y} a year).`,
    shared: (m, w) => `${w} also pays for ${m}. A family plan may cost less.`,
    lrs: (u, p, t) => `You've used ${u} of the USD 2.5 lakh LRS limit this year (${p}%). About ${t} more before 20% TCS applies.`,
    cost: (u, c, t) => `${u} costs least by ${c}: about ${t} in total.`,
    safe: { safe: "Looks safe", caution: "Be careful", high: "High risk. Don't pay" },
    family: (r) => `Family spending in the last 30 days:\n${r}`,
    privateNote: "Private items are only shown as a total.",
    help: "I can answer about spending, budgets, problem payments and refunds, double charges, subscriptions, LRS, the cost of buying abroad, and whether a QR or link is safe. Try \"Any problems with my payments?\"",
    notFound: (m) => `I couldn't find a payment to ${m}.`,
  },
  ta: {
    spent: (t, n) => `கடந்த 30 நாட்களில் ${n} கட்டணங்களில் ${t} செலவு செய்தீர்கள்.`,
    cat: (c, s, l, p) => `${c}: ${l} இல் ${s} (${p}%).`,
    left: (l, t) => `உங்கள் ${t} மாத பட்ஜெட்டில் ${l} மீதம் உள்ளது.`,
    over: (c) => `வரம்பை நெருங்கியவை அல்லது தாண்டியவை: ${c}.`,
    problems: (n) => `${n} கட்டணங்களைக் கவனிக்க வேண்டும்:`,
    noProblems: "கவனிக்க வேண்டியது எதுவும் இல்லை. எல்லாக் கட்டணங்களும் சரி.",
    problem: (m, a, w) => `• ${m} ${a}: ${w}`,
    issue: { failed_debit: "தோல்வி, ஆனால் பணம் கழிக்கப்பட்டது", duplicate: "இரண்டு முறை கழிக்கப்பட்டது", refund_overdue: "ரீஃபண்ட் தாமதம்", refund_pending: "ரீஃபண்ட் வருகிறது", pending: "இன்னும் உறுதியாகவில்லை" },
    dontPay: (e) => `மீண்டும் செலுத்த வேண்டாம்${e ? `, ரீஃபண்ட் ${e} க்குள் வரும்` : ""}.`,
    dups: (m, n, x) => `${m} உங்களிடம் ${n} முறை கட்டணம் வசூலித்தது. ${x} திரும்பக் கேட்கலாம்.`,
    noDups: "இந்த மாதம் இரட்டைக் கட்டணம் இல்லை.",
    subs: (n, m, y) => `${n} சந்தாக்கள், மாதம் ${m} (வருடம் ${y}).`,
    shared: (m, w) => `${w} அவர்களும் ${m} க்குச் செலுத்துகிறார். குடும்பத் திட்டம் மலிவாக இருக்கலாம்.`,
    lrs: (u, p, t) => `இந்த ஆண்டு USD 2.5 லட்சம் LRS வரம்பில் ${u} பயன்படுத்தியுள்ளீர்கள் (${p}%). 20% TCS க்கு முன் சுமார் ${t} மீதம்.`,
    cost: (u, c, t) => `${u} க்கு ${c} மூலம் செலுத்துவது மலிவு: மொத்தம் சுமார் ${t}.`,
    safe: { safe: "பாதுகாப்பானது போல் தெரிகிறது", caution: "கவனமாக இருங்கள்", high: "அதிக ஆபத்து. செலுத்த வேண்டாம்" },
    family: (r) => `கடந்த 30 நாட்களின் குடும்பச் செலவு:\n${r}`,
    privateNote: "தனிப்பட்டவை மொத்தமாக மட்டுமே காட்டப்படும்.",
    help: "செலவு, பட்ஜெட், சிக்கலான கட்டணங்கள், ரீஃபண்ட், இரட்டைக் கட்டணம், சந்தாக்கள், LRS, வெளிநாட்டு வாங்கும் செலவு, QR அல்லது இணைப்பு பாதுகாப்பு பற்றிக் கேளுங்கள். உதா: \"என் கட்டணங்களில் சிக்கல் உண்டா?\"",
    notFound: (m) => `${m} க்கான கட்டணம் கிடைக்கவில்லை.`,
  },
  hi: {
    spent: (t, n) => `पिछले 30 दिनों में आपने ${n} भुगतानों में ${t} खर्च किए।`,
    cat: (c, s, l, p) => `${c}: ${l} में से ${s} (${p}%)।`,
    left: (l, t) => `आपके ${t} मासिक बजट में ${l} बचे हैं।`,
    over: (c) => `सीमा के पास या पार: ${c}।`,
    problems: (n) => `${n} भुगतानों पर ध्यान चाहिए:`,
    noProblems: "किसी भुगतान में दिक्कत नहीं है। सब ठीक है।",
    problem: (m, a, w) => `• ${m} ${a}: ${w}`,
    issue: { failed_debit: "फ़ेल हुआ पर पैसा कटा", duplicate: "दो बार कटा", refund_overdue: "रिफ़ंड में देरी", refund_pending: "रिफ़ंड आ रहा है", pending: "अभी पुष्टि बाकी" },
    dontPay: (e) => `दोबारा भुगतान न करें${e ? `, रिफ़ंड ${e} तक आएगा` : ""}।`,
    dups: (m, n, x) => `${m} ने ${n} बार पैसे काटे। आप ${x} वापस माँग सकते हैं।`,
    noDups: "इस महीने कोई दोहरा भुगतान नहीं मिला।",
    subs: (n, m, y) => `आपके ${n} सब्सक्रिप्शन हैं, महीने में ${m} (साल में ${y})।`,
    shared: (m, w) => `${w} भी ${m} के लिए भुगतान करते हैं। फ़ैमिली प्लान सस्ता पड़ सकता है।`,
    lrs: (u, p, t) => `इस साल आपने USD 2.5 लाख LRS सीमा में से ${u} इस्तेमाल किए (${p}%)। 20% TCS से पहले लगभग ${t} बाकी।`,
    cost: (u, c, t) => `${u} के लिए ${c} से भुगतान सबसे सस्ता है: कुल लगभग ${t}।`,
    safe: { safe: "सुरक्षित लगता है", caution: "सावधान रहें", high: "ज़्यादा जोखिम। भुगतान न करें" },
    family: (r) => `पिछले 30 दिनों का पारिवारिक खर्च:\n${r}`,
    privateNote: "निजी आइटम केवल कुल राशि के रूप में दिखते हैं।",
    help: "खर्च, बजट, दिक्कत वाले भुगतान, रिफ़ंड, दोहरे भुगतान, सब्सक्रिप्शन, LRS, विदेश से खरीद की लागत, और QR या लिंक सुरक्षित है या नहीं, पूछें। जैसे \"मेरे भुगतानों में कोई दिक्कत?\"",
    notFound: (m) => `${m} को कोई भुगतान नहीं मिला।`,
  },
};

// Keywords in English, Tamil and Hindi for each intent.
const K = {
  safety: /upi:\/\/|https?:\/\/|\bqr\b|link|scam|safe|fraud|மோசடி|பாதுகாப்|धोखा|सुरक्षित|लिंक/i,
  cost: /(\$|usd|dollars?|டாலர்|डॉलर)\s*\d|\d+\s*(\$|usd|dollars?|டாலர்|डॉलर)|abroad|import|cost.*\d/i,
  dups: /twice|double|duplicate|இரண்டு முறை|இரட்டை|दो बार|दोहर/i,
  problems: /problem|issue|refund|failed|stuck|pending|pay again|ரீஃபண்ட்|சிக்கல்|தோல்வி|रिफ़ंड|रिफंड|दिक्कत|फ़ेल|फेल|अटक/i,
  subs: /subscri|recurring|netflix|spotify|சந்தா|सब्सक्रिप्शन/i,
  lrs: /\blrs\b|tcs|remit|foreign|வெளிநாட்டு|विदेश/i,
  family: /family|mom|dad|everyone|our |குடும்ப|அம்மா|அப்பா|परिवार|माँ|पापा/i,
  left: /left|remain|budget|மீதம்|பட்ஜெட்|बचे|बजट/i,
  spend: /spen|spent|total|how much|செலவு|எவ்வளவு|खर्च|कितना/i,
};

const CATEGORY_WORDS: Record<string, RegExp> = {
  Groceries: /grocer|மளிகை|किराना/i, Bills: /bill|பில்|बिल/i, Shopping: /shop|ஷாப்பிங்|शॉपिंग|खरीदारी/i, Food: /food|உணவு|खाना|खाने/i,
  Subscriptions: /subscri/i, Friends: /friend|நண்பர்|दोस्त/i, Travel: /travel|பயண|यात्रा/i, Other: /\bother\b/i,
};

function priceUsd(q: string): number | null {
  const m = /(?:\$|usd\s*)(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:\$|usd|dollars?|டாலர்|डॉलर)/i.exec(q);
  const n = m ? Number(m[1] ?? m[2]) : NaN;
  return n > 0 && n <= 100_000 ? n : null;
}

export function ruleAnswer(question: string, locale: Locale, ctx: Ctx): Answer {
  const q = question.trim();
  const p = P[locale];
  const log = new ActivityLog();
  const links: Link[] = [];
  const reply = (() => {
    const payload = /(upi:\/\/\S+|https?:\/\/\S+)/i.exec(q)?.[1];
    if (payload) {
      const r = runTool("check_safety", { text: payload.slice(0, 500) }, ctx, log) as { level: "safe" | "caution" | "high"; score: number; signals: string[] };
      links.push({ href: payload.startsWith("upi:") ? "/protect?tool=qr" : "/protect?tool=link", label: "Protect" });
      return `${p.safe[r.level]} (${r.score}/100).${r.signals.length ? `\n• ${r.signals.join("\n• ")}` : ""}`;
    }
    const usd = priceUsd(q);
    if (usd && K.cost.test(q)) {
      const r = runTool("true_cost", { price_usd: usd }, ctx, log) as { methods: { method: string; total_inr: number; cheapest: boolean }[] };
      const best = r.methods.find((m) => m.cheapest) ?? r.methods[0];
      links.push({ href: `/pay?tool=intl&price=${usd}&cur=USD`, label: "Pay" });
      return [p.cost(`USD ${usd}`, best.method, formatInr(best.total_inr * 100)), ...r.methods.map((m) => `• ${m.method}: ${formatInr(m.total_inr * 100)}`)].join("\n");
    }
    if (K.dups.test(q)) {
      const g = runTool("duplicates", {}, ctx, log) as { merchant: string; times: number; extra_inr: number; extra_id: string }[];
      if (!g.length) return p.noDups;
      links.push({ href: "/money?focus=duplicates", label: "Money" }, { href: `/track?tool=dispute&txn=${g[0].extra_id}`, label: "Dispute" });
      return g.map((x) => p.dups(x.merchant, x.times, formatInr(x.extra_inr * 100))).join("\n");
    }
    if (K.subs.test(q)) {
      const s = runTool("subscriptions", {}, ctx, log) as { merchant: string; monthly_inr: number; yearly_inr: number; also_paid_by: string[] }[];
      const m = s.reduce((a, x) => a + x.monthly_inr, 0);
      links.push({ href: "/money?tool=subs", label: "Money" });
      return [p.subs(s.length, formatInr(m * 100), formatInr(m * 1200)), ...s.map((x) => `• ${x.merchant}: ${formatInr(x.monthly_inr * 100)}`), ...s.filter((x) => x.also_paid_by.length).map((x) => p.shared(x.merchant, x.also_paid_by.join(", ")))].join("\n");
    }
    if (K.lrs.test(q)) {
      const l = runTool("lrs", {}, ctx, log) as { used_usd: number; pct: number; inr_before_tcs: number };
      links.push({ href: "/money?tool=lrs", label: "Money" });
      return p.lrs(`USD ${l.used_usd.toLocaleString("en-US")}`, l.pct, formatInr(l.inr_before_tcs * 100));
    }
    const merchant = trackList(ctx.viewer, ctx.now).find((x) => q.toLowerCase().includes(x.p.merchant.toLowerCase()) && x.p.merchant.length > 3)?.p.merchant;
    if (merchant && K.problems.test(q)) {
      const r = runTool("track_payment", { merchant }, ctx, log) as { found: boolean; id: string; inr: number; stage: string; refund_eta: string | null; dont_pay_again: boolean };
      if (!r.found) return p.notFound(merchant);
      links.push({ href: `/track?txn=${r.id}`, label: "Track" });
      return `${merchant} ${formatInr(r.inr * 100)}: ${r.stage}.${r.dont_pay_again ? ` ${p.dontPay(r.refund_eta)}` : ""}`;
    }
    if (K.problems.test(q)) {
      const list = runTool("problems", {}, ctx, log) as { id: string; merchant: string; inr: number; issue: string | null; refund_eta: string | null; dont_pay_again: boolean }[];
      if (!list.length) return p.noProblems;
      links.push({ href: `/track?txn=${list[0].id}`, label: "Track" });
      return [p.problems(list.length), ...list.map((x) => p.problem(x.merchant, formatInr(x.inr * 100), `${p.issue[x.issue ?? "pending"]}${x.dont_pay_again ? `. ${p.dontPay(x.refund_eta)}` : ""}`))].join("\n");
    }
    if (K.family.test(q)) {
      const f = runTool("family", {}, ctx, log) as { name: string; total_inr: number }[];
      links.push({ href: "/family", label: "Family" });
      return `${p.family(f.map((m) => `• ${m.name}: ${formatInr(m.total_inr * 100)}`).join("\n"))}\n${p.privateNote}`;
    }
    const cat = Object.keys(CATEGORY_WORDS).find((c) => CATEGORY_WORDS[c].test(q));
    if (cat || K.left.test(q) || K.spend.test(q)) {
      const s = runTool("spending", { category: cat }, ctx, log) as { total_inr: number; payments: number; budgets: { category: string; spent_inr: number; limit_inr: number; pct: number }[] };
      links.push({ href: cat || K.left.test(q) ? "/money?tool=budgets" : "/money", label: "Money" });
      if (cat && s.budgets[0]) { const b = s.budgets[0]; return p.cat(b.category, formatInr(b.spent_inr * 100), formatInr(b.limit_inr * 100), b.pct); }
      if (K.left.test(q)) {
        const all = budgets(ctx.viewer);
        const limit = all.reduce((a, b) => a + b.limitPaise, 0), spentP = all.reduce((a, b) => a + b.spentPaise, 0);
        const hot = all.filter((b) => b.state !== "ok").map((b) => `${b.category} ${b.pct}%`);
        return `${p.left(formatInr(Math.max(0, limit - spentP)), formatInr(limit))}${hot.length ? ` ${p.over(hot.join(", "))}` : ""}`;
      }
      return p.spent(formatInr(s.total_inr * 100), s.payments);
    }
    return p.help;
  })();
  log.emit("assistant", "result", "Explained the answer");
  return { reply, agents: log.used, links, source: "rules" };
}
