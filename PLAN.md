# PayHub AI: Hackathon Upgrade Plan

**Build day:** 2026-11-10, one day, must finish the same day.
**Devpost deadline:** Nov 12, 2026, 12:00 pm PST (video <3 min, public repo, live demo link).
**Source of truth for features:** `PRD.md` (F1.1–F6.3). Do not remove any existing feature.

## Rules for the whole build
- Every button and calculator works. Zod validation, readable error messages, loading and empty states.
- Status label on every feature: `Live`, `Interactive demo`, `Prototype`, `Coming soon`.
  Simulated bank flows say "Simulated – no bank connected". Never imply a real bank integration.
- Works on mobile (390px) and desktop. Bottom nav on mobile, sidebar on desktop.
- Languages: English, Tamil, Hindi.
- Look: dark navy, electric blue, glass cards, smooth motion, themed charts.

## Six sections
| Section | Contents | Request # |
|---|---|---|
| 1. Pay | Checkout Copilot, Smart Payment Router (UPI / card / PayPal / forex card: availability, fees, final cost), International Calculator (rate, bank markup, shipping, customs duty, GST, final INR), Large Payment check (UPI limits, NEFT/RTGS/IMPS, beneficiary check, fee table) | 5, 6, 9 |
| 2. Protect | Payment-link checker, QR risk scan, fake collect-request warning, OTP scam awareness, Merchant Trust Score | 4 |
| 3. Track | Payment Tracker (txn ID, status, amount debited, refund progress, estimated refund date, "Don't pay again"), Proof Vault (receipts, screenshots, invoices, txn IDs), dispute builder + PDF | 3, 11 |
| 4. Money | Categories, monthly summary, subscriptions, duplicate-payment detection, budgets, savings goals, accounts and net worth, LRS tracker | 8 |
| 5. Family | Individual / Family / Private views, privacy settings for each member, member spending bars | 7 |
| 6. AI | AI Command Centre (agents, activity, status, agent-to-agent messages) + chat assistant with access to every module | 1, 2, 10 |

Cross-cutting: languages (12), status labels (13), UI upgrade (14), Demo Mode (15).

## Connected agents
Fraud, FX/Cost, Budget → Router → Verdict → Payment → Tracker → Proof → Dispute, with the Assistant able to call all of them.
Each agent is a typed function in `src/lib/agents/` that emits events to a shared activity log; the Command Centre renders that log.
Example: risky QR scanned → Fraud flags it → Router blocks that method → Assistant explains why.

## Schedule for the build day (timeboxed)
| Time | Block | Done when |
|---|---|---|
| 09:00–10:00 | **Foundation:** six-section nav (mobile + desktop), status-label component, i18n setup (EN/TA/HI), dark navy theme tokens | All six sections reachable, language switch works |
| 10:00–11:00 | **Demo Mode data:** ~60 transactions incl. failed payment, pending refund, duplicate charge, scam QR, two family members; scenario picker | Judges can load a scenario in one tap |
| 11:00–12:30 | **AI layer:** agent functions + activity log, Command Centre page | Feed shows agents handing off results |
| 12:30–13:00 | Lunch | |
| 13:00–14:30 | **Pay:** Router + International Calculator + Large Payment check | All calculators validate and compute |
| 14:30–15:30 | **Protect:** link checker, QR scan (camera or uploaded image), collect-request simulator, OTP quiz | Scam QR scenario triggers warnings |
| 15:30–16:30 | **Track:** Payment Tracker + Proof Vault + dispute draft/PDF | Pending-refund scenario shows timeline and "Don't pay again" |
| 16:30–17:30 | **Money + Family:** duplicates, subscriptions, budgets, goals, monthly summary, privacy settings for each member | Private items hidden in Family view |
| 17:30–18:30 | **Assistant:** chat with tools (Gemini if `GEMINI_API_KEY` set, Claude as alternative, rule-based fallback otherwise), replies in 3 languages | Assistant answers using module data |
| 18:30–19:30 | **Polish:** glass cards, motion, chart styling, loading/error states | |
| 19:30–20:30 | **QA + deploy:** build, mobile + desktop click-through of every section, console clean, deploy to Netlify | Live site passes the click-through |

