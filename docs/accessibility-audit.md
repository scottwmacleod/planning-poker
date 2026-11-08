# Accessibility Audit

**Date:** 2026-05-02  
**Scope:** Colour scheme review + WCAG 2.1 AA compliance  
**Files audited:** `app/page.tsx`, `app/room/[id]/page.tsx`, `components/CardDeck.tsx`, `components/ParticipantList.tsx`, `components/VoteResults.tsx`, `app/globals.css`, `app/layout.tsx`

---

## 1. Colour Inventory

The app is dark-first. All colour comes from the Tailwind v4 default palette (OKLCH-based; no custom overrides). Hex equivalents computed from the OKLCH values in `node_modules/tailwindcss/theme.css`.

| Role | Foreground | Background | Hex (fg) | Hex (bg) |
|---|---|---|---|---|
| Body text | white | gray-950 | `#ffffff` | `#030712` |
| Secondary text | gray-400 | gray-950 | `#99a1af` | `#030712` |
| Hint / muted text | gray-500 | gray-950 | `#6a7282` | `#030712` |
| Primary button | white | indigo-600 | `#ffffff` | `#4f39f6` |
| Secondary button | white | gray-800 | `#ffffff` | `#1e2939` |
| Input text | white | gray-900 | `#ffffff` | `#101828` |
| Placeholder text | gray-500 | gray-900 | `#6a7282` | `#101828` |
| Vote card (normal) | white | indigo-900 | `#ffffff` | `#312c85` |
| Vote card (outlier) | amber-200 | amber-900 | `#fee685` | `#7b3306` |
| Vote card (selected) | white | indigo-600 | `#ffffff` | `#4f39f6` |
| Revealed vote value | indigo-400 | gray-900 | `#7c86ff` | `#101828` |
| Voted status dot | green-500 | gray-900 chip | `#00c950` | `#101828` |
| Participant name | gray-400 | gray-900 chip | `#99a1af` | `#101828` |
| Disabled button | any @ opacity-40 | — | — | — |

### Light-mode dead code

`app/globals.css` defines `--background: #ffffff` / `--foreground: #171717` but `app/layout.tsx:22` hardcodes `bg-gray-950` on `<body>`. The CSS variables are never applied. The app has no functional light mode despite the code suggesting otherwise. Decision needed: remove the variables, or wire them up.

---

## 2. Contrast Scoring

Ratios computed via WCAG 2.1 relative luminance formula from exact OKLCH-derived hex values.  
**Targets:** 4.5:1 normal text (AA), 3:1 large text / UI components (AA).

| Pair | Ratio | WCAG AA | Notes |
|---|---|---|---|
| white on gray-950 | **20.1:1** | ✅ Pass | Body text |
| gray-400 on gray-950 | **7.7:1** | ✅ Pass | Secondary text |
| gray-500 on gray-950 | **4.2:1** | ❌ Fail (normal text) | Used for `text-sm` hints and "·you" / "(you)" labels |
| white on indigo-600 | **6.4:1** | ✅ Pass | Primary button, selected card |
| white on gray-800 | **14.7:1** | ✅ Pass | Secondary button |
| white on gray-900 | **17.8:1** | ✅ Pass | Input text |
| gray-500 on gray-900 | **3.7:1** | ❌ Fail (normal text) | Placeholder text in all inputs |
| white on indigo-900 | **11.5:1** | ✅ Pass | Normal vote card |
| amber-200 on amber-900 | **7.3:1** | ✅ Pass | Outlier vote card |
| indigo-400 on gray-900 | **5.7:1** | ✅ Pass | Revealed vote value in sidebar |
| green-500 on gray-900 | **8.0:1** | ✅ Pass | Voted status dot (as graphical object, 3:1 required) |
| gray-400 on gray-900 | **6.8:1** | ✅ Pass | Participant name on chip |

**Contrast failures (2):**

1. **gray-500 on gray-950** (4.2:1) — affects `text-gray-500` instances used as small text:
   - `app/page.tsx:39` — "or join existing" divider label (`text-sm`)
   - `app/room/[id]/page.tsx:159` — "Observing" spectator notice (`text-sm`)
   - `components/ParticipantList.tsx:27` — "·you" suffix (`text-xs`)
   - `components/ParticipantList.tsx:48` — "(you)" suffix (`text-sm`)

2. **gray-500 on gray-900** (3.7:1) — affects placeholder text:
   - `app/page.tsx:49` — "Room ID" placeholder (`text-base` input)
   - `app/room/[id]/page.tsx:78` — "Your name" placeholder (`text-base` input)

