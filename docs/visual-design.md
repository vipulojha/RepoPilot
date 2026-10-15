# RepoPilot Visual Design

Status: Frontend design phase. The implementation is a static presentation
prototype; it does not call the future API or analyze repositories.

## Direction: Signal Map

**Signal Map** treats the repository as a navigable field of evidence. The
interface borrows from source editors, terminal panes, and network diagrams:
quiet near-black surfaces, compact monospace metadata, syntax-like accents,
and relationship lines that connect every visual claim to a file or symbol.

This avoids generic SaaS dashboard patterns. Statistics support the repository
story; they do not become the story. The strongest view is Impact Analysis,
where a changed file, relationship chain, evidence text, and affected tests
share one surface.

## Design tokens

### Color

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b0e13` | Application background |
| `--surface` | `#11161d` | Panels and controls |
| `--surface-2` | `#161c24` | Hover/elevated controls |
| `--surface-3` | `#1c242e` | Selected toggle/control |
| `--line` | `#27313c` | Default borders |
| `--line-strong` | `#34404e` | Focus/secondary borders |
| `--text` | `#e9edf4` | Primary text |
| `--muted` | `#84909e` | Supporting text |
| `--faint` | `#5b6672` | Metadata and chrome |
| `--accent` | `#52d6d0` | Selection, links, core relationships |
| `--success` | `#79d59b` | Ready/verified states |
| `--warning` | `#f2b56b` | Hotspots, unresolved, tests |
| `--danger` | `#f17f8d` | Errors and low confidence |
| `--information` | `#ae9cff` | Transitive/symbol context |

Accent meaning is repeated with labels, icons, or edge styles. Color is never
the only status channel.

### Typography

- **UI/display:** Space Grotesk, 400/500/600/700. Its geometric forms make
  labels and headings feel engineered without looking like a marketing page.
- **Code/metadata:** DM Mono, 400/500. It gives paths, line numbers, counts,
  shortcuts, and relationship evidence a source-tool cadence.
- Body: 12–14px; page titles: 27px; labels: 9–10px uppercase; code: 11px.

Two families only. Code and metadata are intentionally distinct from prose.

### Spacing, geometry, elevation

- 4px base; common spacing: `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`,
  `2xl 32`.
- 1px borders, 8px control radius, 0–2px panel radius, 6px graph nodes.
- Elevation is expressed by surface steps and hairline borders, not floating
  card shadows. The command palette is the only deep shadow surface.
- Controls are 30–36px high. Dense table rows are 36–44px.

## Components

The foundation includes the shell, navigation, repository switcher, page
header, metrics, panels, evidence rows, file tree, code viewer, graph canvas,
inspector, filters, status badges, command palette, and scan/status messaging.
Components are intentionally CSS-first and small. There is no blanket import
of every shadcn/ui primitive; each future primitive must earn its place in the
developer workflow.

## Graph language

Graph nodes are compact file/module cards: short name, path/module context,
and a language or relationship accent. The selected root uses cyan outline and
subtle cyan halo. Direct imports use cyan lines, transitive context uses violet,
and test references use amber dashed lines. The prototype shows a bounded
neighborhood and says how many nodes are omitted. Future React Flow integration
must preserve this local-first behavior, server-side limits, grouping, and an
accessible relationship table.

## Code-viewer language

The viewer uses a dark editor surface, mono line numbers, restrained syntax
colors, cyan selected-symbol emphasis, and amber analysis markers. It shows
source context rather than turning the file into a decorative code screenshot.
Future interactions should link line markers to dependency evidence and symbol
navigation.

## Motion

Motion communicates state only: sidebar transitions, command palette open/close,
scan progress, graph expansion, and selected relationship emphasis. No floating
background effects, card hover choreography, or automatic graph spinning.
Reduced-motion users receive instant transitions and static graph layouts.

## Responsive behavior

At 1440px+, the shell supports navigation, main content, and inspectors at
once. At 1280px the inspector becomes a drawer. At 1024px the rail collapses
and file/graph inspectors become drawers. Below the desktop target, tables
retain horizontal access and graph controls condense; the product does not
pretend to be a mobile dashboard.

## Accessibility

Focus states use a visible cyan outline. Semantic buttons and landmarks are
used throughout. Graph relationships must later have a table/list alternative;
the canvas is not the only access path. Status colors pair with text, source
snippets are escaped, and reduced motion is respected.

## Mock-data boundary

`frontend/src/App.tsx` owns clearly labeled static arrays for files, graph
nodes, search results, and impact groups. They validate visual hierarchy only.
There are no API calls, fake fetches, backend routes, or claims that the data
is live. Future API hooks should replace presentation arrays at route boundaries
using the DTOs defined in `docs/api-design.md`.
