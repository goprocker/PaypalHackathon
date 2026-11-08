# PayHub AI: Product Requirements Document

## 1. Summary
PayHub AI is an AI money companion built on PayPal sandbox payments. It checks a payment **before** it happens (true cost, risk, worth), records it **after** (what and for whom, with proof), and explains it **over time** (individual and family dashboards, budgets, subscriptions, finance chat). Target: the PayPal AI Hackathon ("Build What's Next with PayPal and AI"). The project must meaningfully use both PayPal and AI.

## 2. Problems
- **Everyday:** failed payments with no status, scams, unsupported methods, surprise total costs, forgotten subscriptions, painful disputes.
- **Money management:** no view of where money goes, personal and family spending mixed, impulse buying, wasted subscriptions, no budget habit, emotional big decisions, idle money.
- **Large payments (India):** transaction limits, failures and delays, fraud, bank holds, wrong recipient, fees, records for tax, missing proof.
- **International:** FX markup, dynamic currency conversion, high fees, slow settlement, declines, LRS and TCS awareness, cross-border fraud, differing payment systems, language barriers.

## 3. Users
- **Student or young earner (primary):** buys from overseas sites, wants to stop overspending.
- **Parent or family manager:** wants one view of household spending without exposing everyone's private items.
- **Freelancer or small seller:** receives and sends cross-border payments, needs proof and records.
- **Elder family member:** needs scam warnings and plain-language status.

## 4. Goals and non-goals
**Goals:** real PayPal sandbox payment end to end; useful AI verdicts and chat grounded in the user's data; a dashboard that explains spending in plain words; privacy rules enforced on the server; honest labelling of anything simulated.
**Non-goals:** real UPI or bank integration, real investment advice, tax filing, production-grade fraud detection, native mobile apps, live-money payments.

## 5. Functional requirements

### F1 Checkout Copilot
- F1.1 User enters product link (host and path only are parsed, never fetched), item name, price, shipping, currency.
- F1.2 True cost per method (PayPal balance, Indian credit card, forex card) in INR, including FX markup, fees, shipping and duty estimate. Cheapest highlighted. Shows saving from paying in merchant currency instead of INR.
  *Acceptance:* unit tests cover each method; all rates, markups and duty come from `config.ts`; UI says "estimates based on assumptions".
- F1.3 "What is this for?" pop-up with category chips and free text.
- F1.4 AI verdict (GOOD FOR YOU / THINK AGAIN / NOT WORTH IT) with a one-line reason using category budget used, recent similar purchases, goals, and for subscriptions cost per hour and overlap. Returned as validated JSON; falls back to rules if the AI fails.
- F1.5 Merchant Trust Score 0 to 100 from rules (secure link, domain pattern, suspicious words, known stores) plus an AI explanation. Wording: "high risk signals", never "this is a scam".
- F1.6 Pre-payment checklist: pay in merchant currency, international usage enabled on card (Demo).
- F1.7 Large-payment guard: above a configured amount or for a new recipient, show a pause, an "Are you sure?" step and a suggested mode (UPI, IMPS, NEFT, RTGS, card) from a limits config. Marked Demo.
- F1.8 Subscriptions show a red or green worth-it badge.

### F2 PayPal sandbox payment
- F2.1 Server creates an order (Orders v2) with `PayPal-Request-Id`; browser shows PayPal buttons; server captures after approval.
- F2.2 Server re-validates amount and currency before capture. Handles approve, cancel, error, duplicate clicks.
- F2.3 Webhook endpoint verifies the signature, then updates transaction status (completed, pending, failed, refunded). Unverified events are rejected and logged.
- F2.4 Mock provider used when keys are missing, clearly badged.

### F3 Tagging and proof
- F3.1 After payment: "What did you buy?" and "Who is this for?" (Me / Family / Private).
- F3.2 Proof receipt auto-created: transaction id, amount, rate used, fees, time, item, recipient. Immutable. PDF export.
- F3.3 Privacy matrix below is enforced in `lib/privacy.ts`.

| Tag | Owner sees | Other family members see | In Family totals |
|---|---|---|---|
| Me | Full detail | Own purchases appear under the owner's name only | Counted under owner |
| Family | Full detail | Full detail | Counted |
| Private | Full detail | "Personal – Other", no item, no merchant | Amount included |

An amount is **never** hidden from the family total.

