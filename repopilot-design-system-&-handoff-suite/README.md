# RepoPilot — Frontend Design Handoff Package

> **Design Movement**: Technical Minimalist Instrument  
> **Theme**: Obsidian Telemetry  
> **Status**: Production-Ready Frontend Handoff for Implementation Agent

This repository contains the complete, self-contained, implementation-ready frontend design package for **RepoPilot**, a high-density workstation and codebase intelligence suite.

It is structured specifically for another coding agent or engineering team to build the backend AST parsing, Git mutation engine, and data services without altering the visual hierarchy, tokens, or layouts.

---

## 1. Visual Verification & Screen Mapping

Every screen from the 16 reference design attachments is recreated with 100% visual fidelity:

| Screen # | Screen Title | Reference Source File | Component Path | Key Visual Features |
|---|---|---|---|---|
| **01** | **Cybernetic Logo & Insignia** | `Image 1.png`, `Image 2.svg+xml` | `src/components/ui/Logo.tsx` | Reticle corner marks, glowing cyan 'R' path, violet/amber circuit tracks, 0px border |
| **02** | **Repository Cockpit** | `Image 6.jpeg` | `src/views/CockpitView.tsx` | Snapshot ready banner, 6 KPI cards, sparkline bars, clean worktree branch diagram, blast radius radar, wireframe terrain preview, heatmap preview, test matrix |
| **03** | **Source Files Explorer** | `Image 7.jpeg` | `src/views/FilesView.tsx` | Left repository folder tree with line tags & language chips; right source files table with language dots, fan-in `↔`, and sharp risk badges (Low, Medium, High) |
| **04** | **Interactive Dependency Graph** | `Image 8.jpeg` | `src/views/DependencyGraphView.tsx` | Dark circuit grid canvas, zoom/pan controls, 87 nodes · 214 edges pill, minimap, 6x6px sharp port sockets, node inspector drawer |
| **05** | **Signature Dependency Atlas** | `Image 3.jpeg` | `src/views/DependencyAtlasView.tsx` | Cyan/violet glow bus highway, circular imports analysis gauge, risk index dial (342), multi-tier microservice nodes, cyclic link chips |
| **06** | **AST Signal Map & Propagation** | `Image 4.png`, `Image 5.svg`, `Image 9.jpeg` | `src/views/ImpactAnalysisView.tsx` | 4-Stage pipeline (Target Symbol → Direct Consumers → Transitive Egress → Test Validation), animated glowing propagation tracer beam, blast radius high badge |
| **07** | **Structural Hotspots** | `Image 10.jpeg` | `src/views/HotspotsView.tsx` | Fan-In vs Churn scatter plot with nominal (cyan) and risk (amber) clusters, structural hotspots ranking table with score chips and Analyze impact actions |
| **08** | **Verification Surface & Tests** | `Image 11.jpeg` | `src/views/TestsView.tsx` | 4 KPI summary cards (Classified Tests, Statically Linked Invariants, Uncovered Source Files, Static Affinity 84.2%), detected test suites, source-to-test affinity matrix |
| **09** | **Git History & Lineage** | `Image 12.jpeg` | `src/views/HistoryView.tsx` | Continuous vertical cyan lineage beam with commit nodes, commit SHA badges, coupling & clean boundary tags, commit detail drawer with boundary warning |
| **10** | **Change Intelligence & Diff** | `Image 13.jpeg` | `src/views/ChangeIntelligenceView.tsx` | 3-pane workbench: Changed files with risk tags, side-by-side split diff viewer with red/green highlight blocks, risk auditor with blast scope & downstream impact tree |
| **11** | **Code Intelligence & Search** | `Image 14.jpeg` | `src/views/SearchView.tsx` | Filter chips (`type:symbol`, `lang:ts`, `path:packages/`), All/Files/Symbols/Tests tabs, grouped symbol tree, source code viewer with 34 callers badge and highlight bar |
| **12** | **Git Mutation Console** | `Image 15.jpeg` | `src/views/GitActionsView.tsx` | Staged files list with checkboxes and addition/deletion counts, commit scope card, branch creator/switcher, remote fetch/pull/push, stash ledger |
| **13** | **Command Palette (Cmd+K)** | `Image 16.jpeg` | `src/components/modals/CommandPalette.tsx` | Glowing cyan border floating dialog, category tabs (All, Navigation, Files, Symbols, Actions), keyboard shortcut tags (G D, G F, G G, etc.) |
| **14** | **Workspace Onboarding** | Implied Requirement | `src/views/OnboardingView.tsx` | Repository/directory path picker, branch selector, AST mode selector, recent codebases list, initialization trigger |

---

## 2. Design Tokens System (`Obsidian Telemetry`)

