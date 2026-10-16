# RepoPilot UI Kit — Obsidian Telemetry

- `DESIGN.md` — design system (colors, type, component rules)
- `SCREENS.md` — what each of the 11 screens shows
- `screenshots/` — reference mockups for all 11 screens (illustrative, not pixel specs)
- `tokens/obsidian.css` — Tailwind v4 theme; `tokens/tokens.json` — raw values
- `components/ui.tsx` — Button, Badge, Panel, Metric, SearchInput, TreeRow, GraphNode
- `components/Example.tsx` — sample cockpit page using them

Setup: React + Tailwind v4, `@import "tailwindcss"; @import "./tokens/obsidian.css";`, and load the Google Fonts link noted at the top of obsidian.css.
