# RepoPilot UI/UX Design

Status: Phase 1 specification. `docs/visual-design.md` records the implemented
Signal Map visual direction; this document remains the screen and interaction
contract. The current frontend uses static presentation data only.

## 1. Product feel

RepoPilot should feel like a focused code intelligence workbench: dark-first,
technical, calm, fast, and dense enough for developers without becoming a
dashboard of decorative cards. Evidence and source locations always outrank
decoration. The visual signature is a narrow command/sidebar rail, bright
syntax-like accents, crisp data surfaces, and a graph canvas that feels like a
tool rather than a presentation slide.

Do not use hero gradients, oversized marketing cards, fake chat, gratuitous
motion, or a rainbow of status colors.

The implementation commits to **Signal Map**: a source-editor and dependency-
graph visual language with near-black surfaces, Space Grotesk UI text, DM Mono
metadata/code, cyan direct relationships, violet transitive context, and amber
test/warning signals. See [`visual-design.md`](visual-design.md) for tokens and
implementation detail.

## 2. Navigation and shell

Persistent shell:

- **Top bar:** repository switcher, snapshot status, global search trigger,
  command palette hint, notifications, and compact settings/help controls.
- **Left rail:** 240px expanded / 64px collapsed. Sections:
  - OVERVIEW: Dashboard
  - EXPLORE: Files, Dependency Graph, Search
  - ANALYZE: Impact Analysis, Hotspots, Tests
- **Context bar:** breadcrumbs, current file/snapshot, scan freshness, and
  view-specific actions.
- **Main canvas:** route content, with optional right inspector (320–380px).

Routes:

`/dashboard`, `/files`, `/files/:fileId`, `/graph`, `/search`,
`/impact`, `/hotspots`, `/tests`. Query parameters hold snapshot, filters,
selected node, and search text so links are shareable and browser navigation
works.

## 3. Design tokens

### Typography

- UI font: Inter or system sans; code: JetBrains Mono or system monospace.
- Body 13–14px; labels 11–12px uppercase with letter spacing; headings 18–28px.
- Weight 400 body, 500 labels, 600 headings. Avoid ultra-bold display text.
- Line height 1.4 body, 1.25 headings, 1.55 code.

### Color

Dark default: near-black blue slate background, elevated surfaces one step
lighter, hairline borders with low alpha, cool-white primary text, muted slate
secondary text. Accent: electric cyan for links/selection, violet for symbols,
amber for warnings/hotspots, red only for errors, green for ready/success.
Every meaning also has text/icon; color never carries status alone.

Light theme can follow later. The first demo optimizes for dark developer
environments and readable contrast.

### Geometry

- 4px base spacing; common gaps 8, 12, 16, 24.
- 8px radius for controls/cards; 12px for panels; graph nodes 6px.
- Controls 32–36px high; primary buttons 36px; compact icon buttons 32px.
- Borders 1px; shadows shallow and cool, used only for floating surfaces.
- Dense tables use 36px rows; code rows use 20–22px.

### Component rules

Use only the primitives that improve the product: Button, IconButton, Input,
Select, Badge, Tabs, Tooltip, Dialog, Dropdown, Toast, Skeleton, EmptyState,
DataTable, Tree, CodeViewer, GraphCanvas, CommandPalette, and Inspector.
Cards group related evidence; they do not wrap every metric. Tables support
keyboard focus, row links, sort/filter, and empty/loading/error variants.

Icons use one consistent outline set at 16px/18px. Buttons pair icon and text
when meaning is not obvious. Tooltips explain unfamiliar graph controls and
collapsed navigation; never hide essential labels only in tooltips.

## 4. Screen specifications

### Dashboard / Repository Overview

**Purpose:** prove what repository is loaded and what RepoPilot discovered.

Layout: top repository identity strip; compact metric row (files, languages,
symbols, dependencies, tests); two-column body with language/file distribution
and “architecture at a glance”; recent scan warnings and suggested next actions.

Primary actions: choose repository, rescan, open Files, open Graph, search.
Metrics link to filtered views. Overview includes scan timestamp and snapshot
label so stale data is obvious.

Loading: progress header plus metric skeletons; show processed/total files.
Empty: “Load a repository to begin” with mount/path guidance. Error: retain
last snapshot, show warning count, retry/rescan buttons, diagnostic details.

### Files / File Explorer

**Purpose:** navigate the repository hierarchy quickly.

Layout: resizable left tree, center file list/code preview, optional right
metadata panel. Tree rows show folder/file icon, name, language dot, and count;
hidden generated/vendor groups are toggleable.

