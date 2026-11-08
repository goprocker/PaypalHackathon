# PayHub AI: Tech Stack

PayHub AI is an independent app built on the PayPal developer platform. It is not PayPal and must not use PayPal logos or claim affiliation.

## Principles
1. One repo, one command to run. The app must start locally with **zero API keys** in **mock mode**.
2. With keys set, PayPal **sandbox** payments and **Claude** calls are real.
3. Money math and privacy rules are enforced **on the server** and covered by tests.
4. Secrets live only in server environment variables.
5. Pin exact versions when scaffolding and check current docs for each library. Never invent API endpoints.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js 20+, pnpm | Fast, standard |
| Framework | Next.js (App Router), React, TypeScript (strict) | Full-stack in one project, easy deploy |
| Styling | Tailwind CSS + shadcn/ui (Radix), lucide-react icons | Fast, accessible components |
| Charts | Recharts | Donut, bar, progress visuals |
| Data fetching | Server Components, route handlers, TanStack Query for client lists | Simple and predictable |
| Validation | Zod | One schema for API input, AI tool output and env vars |
| Database | libSQL (SQLite) via `@libsql/client` | `file:./dev.db` locally, Turso in production, same driver |
| ORM | Drizzle ORM + drizzle-kit migrations | Typed, light, additive migrations |
| Auth | Auth.js (next-auth v5), Credentials provider, JWT sessions | Works offline; seeded demo users plus sign-up |
| Payments | PayPal REST Orders v2 (server-side fetch) + `@paypal/react-paypal-js` buttons | Official sandbox flow |
| Webhooks | PayPal `verify-webhook-signature` endpoint | Signature verification before trusting events |
| AI | `@anthropic-ai/sdk`, tool use, streaming responses | Real agent with tools; model name from `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`) |
| FX rates | Frankfurter API (free, no key), cached in DB, static fallback | Live rates with safe fallback; verify endpoint in its docs |
| PDF receipts | `pdf-lib` | Server-side proof receipts |
| Tests | Vitest (unit), Playwright (one end-to-end smoke test) | Cover money, privacy, webhooks |
| Quality | ESLint, Prettier, TypeScript strict | Clean code |
| Deploy | Vercel + Turso | Simple hosting with persistent DB |

## Environment variables (`.env.example`)
```
DATABASE_URL=file:./dev.db
DATABASE_AUTH_TOKEN=
AUTH_SECRET=change-me
APP_URL=http://localhost:3000
PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-5-5
FX_API_URL=https://api.frankfurter.dev/v1
```
If `PAYPAL_*` is empty the app uses a clearly labelled **mock payment provider**. If `ANTHROPIC_API_KEY` is empty it uses **rule-based fallbacks**. Both show a visible "Mock mode" badge.

## Folder structure
```
src/
  app/
    (auth)/login, signup
    (app)/home, pay, hub, chat, receipts, family, settings
    api/paypal/{orders,capture,webhook}
    api/ai/{verdict,chat}
    api/{transactions,tags,budgets,goals,subscriptions,receipts,family,credits}
  lib/
    config.ts          editable assumptions: markups, duty, limits, budgets
    db/                schema.ts, client.ts, queries.ts
    auth.ts
    paypal.ts          token, create order, capture, verify webhook, mock provider
    fx.ts              rates with cache and fallback
    truecost.ts        pure functions, fully tested
    risk.ts            trust score rules (no fetching of external pages)
    privacy.ts         single place that shapes data per viewer
    agent/             system prompt, tool definitions, tool handlers, runner
    credits.ts
  components/          ui/, charts/, dashboard/, checkout/, chat/
drizzle/               migrations
scripts/seed.ts        demo family and about 60 transactions
tests/                 unit and e2e
```

## Security choices
- Amounts stored as **integer minor units** (paise and cents) with a currency code.
- PayPal order amount and currency are re-checked on the server before capture. `PayPal-Request-Id` is used for idempotency.
- All privacy shaping goes through `lib/privacy.ts`. No route returns raw rows to other family members.
- Rate limiting on AI and payment routes. Zod on every input. Output escaped by React.
- The app never fetches arbitrary URLs (no server-side request forgery). Product links are only parsed for host and path.
- Merchant text, product names and user notes are treated as **untrusted data** in AI prompts, never as instructions.
- No card numbers or bank details are stored. A "Delete my data" action is included.
