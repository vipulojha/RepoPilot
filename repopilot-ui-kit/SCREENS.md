# Screen briefs (used to create each screenshot)

## 01. Repository Tree & Source Files Inventory
- Subsystem: Core Explorer
- Metrics: 87 files • 10,064 lines • Impact Risk
- Tags: AST, Fan-In, Impact Risk, File Tree
- Hierarchical file tree with language markers (TypeScript, C#, JSON, Markdown), fan-in caller metrics, line counts, and impact risk tags (Low, Medium, High).

## 02. Repository Cockpit & Overview Telemetry
- Subsystem: Telemetry Dashboard
- Metrics: 87 files • 10,064 SLOC • 31 symbols
- Tags: Overview, SLOC, Blast Telemetry, Cockpit
- Primary repository health cockpit: 87 indexed files, 10,064 SLOC, 31 parsed symbols, 14 resolved dependencies, 12 classified tests, and clean working tree status.

## 03. Interactive Dependency Graph & Topological Map
- Subsystem: Graph Engine
- Metrics: 87 nodes • 214 edges • Depth 2
- Tags: Topology, Node-Link, Directed Graph, Minimap
- Topological dependency traversal view with depth selector (Depth 2), fit-to-screen, interactive node routing between api, core/auth, server, services/db, and Button component.

## 04. Structural Hotspots & Static Signals
- Subsystem: Signal Analyzer
- Metrics: Ranked Hotspots (#01 to #14) • Churn Plot
- Tags: Hotspots, Churn, High Fan-In, Complexity
- Static structural risk ranking evaluating caller density, dependency coupling, lines of code, and volatility score. Includes a fan-in vs score scatterplot.

## 05. Tests & Verification Surface Matrix
- Subsystem: Test Verifier
- Metrics: 12 test files • 342 invariants • 84.2% affinity
- Tags: Invariants, Affinity Matrix, Deterministic, Coverage
- Detected test suites with deterministic pass signals, source-to-test affinity mapping (tokenValidator.ts -> validatesSession()), and uncovered caller alerts.

## 06. Git History & Lineage Explorer
- Subsystem: VCS Intelligence
- Metrics: Lineage Graph • Cross-Module Warnings
- Tags: Git Lineage, Coupling, Boundary Check, Diff Scope
- Chronological commit stream with module coupling warnings (e.g. 5ce5f1e), clean boundary badges, commit diff details (+27/-7), and author attribution.

## 07. Impact Analysis & Blast Radius Projection
- Subsystem: Blast Radius Engine
- Metrics: 14 files blast scope • 3 direct • 8 transitive
- Tags: Blast Radius, 1° Ingress, 2° Downstream, Test Gap
- Multi-stage reverse dependency graph tracing target file & function (tokenValidator.ts validatesSession) through 1° direct dependents, 2° transitive dependents, and safety test gaps.

## 08. Change Intelligence & Side-by-Side Diff Auditor
- Subsystem: Diff Auditor
- Metrics: 14 files blast scope • High Risk Alert (34 callers)
- Tags: Split Diff, Syntax Highlighting, Risk Auditor, Mutation
- Side-by-side syntax-highlighted diff viewer for packages/auth/tokenValidator.ts with split view, real-time risk auditor, and downstream impact tree.

## 09. Code & Symbol Intelligence Search
- Subsystem: AST Search
- Metrics: 18 results • 4 files • 11 symbols • 3 tests
- Tags: AST Query, Token Search, Symbol Lookup, Callers
- High-speed multi-token AST query engine (validateSession type:symbol lang:ts path:packages/) with jump to source, caller badge (34 callers), and trace in graph actions.

## 10. Git Actions & Staging Mutation Console
- Subsystem: Mutation Worker
- Metrics: 3 files staged • Branch operations • Stash ledger
- Tags: Staged Scope, Commit Worker, Branch Switch, Stash
- Explicit repository mutation console with staged scope selector, commit message field [Cmd+Enter], branch creator/switcher, remote fetch/pull/push, and stash history.

## 11. Command Palette & Quick Open Overlay
- Subsystem: Command Dispatcher
- Metrics: Cmd+K Quick Open • Keyboard Shortcuts
- Tags: Quick Open, Keyboard Shortcuts, Cmd+K, Modal Drawer
- Cyan-glowing floating modal palette with tabs (All, Navigation, Files, Symbols, Actions), direct jump hotkeys (G D, G F, G G, G S, G I, G H, G T), and command triggers.