**Disabled states:** `disabled:opacity-40` drops all button contrast well below 4.5:1. WCAG 1.4.3 explicitly exempts disabled controls, so this is not a violation — but sighted users with low vision may struggle to distinguish enabled from disabled states.

---

## 3. Non-Colour Accessibility Findings

### Critical — WCAG failure, likely to block assistive-technology users

| ID | File:line | Issue | Criterion |
|---|---|---|---|
| C1 | [`app/page.tsx:49`](../app/page.tsx#L49), [`room/[id]/page.tsx:78`](../app/room/%5Bid%5D/page.tsx#L78) | `focus:outline-none` removes the browser focus ring on inputs. The only replacement is a border-colour change (`focus:border-indigo-500`), which is colour-only and below the 3:1 non-text contrast requirement. | 2.4.7 Focus Visible |
| C2 | All buttons in every component | No `:focus-visible` style on any `<button>` element. Keyboard users navigating via Tab have no visible focus indicator. | 2.4.7 Focus Visible |
| C3 | [`components/VoteResults.tsx:26`](../components/VoteResults.tsx#L26) | Outlier cards are distinguished from normal cards by colour alone (amber vs indigo). No icon, text label, or shape difference is present. | 1.4.1 Use of Color |
| C4 | [`components/ParticipantList.tsx:69`](../components/ParticipantList.tsx#L69) | The green/gray dot communicates "voted / not yet voted" through colour only. No `aria-label` or text equivalent is present. | 1.4.1, 4.1.2 Name/Role/Value |

### Serious — likely to create significant barriers

| ID | File:line | Issue | Criterion |
|---|---|---|---|
| S1 | [`components/CardDeck.tsx:39`](../components/CardDeck.tsx#L39) | Vote card buttons have no `aria-pressed` attribute. Screen readers cannot tell users which card is currently selected. | 4.1.2 Name/Role/Value |
| S2 | [`components/ParticipantList.tsx:26`](../components/ParticipantList.tsx#L26), [`:48`](../components/ParticipantList.tsx#L48) | The 👁 emoji indicating spectator status has no `aria-label` and is not wrapped with `aria-hidden` + adjacent screen-reader text. It will be announced as "eye" by most screen readers, with no context. | 1.3.3 Sensory Characteristics, 4.1.2 |
| S3 | [`app/room/[id]/page.tsx:122`](../app/room/%5Bid%5D/page.tsx#L122) | "Copy link" calls `navigator.clipboard.writeText` with no feedback — no visual confirmation, no `aria-live` announcement. Success is silent for all users. | 4.1.3 Status Messages |
| S4 | [`app/room/[id]/page.tsx`](../app/room/%5Bid%5D/page.tsx) | The phase transition from `voting` to `revealed` is a major state change (the whole main area is replaced) but there is no `aria-live` region to announce it. Screen reader users will not know cards have been flipped. | 4.1.3 Status Messages |
| S5 | [`app/room/[id]/page.tsx:156`](../app/room/%5Bid%5D/page.tsx#L156) | "X / Y voted" updates as participants vote, but the element is not in a live region. Screen reader users cannot track voting progress without manually navigating to it. | 4.1.3 Status Messages |

### Moderate — degrades experience, workarounds exist

| ID | File:line | Issue | Criterion |
|---|---|---|---|
| M1 | [`app/room/[id]/page.tsx`](../app/room/%5Bid%5D/page.tsx) | Once a user has joined and the room view renders, there is no `<h1>`. The join screen has one ("Join Room") but the in-room view has no page-level heading. | 1.3.1 Info and Relationships |
| M2 | [`app/page.tsx:44`](../app/page.tsx#L44) | The "Room ID" `<input>` has no `<label>`. Only a `placeholder` attribute is present; placeholders disappear on input and are not reliably announced. | 1.3.1, 3.3.2 Labels or Instructions |
| M3 | [`app/room/[id]/page.tsx:71`](../app/room/%5Bid%5D/page.tsx#L71) | The "Your name" `<input>` has no `<label>`, same issue as M2. | 1.3.1, 3.3.2 |
| M4 | [`components/CardDeck.tsx:19`](../components/CardDeck.tsx#L19) | The Fibonacci / T-Shirt toggle buttons have no group label. A screen reader user hears "Fibonacci" and "T-Shirt" with no context that these are deck-type selectors. | 1.3.1 |
| M5 | [`app/room/[id]/page.tsx:103`](../app/room/%5Bid%5D/page.tsx#L103) | "Connecting…" loading state has no `role="status"` or `aria-live`, so it won't be announced to screen reader users landing on the page while the socket connects. | 4.1.3 |

---

## Summary

| Severity | Count |
|---|---|
| Contrast failures | 2 |
| Critical (WCAG block) | 4 |
| Serious | 5 |
| Moderate | 5 |

Most of the serious issues (C2, S1, S3–S5) share a root cause: there is no focus management or live-region infrastructure in the app at all. Addressing these as a group (adding a `focus-visible` ring utility, a global `aria-live` announcer component) would resolve several findings in one pass.

---

## 4. New palette contrast (design system tokens, 2026-11-08)

The tokens in `app/globals.css` replace the Tailwind gray/indigo palette. Ratios use the WCAG 2.1 relative luminance formula on the exact token hex values; tinted backgrounds are blended over `ground`. Targets: 4.5:1 text, 3:1 controls, card outlines and focus rings (WCAG 1.4.3, 1.4.11). Lime (`signal`) is a fill only, never text on a light ground; `signal-ink` is the text/focus colour.

| Pair | Dark | Light | Use |
|---|---|---|---|
| `ink` on `ground` | 16.92 | 17.20 | Headings, UI text |
| `ink-body` on `ground` | 14.14 | 12.83 | Prose |
| `ink-muted` on `ground` | 7.43 | 5.91 | Labels, hints |
| `ink` on `surface` | 15.85 | 18.51 | Text in panels |
| `ink-muted` on `surface` | 6.95 | 6.36 | Labels in panels |
| `on-signal` on `signal` | 14.87 | 14.87 | Primary button text |
| `signal-ink` on `ground` | 14.87 | 7.32 | Accent text, focus ring |
| `signal-ink` on `surface` | 13.93 | 7.87 | Accent text, focus ring in panels |
| `signal-ink` on `signal-tint` | 12.88 | 6.86 | `+` rows |
| `wip` on `ground` | 11.15 | 5.88 | `~` sign and label |
| `wip` on `surface` | 10.44 | 6.33 | `~` in panels |
| `wip` on `wip-tint` | 9.85 | 5.37 | `~` rows |
| `removed` on `ground` | 8.58 | 6.11 | `-` sign |
| `removed` on `surface` | 8.04 | 6.57 | `-` in panels |
| `control-line` on `ground` | 3.91 | 3.70 | Card and control outlines |
| `control-line` on `surface` | 3.67 | 3.99 | Outlines in panels |
| `line-strong` on `ground` | **1.64** | **1.99** | Decorative only; fails 3:1 |
| `line` on `ground` | 1.35 | 1.29 | Decorative hairlines only |

All text pairs pass AA. `line-strong` and `line` fail 3:1, so they must only be decorative (dividers, hairlines between surfaces). Anything that identifies a control or card uses `control-line`, a token added in this app (`#6B716A` dark, `#7C8178` light) that is not in the design system.

The shared focus ring (`.focus-ring`: 2px `signal-ink` outline, 2px offset) is 14.87:1 dark and 7.32:1 light on `ground`. Because the body font stack now comes from the tokens, the old `Arial` body font and the unused `--background`/`--foreground` variables noted in section 1 are gone; the light theme now follows `prefers-color-scheme`.

### Home page pairs (#46)

| Pair | Dark | Light | Use |
|---|---|---|---|
| `on-signal` on `signal` | 14.87 | 14.87 | Lime button text |
| `signal-ink` border on `ground` | 14.87 | 7.32 | Lime button outline. The `signal` fill alone is about 1.2:1 on the light ground, so the border carries the 3:1 control boundary |
| `ground` on `signal-ink` | 14.87 | 7.32 | Lime button text on hover (`signal-ink` fill) |
| `ink-muted` on `ground` | 7.43 | 5.91 | Tagline, divider label, `room id` label, footer link |
| `ink-muted` on `surface` | 6.95 | 6.36 | Input placeholder |
| `control-line` on `ground` | 3.91 | 3.70 | Disabled `join room` outline |
| `control-line` on `surface` | 3.67 | 3.99 | Room ID input border |

The disabled `join room` label is `ink-muted` and is exempt from 1.4.3 as a disabled control. Both themes' footer link is underlined, so it does not rely on colour alone.

Existing screens still use the old Tailwind classes until the reskin issues land, so findings 1 to 3 above remain open until then.
