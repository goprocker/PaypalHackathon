You are a principal full-stack engineer with deep experience in payments (PayPal Orders v2, webhooks, sandbox), AI agents with tool use, secure TypeScript apps and polished fintech UI. Build the complete app described in this folder in ONE run.

READ FIRST, in this order: PRD.md, TECH_STACK.md, DESIGN.md. They are the source of truth. If they conflict, PRD.md wins for behaviour, DESIGN.md for look and feel, TECH_STACK.md for tools.

OUTPUT
A working Next.js (TypeScript) app named "PayHub AI" in the current folder, runnable with:
  pnpm install && pnpm db:migrate && pnpm db:seed && pnpm dev
It must start with ZERO API keys in clearly badged mock mode, and use the real PayPal sandbox and real Claude when the keys in .env are set.

HOW TO WORK
1. Do not stop to ask me questions. If something is unclear, choose the simplest reasonable option and record it in ASSUMPTIONS.md.
2. Scaffold the project, pin exact dependency versions, and check each library's current official docs before using its API. Never invent endpoints, fields or function names. For PayPal use the official Orders v2 and webhook-verification documentation.
3. Implement every requirement F1 to F6 in PRD.md: Checkout Copilot, PayPal sandbox payment (with mock provider), tagging and proof receipts (with PDF), Money Hub dashboard, finance chatbot with the eight agent tools, AI credits, accounts and family.
4. Implement the design exactly as in DESIGN.md: tokens as CSS variables with light and dark mode, all listed components and screens, loading, empty and error states, accessibility rules.
5. Put every assumption (FX markups, duty, limits, budgets) in src/lib/config.ts. Store money as integer minor units.
6. Enforce the privacy matrix on the server only through src/lib/privacy.ts. No API route may return another member's private details. A private amount is always included in family totals.
7. Treat product names, merchant text and user notes as untrusted data in all AI prompts. Never fetch arbitrary URLs.
8. Seed the demo family (about 60 transactions, private items, one failed payment, subscriptions, goals, budgets) so every screen has data at first load. Add one-tap "Try demo family" login.
9. Label every simulated feature with the DemoBadge and list them in the README. Never claim real bank or UPI integration. Never use PayPal logos. Show the required disclaimers (tax and LRS estimates, fund ideas, demo features).

TESTS (write them, then run them)
- Unit tests: true cost math for each method; privacy matrix for every tag and viewer; webhook signature rejection; amount mismatch rejection before capture; budget colour thresholds; subscription cost-per-hour verdict.
- One Playwright smoke test: demo login, run a checkout in mock mode, tag as Family, see the dashboard update.

QUALITY GATES (run them and fix everything before you finish)
pnpm typecheck, pnpm lint, pnpm test, pnpm build must all pass. Start the dev server and verify each screen loads without console errors.

DELIVERABLES
- The full app source with migrations, seed script and .env.example.
- README.md: what it is, real vs simulated table, setup steps, how to get PayPal sandbox credentials and an Anthropic API key, how to run tests, how to deploy (Vercel + Turso), and the 60-second demo flow.
- ASSUMPTIONS.md.
- A final report in the terminal: what works, what is simulated, any known gaps, and the exact commands to run.

Begin now.