Actions: expand/collapse, filter path, sort, open file, copy relative path,
open graph around file, run impact. Keyboard arrows navigate tree; Enter opens.
Loading: preserve expanded paths and skeleton rows. Empty: no matching files or
empty repository explanation. Error: tree-level retry and last path retained.

### File Detail

**Purpose:** inspect source and local relationships.

Header: breadcrumbs, file path, language, size, scan hash, actions “Graph
around file” and “Analyze impact.” Main code viewer with line numbers,
search-in-file, symbol outline, and diagnostics. Right inspector tabs:
Symbols, Imports, Used by, Tests.

Loading: code skeleton and outline placeholders. Empty: binary/unsupported file
state with metadata and reason. Error: metadata remains while content error is
isolated. Clicking a symbol updates URL and inspector selection.

### Dependency Graph

**Purpose:** show architecture and relationships at a useful scale.

Toolbar: node type, direction, depth, grouping, relationship filters, search,
fit view, reset, minimap toggle, and “Analyze selected.” Canvas center; right
inspector shows selected node details, incoming/outgoing counts, evidence, and
actions. Directory/module grouping is default; file-level expansion is one
click.

Loading: canvas skeleton with progress/selected root. Empty: explain that no
resolved relationships exist and offer a broader filter. Error: retain graph
viewport if possible; show retry and filter reset. Large result: aggregate
groups, display truncation banner, require explicit expansion.

### Search

**Purpose:** keyboard-first repository-wide discovery.

Large search input auto-focuses; scope tabs: All, Files, Symbols, Imports,
Text. Results show type badge, name/path, line, snippet, and relationship
actions. Exact symbol matches rank above content hits. `Cmd/Ctrl+K` opens the
same global command/search surface; `/` focuses search when not in an input.

Loading: immediate query indicator and previous results retained. Empty: query-
specific guidance and example searches. Error: index unavailable explanation
with retry; never show a blank canvas.

### Impact Analysis

**Purpose:** make “what could this change affect?” the product’s memorable
feature.

Top control: changed file/symbol combobox with recent selections and path
search. Options: direction (reverse default), max depth, relationship kinds,
include tests/external. Result header: root path, snapshot, analysis duration,
summary counts.

Main body: left evidence chain/mini graph; center grouped results; right
inspector for the selected result. Groups are Direct dependents, Affected
modules, Transitive candidates, Potentially affected tests, and Unresolved or
external references. Each row includes distance, confidence, relationship, and
“Open file.” A “Why?” disclosure renders the exact chain.

Loading: staged progress (“Finding dependents”, “Ranking candidates”, “Linking
tests”) with cancel. Empty: “No reverse dependencies found” plus explanation
that the file may be a leaf. Error: preserve root and controls, offer retry or
lower depth. Language in the UI says **potentially affected**, not guaranteed
breakage.

### Hotspots

**Purpose:** prioritize inspection using transparent heuristics.

Table columns: file, score, fan-in, fan-out, size, symbol count, reasons. Filter
by metric/language/path; open file, graph, or impact. Explain score formula in a
tooltip/popover. Loading/empty/error variants match other tables.

### Tests

**Purpose:** show where change confidence can be checked.

Summary counts by framework/path; table of test files and linked production
files with confidence. Open test file or run impact from a production file.
Explicitly label convention-based links as heuristic.

## 5. Impact interaction detail

For `src/auth/AuthService.ts`, the screen opens with root chip and a compact
relationship map. Direct dependents are first and visually strongest. Selecting
`AuthController.ts` highlights the edge and reveals: “imports AuthService at
line 4.” Expanding the chain shows `LoginPage.tsx` at distance 2. The tests
group shows `auth.test.ts` direct and `session.test.ts` via `SessionManager`.

The left rail of the result view is a vertical chain with depth markers; the
center is a sortable result table; the right inspector is evidence. This keeps
the dependency chain legible even when the graph is filtered or disabled.

## 6. Graph UX

- Nodes: rounded compact rectangles with file/module icon, short label, path
  subtitle, language accent, and optional in/out degree badges.
- Edges: thin directional lines; arrowheads only at readable zoom; edge kind
  uses line pattern/label as well as color.
- Selected node: cyan outline, brighter label, connected edges emphasized,
  unrelated nodes dimmed but still visible.
- Hover: preview tooltip and connected-edge highlight; no layout jump.
- Zoom: wheel/pinch with sensible min/max; buttons for zoom in/out/fit/reset.
- Pan: middle mouse/space drag; keyboard focus exposes equivalent controls.
- Search: locate and select a node, preserving current filters.
- Grouping: directory/module/language clusters with expand/collapse; group
  nodes count as one node toward visual limits.