**If running late, cut in this order:** Hindi/Tamil for AI replies (keep the interface translated) → QR camera (keep image upload) → animations. Label anything cut as `Prototype`.

## Needed before starting
- [ ] `GEMINI_API_KEY` in Netlify env (Gemini provider still to build in `verdict.ts` / `chat.ts`), or accept a rule-based assistant (labelled).
- [ ] Netlify deploy path: link the GitHub repo, or approve CLI `netlify deploy --prod`.
- [ ] Teammate's 33-feature list, to cross-check against `PRD.md`.

---

# Previous plan and handoff (v1 MVP, kept for reference)


## Context
Folder has PRD, TECH_STACK, DESIGN, BUILD_PROMPT (no code). Target: PayPal AI Hackathon. User needs it done in **1 day**.

## Verified facts (web-checked)
- Deadline **Nov 12, 2026, 12:00 pm PST** ([Devpost rules](https://paypalaihackathon.devpost.com/rules), [PayPal blog](https://developer.paypal.com/community/blog/PayPal_AI_Hackathon/)). Re-read rules page before submitting.
- Required: working demo/link, public open-source repo, public YouTube video <3 min, description.
- Judging, equal weight: technical implementation (PayPal + AI depth), design, impact, innovation, presentation.
- INR not usable in sandbox (`CURRENCY_NOT_ALLOWED`, India-only domestic). **Charge USD**, show INR as converted true cost.

## Verdict
Stack works. Full PRD does NOT fit 1 day. Build ONE polished vertical slice; everything else cut.

## 1-day MVP (only this)
1. **Pay screen**: link+price+item form → true-cost table (3 methods, USD→INR, config-driven, unit-tested) + trust score (rules) + AI verdict (Claude JSON, rule fallback).
2. **PayPal sandbox**: server create order (USD, `PayPal-Request-Id`), `@paypal/react-paypal-js` buttons, server amount re-check + capture. Mock provider if keys missing.
3. **Tag sheet**: Me/Family/Private → saves txn + simple proof receipt (on-screen; PDF only if time).
4. **Hub**: Individual/Family toggle, 3 summary cards, donut, budget bars. Seeded family (Me/Mom/Dad, ~30 txns) with private items.
5. **privacy.ts + tests** (private amount counted, details shown as "Personal – Other").
6. **Chat agent**: Claude tool-use, 3 tools (`get_transactions`, `calculate_true_cost`, `budget_summary`), finance-only prompt, streaming.
7. **Webhook** route with `verify-webhook-signature` + rejection unit test (real verification works once deployed).

**Cut entirely:** auth/signup (cookie "Try demo family" only), credits, languages, calendar, LRS, goals, funds, large-payment guard, invites, delete-data, dispute tool, Playwright, dark mode (if tight), PDF.

## Simplified stack (speed)
Next.js + TS + Tailwind (skip shadcn unless quick), Recharts, Zod, libSQL/Drizzle (Turso for deploy), `@anthropic-ai/sdk`, signed-cookie session instead of Auth.js, Vitest.

## Hour plan (~14h)
- H0–1: keys (PayPal sandbox app + webhook, Anthropic), scaffold, `.env`, config.ts, schema, seed. Smoke-test a USD sandbox order.
- H1–3: truecost.ts + tests, fx (static fallback), risk.ts, verdict API.
- H3–6: Pay UI → PayPal create/capture → tag sheet → txn+receipt.
- H6–8: privacy.ts + tests, Hub UI.
- H8–10: chat agent (3 tools), webhook route.
- H10–12: Deploy Vercel+Turso, set webhook URL + env, test real payment on live URL.
- H12–14: README (real vs simulated, setup), public repo (no secrets, `.env.example`), record <3 min video, submit on Devpost (leave buffer before noon PST).

## Rules to avoid mistakes
- No PayPal logos; footer "Independent demo built on the PayPal developer platform."
- Label simulated bits with Demo badge; "estimate" wording; no "scam" claims.
- Money in integer minor units; secrets server-only; never fetch user URLs; user text = untrusted in prompts.
- Check each library's current docs; don't invent endpoints.
- Run `pnpm typecheck lint test build` before deploy.

## Verification
- Unit tests: true cost, privacy matrix, amount mismatch, webhook rejection.
- Manual: zero-key mock run; real sandbox pay + real Claude locally; same on deployed URL in <90s; video <3 min; repo public, no secrets.

## Session Handoff (2026-11-08)

**State:** H0–H10 done, committed locally (no remote yet). Mock mode works end to end. UI redesign done but **uncommitted** (see below).

**Commits (local git, `master`)**
- `85f489f` scaffold Next.js 16 + deps
- `b3c4adf` true cost, FX, trust score, AI verdict API
- `3710866` PayPal checkout (orders/capture), tag sheet, proof receipt, DB + seed, demo login
- `8e8c8a8` privacy.ts + Money Hub (`/hub`)
- `50dcfee` chat agent (`/api/ai/chat`, `/chat`), tools read via `familyMonth`/`shapeForViewer`, rule fallback
- `61950e3` `/api/paypal/webhook` with verify-webhook-signature; unverified → 401

**Uncommitted: UI redesign (passbook look)**
- Palette in `globals.css`: ink indigo `#1B2559`, paper `#F4F6F8`, rupee teal accent `#0F7A64`, marigold warn, sindoor bad, lavender private; dark mode too. Font Schibsted Grotesk. `.amount` class = big ₹ figure, the one loud element per screen.
- shadcn-style primitives: `src/components/ui/{button,card,input}.tsx` (`Section` = hairline-rule section, not boxed card), `cn()` in `src/lib/utils.ts`. New deps: `clsx`, `tailwind-merge`, `class-variance-authority`.
- lucide icons throughout; `src/components/nav-links.tsx` (active-tab nav, client).
- Home hero = live true-cost receipt ($129.99 → ₹ by method, computed via `trueCost` at fallback rate). Hub leads with big monthly ₹ + budget bar; "Just me / Whole family" toggle. Checkout leads with ₹ total then method table. Chat: suggestion list, AI avatar, sticky composer. Tag sheet: icon buttons, receipt shows ₹ first. Chart colours retuned.
- Checked: typecheck + eslint clean; `/`, `/pay`, `/hub`, `/hub?view=family`, `/chat` return 200 with demo session. Not yet checked visually in a browser.

**How to run:** `npm install` → `npm run setup` (db push + seed) → `npx next dev`. Checks: `npm test` (36 pass), `npm run typecheck`, `npx eslint src tests scripts`, `npm run build`.

**Decisions made**
- 1-day MVP vertical slice; everything else cut.
- Charge USD in PayPal sandbox; show INR true cost.
- Signed-cookie "Try demo family" login (u_me / u_mom / u_dad), not Auth.js.
- npm instead of pnpm (pnpm not installed).
- PayPal JS SDK v6 via `@paypal/react-paypal-js/sdk-v6` (`PayPalProvider` + `PayPalOneTimePaymentButton`).
- Next 16 `cacheComponents` is on: cookie reads wrapped in `<Suspense>` in layout; pages using `new Date()` call `await connection()`.
- Untagged txns treated as Private for other members (PRD silent).
- Chat replies are JSON, not streamed (simpler; revisit if time).
- Commits carry both Co-authored-by (Gopinath2638) and Claude trailers.
- Real data for hackathon: use real keys only (PayPal sandbox + free AI); keep seeded family data, labelled. Skip PayPal Transaction Search (~3h lag) and Account Aggregator (weeks). Statement CSV import = stretch only.
- AI provider: switch to **Gemini free tier** (`GEMINI_API_KEY`, `gemini-2.5-flash`); keep Claude as alternative and rule fallback.

**Verified**
- Mock flow via curl: session → verdict (live FX) → order → capture → repeat capture idempotent → tag → proof.
- Privacy on dev server: Mom's family view hides my private items as "Personal – Other".

**Not verified**
- Real PayPal sandbox payment, real Claude calls (verdict + chat tool loop), real webhook delivery (no keys yet).
- UI in a real browser (layout, mobile, dark mode, chart rendering).

**Open items**
- Need from user in `.env` (user adds them, never pasted in chat): `GEMINI_API_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_WEBHOOK_ID`.
- Gemini support not built yet: `src/lib/verdict.ts` and `src/lib/chat.ts` only call Anthropic; `layout.tsx` "Rule-based AI" badge checks only `ANTHROPIC_API_KEY`.
- Re-read Devpost rules page (prize, IP, eligibility).
- Seed has 30 txns this month only (PRD wants ~60 over two months + one failed payment); fine for MVP.
- Add git remote and push when user gives repo URL.

**Next steps:** (1) commit UI redesign; (2) add Gemini provider to verdict + chat (tool loop) with rule fallback; (3) user adds keys → real sandbox payment + AI smoke test + browser UI check; (4) deploy (Vercel + Turso), register webhook URL in PayPal sandbox.

**Notes:** AGENTS.md asks for caveman-style chat replies and Conventional Commits with the specified Co-authored-by trailer.

---

## Session Handoff (2026-11-09)

**State:** v1 MVP live at https://payhub-ai-demo-gopinath.netlify.app (PWA, payments-app look). Remote: github.com/goprocker/PaypalHackathon, branch `main`.

**Done today**
- Mobile check at 390px on live site: no horizontal overflow on `/`, `/switch`, `/pay`, `/hub`, `/hub?view=family`, `/chat`. Only issues: Netlify badge covering bottom nav, 16x16 duty checkbox on `/pay`.
- Fixed both in `3ddf02e` (pushed): nav `max-md:pb-[calc(env(safe-area-inset-bottom)+3.5rem)]`, app shell `max-md:pb-42`, checkbox label `min-h-11`, box `size-5`. `npm run build` passes.
- Wrote the upgrade plan at the top of this file (six sections, connected agents, timeboxed schedule).
- `3ddf02e` still not live (Netlify not linked to GitHub; manual CLI deploys).

- Plan committed (`1c77f40`).
- **Block 1 Foundation** (`c2e7108`): six-section nav (bottom nav mobile, glass sidebar md+ with Home), pages `/protect` `/track` `/money` `/family` `/ai` listing features with status labels (existing screens linked as Live, rest "Coming soon"), `StatusLabel` component (`src/components/status-label.tsx`), i18n EN/TA/HI (`src/lib/i18n/dict.ts`, `getT()` in `src/lib/i18n/server.ts`, cookie `payhub_lang`, `POST /api/lang`, picker in top bar), dark navy single theme + `.glass` utility in `globals.css`. `SectionPage` component in `src/components/section-page.tsx`.
- **Block 2 Demo Mode** (`50c5212`): `src/lib/demo/data.ts` = 58 payments (Arun/Mom/Dad) with method, txnId, payee VPA, status, private flag; scenario rows `s_failed`, `s_refund`, `s_refunded`, `s_dup1/2`, `s_pending`, `s_forex`, `s_rejected`; `SCAM_QR` / `SAFE_QR`; six `SCENARIOS` with target hrefs (`/track?txn=…`, `/money?focus=duplicates`, `/protect?qr=scam`, `/family`, `/pay`). `POST /api/demo` sets cookie `payhub_scenario` (auto-signs in as `u_me`), `activeScenario()` in `src/lib/demo/server.ts`, `/demo` page with picker, banner + exit in layout, Demo Mode link on Home. Test `tests/demo.test.ts`.
- **Block 3 AI layer**: `src/lib/agents/log.ts` (`ActivityLog`, `AGENTS`, `AGENT_INFO`, event kinds start/result/handoff/warn/block), `agents.ts` (Fraud QR/link/collect, FX cost, Budget + `findDuplicates`, Router blocks unsafe methods, Verdict via `ruleVerdict`, simulated Payment, Tracker with refund ETA + "Don't pay again", Proof, Dispute draft, Assistant explain), `workflows.ts` (`runWorkflow(id, {usdInr, now})` for scam_qr, safe_qr, international, failed, refund, duplicate, family). Command Centre at `/ai/command?run=<id>` (defaults to active scenario), linked from `/ai` as Interactive demo. `cc.*` strings in EN/TA/HI. Test `tests/agents.test.ts`. International lamp correctly gets NOT WORTH IT (Shopping 157%), so Payment holds it.
- **Block 4 Pay**: `src/lib/pay.ts` (Zod inputs + `intlCost`, `smartRoute`, `largeCheck`, `RAILS` limits/fees, `zodMessages`), `getInrRates()` in `fx.ts` (USD/EUR/GBP/SGD/AUD, Frankfurter, fallback table), client tools in `src/components/pay/tools.tsx`, `/pay?tool=copilot|router|intl|large` tabs with status labels (Copilot needs sign-in, others don't). Router: `?risky=1` pre-flags payee. International scenario now opens `/pay?tool=intl&price=85&cur=USD`. Limits used: UPI ₹1L (₹5L tax/hospital/education), new UPI payee ₹5k first 24h, IMPS ₹5L, RTGS min ₹2L; all labelled as typical, bank may differ. Test `tests/pay.test.ts`.
- **Block 5 Protect**: `src/lib/protect.ts` (`parseUpi`, `checkQr` via Fraud agent, `checkPaymentLink` for https + upi links: shorteners, @ tricks, .apk, lure words; `COLLECT_REQUESTS` + `judgeCollect`; `merchantTrust` for website or UPI ID using payment history; `OTP_QUIZ`). UI `src/components/protect/tools.tsx`; `/protect?tool=link|qr|collect|otp|trust`, `?qr=scam|safe` opens QR tab with result. QR: image upload + camera, both decoded with `jsqr@1.4.0` (new dep) on a canvas; jsQR decode of the scam payload verified in node. High-risk results link to `/pay?tool=router&risky=1`. Test `tests/protect.test.ts`. Camera path not tried on a real phone.
- **Block 6 Track**: `src/lib/track.ts` (`trackList` problem-first per member, `duplicateIds`, `issueFor`, `timeline` with est. credit date, `buildDispute` via Proof + Dispute agents, `clock()` to satisfy react-hooks/purity lint). `/track?tool=tracker|vault|dispute&txn=<id>`: tracker shows "Don't pay again", amount debited, txn ID, refund steps + ETA, Build dispute / Add proof. Proof Vault: auto receipts for every payment + screenshot/invoice/PDF uploads (≤1.5 MB) kept in this browser's localStorage (`payhub_vault`). Dispute: editable draft, copy text, Download PDF via `jspdf@4.2.1` (new dep, dynamic import, ₹ → "Rs." since base fonts lack it). Viewer = signed-in member, else Arun. Test `tests/track.test.ts`.
- Checks: 62 tests, typecheck, `npx eslint src tests`, `next build` all pass. Verified by curl on `next start`, NOT visually in a browser yet.
- Nothing pushed, nothing deployed since `3ddf02e`.

**Decisions from user (2026-11-09)**
- Gemini key: later. Keep rule-based assistant until then.
- Deploy: approved CLI `npx netlify deploy --build --prod` (do it in QA block).
- Teammate's 33-feature list: proceed without it; cross-check when it arrives.

**Remaining blocks, in order** (target screens must read `DEMO_PAYMENTS` and honour scenario query params)
3. ~~AI layer~~ done. Block 8 Assistant should call `src/lib/agents/agents.ts` functions as its tools.
4. ~~Pay~~ done.
5. ~~Protect~~ done.
6. ~~Track~~ done.
7. Money + Family: duplicates (`?focus=duplicates`), subscriptions, budgets, goals, net worth, LRS; per-member privacy settings.
8. Assistant: chat with tools over all modules, replies in 3 languages (rule-based now).
9. Polish, then QA (390px + desktop click-through, console clean) and deploy.
Then flip each feature's status label from "Coming soon" as it ships. Only top bar, nav, section headers, footer are translated so far; new UI strings go in all three dicts.

**Notes:** `npm run lint` also scans `.agents/` bundles (thousands of unrelated errors); lint with `npx eslint src tests`. Stop test servers by port, not `taskkill node.exe` (blocked).

**Testing note:** Chrome `resize_window` did not shrink the viewport; test mobile by injecting a 390x844 same-origin iframe and measuring `scrollWidth` / element rects / tap-target sizes.
