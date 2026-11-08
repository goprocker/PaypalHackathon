---
name: PayHub AI
description: Know where your money goes. A passbook-style money companion for payments in rupees.
colors:
  ink-indigo: "#1b2559"
  paper: "#f4f6f8"
  surface: "#ffffff"
  surface-2: "#e9edf2"
  muted-ink: "#5d6685"
  hairline: "#d5dbe5"
  banknote-teal: "#0f7a64"
  marigold: "#b57708"
  sindoor: "#c0352b"
  lavender-private: "#6a4cc0"
  night-paper: "#0e1330"
  night-surface: "#151b3d"
  night-surface-2: "#1e2650"
  night-text: "#e8ebf7"
  night-muted: "#9aa3c7"
  night-hairline: "#2a3363"
  night-teal: "#3cc8a6"
  night-marigold: "#f0b33a"
  night-sindoor: "#f07a6f"
  night-lavender: "#a990f2"
typography:
  amount:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "tnum"
  heading:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  label:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  md: "6px"
  lg: "8px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
components:
  button-default:
    backgroundColor: "{colors.ink-indigo}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    height: "40px"
    padding: "0 16px"
  button-accent:
    backgroundColor: "{colors.banknote-teal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    height: "40px"
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-indigo}"
    rounded: "{rounded.lg}"
    height: "40px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-indigo}"
    rounded: "{rounded.lg}"
    height: "40px"
    padding: "0 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: PayHub AI

## Overview

**Creative North Star: "The Passbook"**

A bank passbook, not a dashboard. Ink-indigo type sits on cool paper, sections are separated by ruled hairlines instead of boxes, and each screen has exactly one loud element: the rupee figure. Everything else is quiet so that a money screen reads in two seconds.

Density is calm and tabular. Colour carries meaning (good, caution, bad, private) and is always paired with an icon or a word. The system is Operate-mode: scanability and consistency beat expression, and brand lives in the amount, the rules, and the precise details.

**Key Characteristics:**
- One loud rupee figure per screen; everything else subordinate.
- Hairline rules and tonal surfaces, not shadows and boxes.
- Indigo ink as the primary; teal only for "this is good / this is the action".
- Light and dark themes follow the system setting, both fully tokenised.
- Mobile first at 360 px, scaling to a two-column desktop layout.

## Colors

Ink on paper with a banknote-teal accent and three status inks.

