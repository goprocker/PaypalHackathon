# PayHub AI – 1-Day Hackathon Plan

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

**State:** H0–H10 done, committed locally (no remote yet). Mock mode works end to end. Context used ~13% (128k/1M).

**Commits (local git, `master`)**
- `85f489f` scaffold Next.js 16 + deps
- `b3c4adf` true cost, FX, trust score, AI verdict API
- `3710866` PayPal checkout (orders/capture), tag sheet, proof receipt, DB + seed, demo login
- `8e8c8a8` privacy.ts + Money Hub (`/hub`)
- `50dcfee` chat agent (`/api/ai/chat`, `/chat`), tools read via `familyMonth`/`shapeForViewer`, rule fallback
- `61950e3` `/api/paypal/webhook` with verify-webhook-signature; unverified → 401

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

**Verified**
- Mock flow via curl: session → verdict (live FX) → order → capture → repeat capture idempotent → tag → proof.
- Privacy on dev server: Mom's family view hides my private items as "Personal – Other".

**Not verified**
- Real PayPal sandbox payment, real Claude calls (verdict + chat tool loop), real webhook delivery (no keys yet).
- UI in a real browser (layout, mobile, dark mode, chart rendering).

**Open items**
- Need from user in `.env`: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_WEBHOOK_ID`, `ANTHROPIC_API_KEY`.
- Re-read Devpost rules page (prize, IP, eligibility).
- Seed has 30 txns this month only (PRD wants ~60 over two months + one failed payment); fine for MVP.
- Add git remote and push when user gives repo URL.

**Next step:** H10–12 deploy (Vercel + Turso), register webhook URL in PayPal sandbox, then real-key smoke test + browser UI check.

**Notes:** AGENTS.md asks for caveman-style chat replies and Conventional Commits with the specified Co-authored-by trailer.
