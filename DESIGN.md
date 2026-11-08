---
name: PayHub AI
description: Know where your money goes. An installable money app that shows the real rupee cost before you pay.
colors:
  cobalt: "#1456e0"
  navy: "#0a2766"
  ink: "#0c1b3d"
  mist: "#f2f5fa"
  surface: "#ffffff"
  surface-2: "#e8eefa"
  muted-ink: "#5a6784"
  hairline: "#e2e8f3"
  teal-good: "#0f7a64"
  marigold: "#8f5e00"
  sindoor: "#c0352b"
  lavender-private: "#6a4cc0"
  night-mist: "#0a1228"
  night-surface: "#121c3b"
  night-surface-2: "#1b2750"
  night-ink: "#eaf0ff"
  night-muted: "#9fb0d6"
  night-hairline: "#27345f"
  night-cobalt: "#6d9bff"
  night-navy: "#0f2f7a"
typography:
  amount:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "pnum"
  heading:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
rounded:
  xl: "12px"
  card: "16px"
  hero: "24px"
  full: "999px"
spacing:
  sm: "8px"
  md: "16px"
  gutter: "20px"
components:
  button-default:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 20px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "20px"
  hero-card:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.surface}"
    rounded: "{rounded.hero}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    height: "48px"
---

# Design System: PayHub AI

## Overview

**Creative North Star: "The Pocket Wallet"**

An installable phone app (PWA), not a website. A phone-width column on every screen size: white rounded cards on a soft blue-grey ground, one deep-navy hero card with the big rupee figure, pill buttons and chips, circular avatars, and a bottom tab bar with a raised round Pay action. The feel is the common modern payments-app language: friendly, rounded, confident, numbers first. It is inspired by that genre but is its own brand and never copies PayPal's logo, name or exact colours.

**Key Characteristics:**
- Phone column (max 480 px), centred on larger screens; bottom tab bar with a raised centre Pay button.
- One loud rupee figure per screen, set in the `amount` style on the navy hero card.
- Rounded everything: 24 px hero, 16 px cards, 12 px fields, fully round buttons, chips and avatars.
- Cards are white and nearly flat; a 1 px soft shadow, no heavy elevation.
- Light and dark themes follow the system; installable with manifest, icons and an offline page.

## Colors

Cobalt action on mist, navy for the hero, teal only for good news.

### Primary
- **Cobalt** (#1456e0): buttons, the active tab, links, focus ring, the Pay circle. Dark: #6d9bff.
- **Navy** (#0a2766): the hero card and theme colour. Dark: #0f2f7a.

### Tertiary (status)
- **Teal Good** (#0f7a64): good for you, cheapest method, success.
- **Marigold** (#8f5e00): caution, budget at 80%. **Sindoor** (#c0352b): think again, over budget, failed. **Lavender Private** (#6a4cc0): the Private tag only.

### Neutral
- **Mist** (#f2f5fa): page ground. **Surface** (#ffffff): cards. **Surface 2** (#e8eefa): chips, empty tracks. **Ink** (#0c1b3d): text. **Muted Ink** (#5a6784): secondary text. **Hairline** (#e2e8f3): dividers.

### Named Rules
**The One Loud Figure Rule.** Each screen has one rupee amount in the `amount` style, normally on the navy hero.

**The Never Colour-Only Rule.** Good, caution, bad and private always pair with an icon or a word. Text contrast stays at or above 4.5:1.

## Typography

**Font:** Schibsted Grotesk (with system-ui), via `next/font`.

### Hierarchy
- **Amount** (800, 48 px, line-height 1, tracking -0.035em, proportional figures so commas stay tight): the hero figure.
- **Heading** (700, 24 px page title, 16 px section title).
- **Body** (400, 14 px). **Label** (600, 14 px for buttons; 11 px for tab labels).

### Named Rules
**The Tabular Rule.** Numbers in lists and tables use tabular figures so money aligns. The single hero amount is the exception.

## Layout

A single phone column, 480 px max, 20 px side gutters, 16 to 24 px between sections. A sticky top bar (home mark, greeting, member avatar), content, then a fixed bottom tab bar (Home, Hub, raised Pay, Ask AI, Family) with safe-area padding. On wider screens the column is centred over a slightly darker ground. Never use viewport breakpoints to add columns; the app is one column everywhere.

## Elevation & Depth

Nearly flat. Cards sit on the mist ground with a 1 px soft shadow (`0 1px 2px rgba(12,27,61,0.06)`). The only lifted element is the raised Pay circle (`0 6px 16px rgba(20,86,224,0.35)`) and the sticky chat composer.

## Shapes

Generously rounded: hero 24 px, cards 16 px, fields and tiles 12 to 16 px, buttons, chips, tabs and avatars fully round. Hero cards carry two soft circles as their only ornament.

## Components

### Buttons
- Fully round, 44 px tall (36 small, 48 large), 600 weight. Default is Cobalt with white text; secondary is Surface 2; on the navy hero the button is white with navy text. Focus is a 2 px Cobalt outline.

### Cards
- White, 16 px radius, 20 px padding, soft shadow, no border. Sections are cards with a 16 px semibold title.

### Inputs
- 48 px tall, 12 px radius, 1 px Hairline; focus turns the border Cobalt with a 3 px 20% ring.

### Navigation
- Bottom tab bar, 56 px min target per tab, 11 px labels, active tab bold with a Cobalt icon. The centre Pay is a 56 px Cobalt circle raised 20 px above the bar.

### Hero Card (signature)
- Navy 24 px card, white text, one `amount` figure, a thin progress bar, and a white pill action.

### Chips and Avatars
- Pill chips for tags. Avatars are 56 px circles with a pastel tint and an initial.

## Do's and Don'ts

### Do:
- **Do** keep every screen a single phone-width column with the bottom tab bar.
- **Do** put one rupee figure on the navy hero card.
- **Do** make every tap target at least 44 px.
- **Do** pair status colour with an icon or a word.
- **Do** show INR with Indian grouping and word estimates as estimates; badge anything simulated as Demo.
- **Do** keep it installable: manifest, icons, offline fallback, safe-area padding.

### Don't:
- **Don't** use PayPal's logo, name as branding, or copied brand colours; keep the "Independent demo, not affiliated with PayPal" footer.
- **Don't** add multi-column desktop layouts or viewport-based column grids.
- **Don't** add heavy shadows or borders to cards.
- **Don't** call a merchant a scam; say "high risk signals".
