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

**State:** Planning only. No code written. Folder holds PRD.md, TECH_STACK.md, DESIGN.md, BUILD_PROMPT.md, PLAN.md.

**Decisions made**
- 1-day MVP vertical slice (see "1-day MVP"); everything else cut.
- Charge USD in PayPal sandbox (INR gives `CURRENCY_NOT_ALLOWED`); show INR as converted true cost.
- Signed-cookie "Try demo family" login instead of Auth.js.
- Deadline: Nov 12, 2026, 12:00 pm PST. Needs public repo, demo link, public YouTube video under 3 min.

**Open items**
- User has not yet approved starting the build.
- Need PayPal sandbox app (client id, secret, webhook id) and Anthropic API key from user.
- Re-read the Devpost rules page for prize, IP and eligibility terms (not fully verified).
- BUILD_PROMPT.md still says "one run, no questions" with the full scope; update it to match this plan or ignore it.

**Next step:** On approval, scaffold the Next.js app, then follow the hour plan from H0.

**Notes:** AGENTS.md asks for caveman-style chat replies and Conventional Commits with the specified Co-authored-by trailer.
