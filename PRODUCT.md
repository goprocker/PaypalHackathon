# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Four audiences, treated as co-equal:
- Student or young earner in India who buys from overseas sites and wants to stop overspending.
- Parent or family manager who wants one household view without exposing anyone's private items.
- Freelancer or small seller who sends and receives cross-border payments and needs proof and records.
- Elder family member who needs scam warnings and plain-language payment status.

## Product Purpose
PayHub AI is an AI money companion built on PayPal sandbox payments, made for the PayPal AI Hackathon ("Build What's Next with PayPal and AI"; deadline Nov 12, 2026, 12:00 pm PST). It must meaningfully use both PayPal and AI. Success: a real sandbox payment works end to end, AI verdicts and chat are grounded in the user's own data, the dashboard explains spending in plain words, privacy is enforced on the server, and anything simulated is honestly labelled.

## Positioning
Covers a payment's whole life: checks it before it happens (true INR cost, merchant trust, worth), records it after (what and for whom, with immutable proof), and explains it over time (individual and family dashboards, budgets, finance chat), with family privacy enforced server-side: a private item's amount always counts in the family total, but its details never show to others.

## Operating Context
- Charges are made in USD in the PayPal sandbox (INR is not usable there); INR is shown as the converted true cost across payment methods (PayPal balance, Indian credit card, forex card).
- Demo uses a signed-cookie "Try demo family" login (Me / Mom / Dad) with seeded transactions.
- Mock provider runs when PayPal keys are missing, badged as such.
- An installable PWA (manifest, icons, offline page), shown as a phone-width column on every screen size with a bottom tab bar.

## Capabilities and Constraints
- Built: true-cost table, trust score, AI verdict with rule fallback, PayPal order/capture, tag sheet (Me / Family / Private), proof receipt, Money Hub, finance chat agent with tools, verified PayPal webhook.
- Privacy matrix (lib/privacy.ts): Me = owner sees full, others see it under the owner's name; Family = full detail to all; Private = others see "Personal – Other", no item or merchant, amount still in family total.
- Money in integer minor units; secrets server-only; user-supplied URLs are never fetched; user text is untrusted in prompts.
- Non-goals: real UPI or bank integration, investment advice, tax filing, production fraud detection, native apps, live money.
- Cut for MVP and undecided: auth/signup, AI credits, languages beyond English, calendar, goals, large-payment guard, PDF receipts, invites, delete-data.

## Brand Commitments
- Name: PayHub AI. Tagline: "Know where your money goes."
- Never use PayPal logos, copied PayPal colours, or wording implying affiliation. Footer line: "Independent demo built on the PayPal developer platform."
- Simulated features carry a Demo badge; cost figures are worded as estimates; risk is "high risk signals", never "this is a scam".
- Educational finance suggestions carry "not licensed investment advice."

## Evidence on Hand
Seeded demo data only (about 30 transactions this month across three family members). No real users, testimonials, or benchmarks exist; do not fabricate any. Source docs: PRD.md, DESIGN.md, TECH_STACK.md, PLAN.md.

## Product Principles
- Numbers first: the rupee figure is the one loud element; a money screen must read in two seconds.
- Honest about what is real versus simulated, and about estimates.
- Privacy is a server rule, never a UI courtesy.
- Colour is never the only signal; text or icon always pairs with it.

## Accessibility & Inclusion
Text contrast at least 4.5:1; reduced-motion respected; plain-language statuses for elder users.
