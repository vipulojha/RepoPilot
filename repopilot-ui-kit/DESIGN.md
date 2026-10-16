---
name: Obsidian Telemetry
colors:
  surface: '#0e131f'
  surface-dim: '#0e131f'
  surface-bright: '#343946'
  surface-container-lowest: '#090e1a'
  surface-container-low: '#161b28'
  surface-container: '#1a1f2c'
  surface-container-high: '#252a37'
  surface-container-highest: '#303542'
  on-surface: '#dee2f3'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dee2f3'
  inverse-on-surface: '#2b303d'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dce6'
  primary: '#e0fdff'
  on-primary: '#00373a'
  primary-container: '#00f2fe'
  on-primary-container: '#006a70'
  inverse-primary: '#00696f'
  secondary: '#e0b6ff'
  on-secondary: '#4c007d'
  secondary-container: '#6d11ad'
  on-secondary-container: '#d7a4ff'
  tertiary: '#ddffed'
  on-tertiary: '#003827'
  tertiary-container: '#4af5bd'
  on-tertiary-container: '#006d50'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ff6ff'
  primary-fixed-dim: '#00dce6'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#f2daff'
  secondary-fixed-dim: '#e0b6ff'
  on-secondary-fixed: '#2e004e'
  on-secondary-fixed-variant: '#6a0baa'
  tertiary-fixed: '#54fdc4'
  tertiary-fixed-dim: '#27e0a9'
  on-tertiary-fixed: '#002116'
  on-tertiary-fixed-variant: '#00513b'
  background: '#0e131f'
  on-background: '#dee2f3'
  surface-variant: '#303542'
typography:
  headline-xl: { fontFamily: Space Grotesk, fontSize: 24px, fontWeight: '600', lineHeight: 32px, letterSpacing: -0.02em }
  headline-lg: { fontFamily: Space Grotesk, fontSize: 18px, fontWeight: '600', lineHeight: 24px, letterSpacing: -0.01em }
  headline-sm: { fontFamily: Space Grotesk, fontSize: 14px, fontWeight: '600', lineHeight: 20px, letterSpacing: 0em }
  body-md:     { fontFamily: Geist, fontSize: 13px, fontWeight: '400', lineHeight: 18px, letterSpacing: 0em }
  body-sm:     { fontFamily: Geist, fontSize: 12px, fontWeight: '400', lineHeight: 16px, letterSpacing: 0.01em }
  code-md:     { fontFamily: JetBrains Mono, fontSize: 12px, fontWeight: '400', lineHeight: 18px, letterSpacing: -0.01em }
  code-sm:     { fontFamily: JetBrains Mono, fontSize: 11px, fontWeight: '400', lineHeight: 16px, letterSpacing: 0em }
  label-mono:  { fontFamily: JetBrains Mono, fontSize: 10px, fontWeight: '500', textTransform: uppercase }
---

# Obsidian Telemetry — RepoPilot Design System

> NOTE: the middle part of the original design.md (after `label-mono`, up to the
> Shapes section) was cut off when it was shared in chat. Paste it back here
> from your own copy.

## Workstation palette (as used in the screenshots)
| Role | Hex |
|---|---|
| Canvas | #0B0E14 |
| Panel / Card | #111622 |
| Trough / hover row | #182030 |
| Hairline outline | #1E2638 |
| Inset / hover border | #2D3A54 |
| Electric Cyan (primary) | #00F2FE |
| Synapse Violet (AST / transitive) | #9D4EDD |
| Signal Amber (risk) | #FFB703 |
| Matrix Emerald (tests / clean) | #06D6A0 |
| Crimson (break) | #EF476F |
| Text primary / muted / placeholder | #F1F5F9 / #94A3B8 / #475569 |

## Shapes
- Tag pills and toast notifications keep strict rectangular shapes (no rounding).
- Micro-indicators (commit graph nodes, health beacons) use square pings or geometric glyphs (`◆`, `▲`, `■`, `●`) drawn as text, not pill containers.

## Components

### Buttons
- **Tool Actions (Primary)**: Height 28px. Background `#00F2FE`, text `#0B0E14`, `Geist` 12px/600. Zero border radius. Hover `#38F9FF`. Active `#00C2CC`.
- **Secondary / Ghost**: Height 28px. Background `#182030`, border `1px solid #1E2638`, text `#F1F5F9`. Hover: border `#2D3A54`, text `#FFFFFF`.
- **Icon Utility**: 24x24px square, transparent background, icon `#94A3B8`. Hover: `#182030` background, `#00F2FE` icon.

### Input Fields & Command Palettes
- **Quick-Open / Symbol Search**: Height 32px. Background `#0B0E14`, border `1px solid #1E2638`, text `#F1F5F9`, placeholder `#475569`. `JetBrains Mono` 12px. Focus: `1px solid #00F2FE`, 0px outline.
- **Inline Filter**: Height 24px, compact inset style, leading monospace search glyph.

### Status Badges & Intelligence Chips
Height 18px, padding 0 6px, sharp rectangle, `JetBrains Mono` 10px uppercase.
- **Active/Cyan**: bg `#00F2FE15`, border `#00F2FE55`, text `#00F2FE`
- **AST/Violet**: bg `#9D4EDD15`, border `#9D4EDD55`, text `#9D4EDD`
- **Risk/Amber**: bg `#FFB70315`, border `#FFB70355`, text `#FFB703`
- **Clean/Emerald**: bg `#06D6A015`, border `#06D6A055`, text `#06D6A0`
- **Break/Crimson**: bg `#EF476F15`, border `#EF476F55`, text `#EF476F`

### Trees & Dense Lists
- Row height 26px. Flat, with continuous 1px vertical indent guides in `#1E2638`.
- Hover row `#182030`. Selected row `#182030` plus a 2px left accent bar in `#00F2FE`.

### Telemetry Cards & Metric Panels
- Background `#111622`, border `1px solid #1E2638`. Header 28px with bottom hairline.
- No rounded corners, no soft shadows. 8px padding, monospace values right-aligned.

### Codebase Graph Nodes
- Min width 180px, background `#111622`, 2px top accent by type: `#00F2FE` Entrypoint, `#9D4EDD` Internal Module, `#FFB703` Hotspot.
- Port sockets: 6x6px sharp squares on the node edges.

## Screens (see /screenshots)
01 File tree · 02 Cockpit overview · 03 Dependency graph · 04 Hotspots · 05 Tests · 06 Git history · 07 Blast radius · 08 Diff auditor · 09 Code search · 10 Git actions · 11 Command palette