### F4 Money Hub dashboard
- F4.1 Individual | Family toggle.
- F4.2 Summary cards: spent this month, budget left, predicted month-end balance, spending score (0 to 100).
- F4.3 AI monthly summary in plain words (for example "54% groceries, 34% extras, 9% friends").
- F4.4 Donut chart by category; member bars (Family view); spending calendar with day detail.
- F4.5 Budgets: AI-suggested limits from history; amber at 80%, red at 100%.
- F4.6 Accounts with balances and net worth (sample accounts, labelled).
- F4.7 Goal accounts (target, deadline, progress, monthly amount needed).
- F4.8 Subscriptions panel with red/green badges, cost per hour and renewal dates.
- F4.9 Foreign spending tracker against the LRS USD 250,000 limit, labelled "estimate, verify with your bank or CA".
- F4.10 Payment tracker: plain-language status, settlement estimate (Demo), refund countdown, "Do not pay again" when relevant.

### F5 Finance chatbot and agent
- F5.1 Server-side Claude with a finance-only system prompt; politely declines other topics.
- F5.2 Tools: `get_transactions`, `tag_transaction`, `calculate_true_cost`, `risk_check`, `budget_summary`, `predict_balance`, `score_subscription`, `create_dispute_draft`. Inputs and outputs validated with Zod; every call logged.
- F5.3 Big-decision help (for example buying a bike): compares options over 10 to 20 years with explicit assumptions and numbers, checks income and emergency fund, gives a clear recommendation.
- F5.4 Fund ideas by type (index, debt, liquid, ELSS) with reason, risk, horizon and projection from sample data, always with "Educational suggestions, not licensed investment advice."
- F5.5 Replies in English, Tamil or Hindi. Can draft a dispute message with the saved proof.
- F5.6 AI credits: free monthly quota, cost shown before each AI action, top-up via a PayPal sandbox order.

### F6 Accounts and family
- F6.1 Sign up, sign in, demo users. F6.2 Family group with invitation. F6.3 Delete my data.

## 6. Data model (summary)
`users`, `family_groups`, `memberships`, `accounts`, `transactions` (amount_minor, currency, fx_rate, fees_minor, status, tag, category, item, merchant, paypal_order_id, owner_id), `proofs`, `budgets`, `goals`, `subscriptions`, `ai_usage`, `audit_log`, `fx_cache`. Every query is scoped by user and family membership.

## 7. API routes (summary)
`POST /api/paypal/orders`, `POST /api/paypal/capture`, `POST /api/paypal/webhook`, `POST /api/ai/verdict`, `POST /api/ai/chat` (streaming), `GET/POST /api/transactions`, `POST /api/tags`, `GET/PUT /api/budgets`, `GET/POST /api/goals`, `GET /api/subscriptions`, `GET /api/receipts/:id/pdf`, `POST /api/family/invite`, `GET/POST /api/credits`, `DELETE /api/me`.

## 8. Real versus simulated
| Real | Simulated and labelled Demo |
|---|---|
| PayPal sandbox order, capture, webhook | UPI and bank routing |
| True cost math with live or cached FX | Bank decline diagnosis |
| Tagging, privacy rules, proof receipts | Settlement predictions |
| Dashboard and budgets from stored data | Compliance and TCS estimates |
| AI verdicts and chat (with API key) | Sample bank accounts and fund data |

## 9. Seed data
Demo family of three (Me, Mom, Dad), about 60 transactions over two months: groceries, bills, OTT subscriptions, one international purchase, several private items, one failed payment. Every widget has data on first load.

## 10. Success metrics (for the demo)
Full flow works in under 90 seconds: paste US product link, see true cost, see AI verdict, pay in sandbox, tag as Family, see the dashboard update, ask the chatbot about buying a bike. All money and privacy tests pass. No secrets in the repo.

## 11. Risks and mitigations
- **PayPal sandbox setup problems:** mock provider keeps the app demoable.
- **AI errors or cost:** rule-based fallback, rate limits, credits counter.
- **Over-claiming:** Real vs Demo labels in the UI and README.
- **Regulatory content (tax, LRS, investments):** estimates only, visible disclaimers.
- **Privacy leaks:** single privacy module plus tests.

## 12. Out of scope for v1
Real UPI or bank links, live-money payments, native apps, automated tax filing, regulated investment advice, push notifications.
