# UI controls and motion

Moved here from code comments on 21 Nov 2026.

## Controls

- **Only `src/components/ui/` imports `@ui-sdk/*`**, and `bun lint`'s `no-restricted-imports` enforces it (Biome's `noRestrictedImports` before ADR-0010). ui-sdk is in beta, so an upstream change touches one folder. Everything else imports controls from `src/components/ui`.
- **ui-sdk's CSS layer is declared before Tailwind** in `src/index.css`, so it sits below Tailwind and our classes always win.
- **`Button`** follows the sm_ core component table: 2px corners, mono type, lime `signal` for the one main action on a screen and `outline` for the rest. Variants are a plain class map, and callers add layout classes only. Keyboard, disabled and form behaviour come from ui-sdk's button part.
- **`Checkbox` keeps the native input**, drawn to match a selected vote card, so keyboard, form and screen reader behaviour come for free.
- **`Field`** puts a visible label above the input in the lowercase mono voice; ui-sdk's field ties the label (and any error text) to the input.
- **The card and deck rows are ui-sdk toggle groups**: one tab stop each, arrow keys and Home/End move between toggles. `deselectable={false}` means pressing the pressed toggle does nothing, so a vote or deck can't be cleared by accident.
- **The room id field** turns off autocapitalise and autocorrect, because ids are case-sensitive.
- **Tokens** all come from the pinned sm-core copy. Dark is the default and light follows the OS. Product-only tokens use the `--poker-` prefix.

## Motion

- **Motion is opt-in.** Every animation and the press scale sit inside `prefers-reduced-motion: no-preference`, rather than being declared and then cancelled under `reduce` (#111). Reduced motion gets the static end state: cards shown, bars full, notices removed on time. Colour transitions stay on for everyone. `test/motion.test.ts` guards this.
- **Revealed cards deal in** one by one at an 80 ms stagger, with no fade. Distribution bars grow after the last card is dealt. Results list players low to high in deck order, with non-voters last.
- **Join and leave notices** stay up for 4 s and fade over the last 300 ms. `PresenceNotices` keeps its own state, so a notice expiring re-renders only that strip, and it compares each set of participants with the last one, so people already in the room on first render don't show as joined. Its log region is always rendered, so screen readers pick up new lines.
- **Pages size to `dvh`, not `vh`.** `100vh` is taller than a phone's visible area while its toolbars show (#116).