### Primary
- **Ink Indigo** (#1b2559): body text, the default button, headings. In dark mode the roles invert: text and primary become Night Text (#e8ebf7).

### Secondary
- **Banknote Teal** (#0f7a64): the accent. Focus ring, good-for-you, success, the accent button, the nav avatar. Dark: Night Teal (#3cc8a6).

### Tertiary (status)
- **Marigold** (#b57708): caution, budget at 80%. Dark: #f0b33a.
- **Sindoor** (#c0352b): think again, over budget, failed. Dark: #f07a6f.
- **Lavender Private** (#6a4cc0): the Private tag only. Dark: #a990f2.

### Neutral
- **Paper** (#f4f6f8): page background. Dark: Night Paper (#0e1330).
- **Surface** (#ffffff): cards, inputs, the active nav pill. Dark: #151b3d.
- **Surface 2** (#e9edf2): chips, secondary buttons, nav track. Dark: #1e2650.
- **Muted Ink** (#5d6685): secondary text, icons. Dark: #9aa3c7.
- **Hairline** (#d5dbe5): borders and section rules. Dark: #2a3363.

### Named Rules
**The One Loud Figure Rule.** Each screen has one rupee amount in the `amount` style. Nothing else competes with it for size or weight.

**The Never Colour-Only Rule.** Good, caution, bad and private are always paired with an icon or a text label. Text contrast stays at or above 4.5:1.

## Typography

**Display / Body Font:** Schibsted Grotesk (with system-ui, sans-serif), loaded through `next/font`.

**Character:** A grotesque with some warmth, set tight at heading and amount sizes and plain at body size.

### Hierarchy
- **Amount** (800, large, line-height 1, letter-spacing -0.035em, tabular figures): the headline rupee figure.
- **Heading** (600, letter-spacing -0.02em): h1 and h2.
- **Section title** (600, 14px): `Section` and `CardTitle`, with a 16px muted icon.
- **Body** (400, 14px): default text; Indian grouping for INR (₹1,23,456), always with the symbol.
- **Label** (500, 14px): buttons, inputs, nav links; 12px for small buttons and captions.

### Named Rules
**The Tabular Rule.** Every number uses tabular figures (`.tabular` or `.amount`) so columns of money align.

## Layout

A 4 px grid with 16 and 20 px as the working gaps and paddings. Mobile first at 360 px, scaling to a two-column desktop layout capped around 1100 px. Navigation is a top pill group (Pay, Hub, Chat) with the user avatar beside it. Content is grouped into hairline-ruled `Section`s rather than stacked cards; use a `Card` only where a bordered group is genuinely needed.

## Elevation & Depth

Flat and border-led. Structure comes from 1 px hairlines and the paper/surface/surface-2 tonal steps. The only shadow in the system is `shadow-sm` on the active nav pill; the outline button has an extra-light `shadow-xs`. Shadows never signal importance.

### Named Rules
**The Hairline Rule.** Separate with a 1 px Hairline border or a tonal step. Do not add a shadow to separate.

## Shapes

Gently rounded: 8 px (`rounded-lg`) on cards, buttons and inputs, 6 px on the nav pills, and full round on avatars and chips. Borders are 1 px Hairline.

## Components

### Buttons
- **Shape:** 8 px radius, 40 px tall (32 small, 44 large, 40 square for icon), 16 px side padding, 14 px medium type.
- **Default:** Ink Indigo fill, white text, 90% on hover.
- **Accent:** Banknote Teal fill, white text; the main "go" action.
- **Secondary / Outline / Ghost:** Surface 2 fill; bordered Surface with `shadow-xs`; or text-only Muted Ink that gains Surface 2 on hover.
- **Focus:** a 2 px Banknote Teal outline with 2 px offset (global `:focus-visible`). Disabled drops to 50% opacity.

### Cards / Containers
- **Corner Style:** 8 px. **Background:** Surface. **Border:** 1 px Hairline. **Shadow:** none. **Padding:** 20 px (`px-5`).

### Inputs / Fields
- **Style:** 40 px tall, Surface fill, 1 px Hairline, 8 px radius, 12 px side padding, Muted placeholder.
- **Focus:** border turns Banknote Teal with a 3 px 20% teal ring; the default outline is removed.

### Navigation
- Pill group on a Surface 2 track with 4 px padding. Links are 32 px tall, 6 px radius, Muted Ink with a 16 px icon. The active link takes Surface fill, Ink text and `shadow-sm`, and carries `aria-current="page"`.

### Rupee Amount (signature)
- The `amount` style: weight 800, line-height 1, tabular figures, tight tracking. Appears once per screen, as the Home receipt total, the Hub monthly spend, or the checkout total.

## Do's and Don'ts

### Do:
- **Do** lead each screen with one rupee figure in the `amount` style.
- **Do** separate sections with a 1 px Hairline rule.
- **Do** use Banknote Teal for good and for the main action only.
- **Do** pair every status colour with an icon or a word.
- **Do** show INR with Indian grouping and the ₹ symbol, and word estimates as estimates.
- **Do** honour `prefers-reduced-motion`; transitions are removed entirely.
- **Do** badge anything simulated as Demo.

### Don't:
- **Don't** use PayPal logos, copied PayPal colours, or wording that suggests affiliation. Keep the footer: "Independent demo built on the PayPal developer platform."
- **Don't** add shadows to create hierarchy.
- **Don't** use colour as the only signal.
- **Don't** call a merchant a scam; say "high risk signals".
- **Don't** put a second large, heavy figure on a screen.
