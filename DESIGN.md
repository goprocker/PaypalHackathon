# PayHub AI: Design System

## Feel
Calm, trustworthy fintech. Clear numbers, generous spacing, one accent colour, no clutter. Money screens must be readable in two seconds. Mobile first (360 px wide), scaling up to a two-column desktop layout.

## Brand
- Name: **PayHub AI**. Tagline: "Know where your money goes."
- Never use PayPal logos, colours copied exactly, or wording that suggests affiliation. Footer line: "Independent demo built on the PayPal developer platform."

## Colour tokens (CSS variables, light and dark)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #F6F8FC | #0B1120 | Page background |
| `--surface` | #FFFFFF | #141B2D | Cards |
| `--surface-2` | #EEF2F9 | #1B2438 | Inputs, chips |
| `--text` | #0F172A | #F1F5F9 | Primary text |
| `--muted` | #64748B | #94A3B8 | Secondary text |
| `--border` | #E2E8F0 | #26304A | Borders |
| `--primary` | #1D4ED8 | #60A5FA | Main actions, links |
| `--primary-fg` | #FFFFFF | #0B1120 | Text on primary |
| `--good` | #15803D | #4ADE80 | Good for you, success |
| `--warn` | #B45309 | #FBBF24 | Caution, 80% budget |
| `--bad` | #DC2626 | #F87171 | Think again, over budget, failed |
| `--private` | #7C3AED | #A78BFA | Private tag |
Category colours (charts): Groceries #16A34A, Bills #1D4ED8, Shopping #D946EF, Food #F59E0B, Subscriptions #EF4444, Friends #06B6D4, Other #6B7280.
Rule: colour is never the only signal. Pair it with an icon or text label. Contrast at least 4.5:1 for text.

## Typography
- Font: Inter (via `next/font`), system fallback.
- Scale: 12 / 14 / 16 / 20 / 24 / 32 px. Numbers use tabular figures.
- Money format: Indian grouping for INR (`₹1,23,456`), always show currency symbol.
- Page title 24 semibold, card title 16 semibold, body 14, captions 12.

## Layout, shape and motion
- 4 px spacing grid. Card padding 16. Gaps 12 or 16. Radius: cards 16, inputs and buttons 12, chips 999.
- Mobile: bottom tab bar (Home, Pay, Hub, Chat) with safe-area padding. Desktop: left sidebar plus content, max width 1100.
- Floating chat button bottom-right, above the tab bar.
- Shadows very light; borders do most of the work.
- Motion 150 to 250 ms, ease-out. Count-up on summary numbers, progress bars animate once. Respect `prefers-reduced-motion`.

## Core components
- **SummaryCard**: label, big number, small delta.
- **VerdictBadge**: GOOD FOR YOU (green, check icon) / THINK AGAIN or NOT WORTH IT (red, alert icon), followed by a one-line reason.
- **TagChip**: Me (primary), Family (good), Private (private, lock icon).
- **TrustMeter**: 0 to 100 bar with label Trusted, Caution, High risk.
- **CostTable**: rows per payment method, cheapest highlighted with a "Cheapest" chip.
- **BudgetBar**: green under 80%, amber 80 to 99%, red at 100% or more, shows spent of limit.
- **DonutChart** with legend, **MemberBars**, **SpendingCalendar** (7-column grid, amount per day, tap to list).
- **SubscriptionRow**: name, price, hours used, cost per hour, red/green badge, renewal date.
- **PaymentTrackerItem**: status pill, plain-language explanation, refund countdown, "Do not pay again" note when relevant.
- **Modal / bottom sheet** for "What is this for?" and post-payment tagging.
- **ChatPanel**: message bubbles, suggested prompts, language switch (English, Tamil, Hindi), AI credits counter.
- **DemoBadge**: small amber label on any simulated feature, with tooltip "Simulated for demo".

## Screens
1. **Login / Sign up** with "Try demo family" buttons (Me, Mom, Dad).
2. **Home**: wallet balance, payment tracker, latest proof receipt, recent activity.
3. **Pay (Checkout Copilot)**: link and amount form, category chips, AI check result (verdict, true cost table, trust meter, checklist, large-payment guard), PayPal button.
4. **Post-payment sheet**: "What did you buy?" input and Me / Family / Private buttons.
5. **Money Hub**: Individual | Family toggle, summary cards, AI summary, donut, member bars, budgets, calendar, subscriptions, accounts and goals, LRS tracker.
6. **Chat**: full-screen on mobile.
7. **Receipts**: list of proofs with PDF download.
8. **Family**: members, invites, shared budget.
9. **Settings**: language, AI credits, mock/real mode status, delete my data.

## States
Every data view has loading skeletons, empty states with a helpful action, and error states with a retry button. Failed payments never show a scary red wall: explain in plain words and say what to do next.

## Voice and copy
- Plain, friendly, short. Say "estimate" for guesses. Say "high risk signals" instead of "scam".
- Disclaimers appear where they matter: tax and LRS estimates, fund ideas ("Educational suggestions, not licensed investment advice"), and any Demo feature.
- Private items in Family view read exactly: "Personal – Other".

## Accessibility
Keyboard reachable everything, visible focus ring (2 px primary), labels on all inputs, `aria-label` on charts with a text summary, touch targets at least 44 px, dark mode follows the system with a manual override.