- Minimap: bottom-right toggle, keyboard accessible, hidden on narrow widths.
- Controls: relationship, direction, depth, node type, layout, filters, export
  later. Keep controls in one toolbar, not scattered over canvas.
- Relationship details: selection inspector lists edge kind, confidence, source
  line, target, and unresolved/external explanation.
- Large graphs: server-side neighborhood queries, aggregate groups, hard cap,
  truncation notice, and progressive expansion. Never render 50,000 nodes.
- Reduced motion: instant state changes and no animated layout for users who
  request reduced motion.

## 7. Command palette and shortcuts

`Cmd/Ctrl+K`: open command palette. Commands: go to route, switch repository,
open file, search symbols, rescan, toggle sidebar, open graph around current
file, run impact analysis. Arrow keys move, Enter executes, Escape closes.

`g d`: Dashboard; `g f`: Files; `g g`: Graph; `g s`: Search; `g i`: Impact.
`/`: focus contextual search. `Esc`: clear selection/close overlay. `?`: show
shortcut dialog. Never intercept shortcuts while a text input/editor has focus
unless explicitly using the command palette.

## 8. Notifications, breadcrumbs, and tooltips

Toasts report scan completion, index warnings, cancellation, and copy success;
they are dismissible and also recorded in a notification tray. Breadcrumbs show
repository / directory / file / symbol and each segment is navigable. Tooltips
explain metrics, graph relationship kinds, confidence labels, and disabled
actions; delay 400ms and remain keyboard/focus accessible.

## 9. Responsive behavior

- **1440px+:** full rail, tree + canvas + inspector where appropriate; graph
  minimap and wide evidence tables visible.
- **1280px:** full rail, inspector collapses to a drawer; tables preserve core
  columns and put secondary metrics in row detail.
- **1024px:** collapsed rail, single primary canvas, tree/inspector drawers;
  graph toolbar condenses into grouped controls.
- **Below 1024px:** maintain functional desktop-like workspace rather than
  forcing a mobile dashboard. Use stacked panels, horizontal table scrolling,
  and a clear “best on larger screen” notice. Core search/file/impact actions
  remain usable; large graph interactions may be read-only or deferred.

## 10. Accessibility

- Semantic landmarks: header, nav, main, complementary inspector, dialogs.
- Visible 2px focus ring with sufficient contrast; never remove outline without
  a replacement.
- Full keyboard path through rail, tree, tables, dialogs, graph controls, and
  result links. Roving tabindex for tree/graph node collections.
- ARIA labels for icon buttons; status/live region for scan progress and errors.
- Code viewer exposes line and symbol context to screen readers without
  requiring canvas access.
- Contrast target WCAG AA for text and controls; status uses icon + label.
- `prefers-reduced-motion` disables animated graph layouts and transitions.
- Graph provides an accessible list/table alternative with the same nodes,
  edges, relationship evidence, and selection actions. Canvas is never the only
  path to impact information.

## 11. State and component architecture

Route views own layout and compose reusable primitives. A typed API client and
query hooks own server state, caching by repository/snapshot/query. URL state
owns route, filters, selected IDs, and search query. Local state owns open
drawers, hover, temporary form values, and graph viewport. No global store in
the first implementation.

Required reusable states: `LoadingSkeleton`, `InlineError`, `EmptyState`,
`ScanProgress`, `StaleSnapshotBanner`, `EvidenceRow`, `PathBreadcrumbs`,
`EntityBadge`, `ConfidenceBadge`, `FilterBar`, and `InspectorPanel`.

## 12. Demo choreography

The opening screen names the repository and shows file/language/dependency
counts within five seconds of scan completion. A judge can click Graph from the
overview, select a highlighted auth file, and click Analyze selected. Search
and impact use the same entity IDs and breadcrumbs, so every transition feels
like one investigation instead of separate demos. The final click opens
`auth.test.ts`, proving the output leads to an actionable verification point.

## Phase 3D impact analysis

The Impact Analysis view calls `POST /api/v1/repositories/{id}/impact` with changed file IDs and a bounded depth. Results follow reverse internal dependencies, preserve evidence/path data, merge multiple roots, and exclude external/unresolved relationships.

## Phase 3E dependency graph

The graph screen is now API-backed and bounded. React Flow renders file nodes and dependency edges; backend projection owns snapshot, direction, traversal, and limits.

## Phase 3F hotspots

Hotspots now use real API data and show score, fan-in, fan-out, language, test status, and an explanation. Scores are static structural signals; historical Git churn is not currently used.

## Phase 3G test relationships

Tests now shows real static associations with strong direct-dependency or heuristic naming evidence. Runtime coverage and test execution are intentionally absent.