All design tokens are defined in `src/tokens/index.ts` and styled via Tailwind CSS v4 in `src/index.css`:

### A. Surfaces & Hairline Outlines
- **Canvas Base Backplane**: `#0B0E14` (ultra-deep matte carbon)
- **Primary Panel Surface**: `#111622` (instrument chassis, tool windows)
- **Card & Focus Trough**: `#182030` (active items, hovered table rows)
- **Sunken Trough**: `#161B28` (input troughs)
- **Razor Outlines**: `1px solid #1E2638`
- **High-Contrast Focused Outlines**: `1px solid #2D3A54`

### B. Semantic Intelligence Spectrum
- **Electric Cyan (`#00F2FE`)**: Active execution focal points, direct upstream, primary telemetry.
- **Synapse Violet (`#9D4EDD`)**: Transitive dependencies, symbol cross-references, AST node bindings.
- **Signal Amber (`#FFB703`)**: High churn nodes, cyclomatic complexity spikes, blast-radius warnings.
- **Matrix Emerald (`#06D6A0`)**: Statically confirmed test coverage, deterministic builds, clean git worktrees.
- **Laser Crimson (`#EF476F`)**: Breaking API changes, syntax failures, destructive actions, deleted diffs.

### C. Typography
- **Headlines & Subsystems**: `Space Grotesk` (600/700 weight, tight tracking)
- **Operational Prose & Labels**: `Geist` (400/500/600 weight)
- **Code & Telemetry**: `JetBrains Mono` (`tabular-nums`, 400/600 weight)

### D. Shapes & Dimensions
- **Sharpness Rule**: 0px border radius throughout the interface.
- **Action Buttons**: 28px height, 0px radius.
- **Inputs**: 32px height (24px compact).
- **Status Chips**: 18px height, monospaced 10px uppercase.
- **Tree Rows**: 26px height.
- **Table Rows**: 36px height.
- **Top / Activity Bars**: 48px fixed height.

---

## 3. Component Architecture

```
src/
├── components/
│   ├── handoff/
│   │   └── HandoffInspector.tsx    # Live spec inspector, state mode switcher & ZIP exporter
│   ├── layout/
│   │   ├── AppHeader.tsx           # 3-Zone top bar with breadcrumb & search
│   │   └── AppSidebar.tsx          # Docked navigation bar with badge counters
│   ├── modals/
│   │   └── CommandPalette.tsx      # Quick-open Cmd+K modal with shortcut navigation
│   └── ui/
│       ├── Badge.tsx               # Sharp 18px semantic status badges
│       ├── Breadcrumb.tsx          # Terminal-style breadcrumb navigation
│       ├── Button.tsx              # 28px primary, secondary, and icon utility buttons
│       ├── Card.tsx                # Instrument chassis panels with optional top hairline
│       ├── Input.tsx               # Razor input fields with monospace fonts
│       ├── Logo.tsx                # Cybernetic circuit 'R' logo
│       ├── StateView.tsx           # Empty, loading, and error states
│       └── Tabs.tsx                # Sharp underline and segmented filter tabs
├── data/
│   └── mockData.ts                 # Visual mock data matching screenshots exactly
├── tokens/
│   └── index.ts                    # Obsidian Telemetry design tokens
└── views/
    ├── CockpitView.tsx             # Overview dashboard (Image 6)
    ├── FilesView.tsx               # Files & tree explorer (Image 7)
    ├── DependencyGraphView.tsx     # Canvas dependency graph (Image 8)
    ├── DependencyAtlasView.tsx     # Signature dependency atlas (Image 3)
    ├── ImpactAnalysisView.tsx      # AST signal map & tracer (Images 4, 5, 9)
    ├── HotspotsView.tsx            # Structural hotspots & scatter (Image 10)
    ├── TestsView.tsx               # Tests & invariant affinity (Image 11)
    ├── HistoryView.tsx             # Git lineage timeline (Image 12)
    ├── ChangeIntelligenceView.tsx  # Side-by-side diff & risk (Image 13)
    ├── SearchView.tsx              # Code intelligence search (Image 14)
    ├── GitActionsView.tsx          # Git mutation console (Image 15)
    └── OnboardingView.tsx          # Repository connection & setup
```

---

## 4. State Completeness

Every view supports four operational states:
1. **Normal / Populated**: Real interactive layout populated with mock data.
2. **Loading**: Shimmering terminal skeleton and AST parsing progress gauge.
3. **Empty**: Zero-state illustration with corner reticles and action buttons.
4. **Error**: Red accent boundary with terminal traceback and retry affordance.

Use the top **View State** switcher in the Handoff Bar to preview and test each state.

---

## 5. Exporting the Handoff Package

Click the **Export Package (ZIP)** button in the top handoff toolbar to download the complete self-contained package containing all specifications, token JSONs, and component code.
