# RepoPilot — Backend & Full-Stack Implementation Spec

This document details the backend requirements, data contracts, and integration targets for the implementation agent.

---

## 1. Architecture Overview

RepoPilot is an AST-driven codebase intelligence and mutation workbench designed for large-scale polyglot monorepos. The frontend acts as a **Technical Minimalist Instrument** using the **Obsidian Telemetry** design system.

### Principles:
1. **Deterministic AST Static Analysis**: Does not execute untrusted source code; parses ASTs, tokenizes symbols, and computes fan-in/fan-out graph relationships.
2. **Reverse Dependency Egress**: Traces from a mutated target symbol outward into 1° direct consumers, 2° transitive callers, and mapped test suites.
3. **Safe Git Mutation Console**: Stages files explicitly, analyzes blast radius before commit, and inspects cross-module boundary warnings.

---

## 2. API Endpoints Required

### `GET /api/repo/summary`
Returns the overview metadata and high-level counts:
```json
{
  "name": "repo-pilot",
  "branch": "main",
  "scope": "local",
  "snapshot": "Snapshot 1",
  "snapshotStatus": "ANALYSIS READY",
  "snapshotDetail": "fully nally processed codebase",
  "metrics": {
    "filesIndexed": 87,
    "linesSLOC": 10064,
    "symbolsParsed": 31,
    "dependenciesResolved": 14,
    "testsClassified": 12,
    "cleanWorkingTree": true
  },
  "engineVersion": "v2.4.1 (Ready)"
}
```

### `GET /api/files/tree` & `GET /api/files/list`
Returns file tree hierarchy and source files list:
```json
[
  {
    "id": "1",
    "path": "src/api/router.ts",
    "name": "router.ts",
    "language": "TypeScript",
    "languageColor": "#3178C6",
    "fileSize": "1.2 KB",
    "lines": 23,
    "fanIn": 14,
    "impactRisk": "Low"
  }
]
```

### `GET /api/graph/dependencies`
Parameters: `depth` (number | 'all'), `filter` (string)
Returns:
```json
{
  "nodes": [
    { "id": "api/router.ts", "label": "api/router.ts", "sublabel": "API route", "category": "api", "fanIn": 14, "fanOut": 3, "risk": "Low" }
  ],
  "edges": [
    { "id": "e1", "source": "api/router.ts", "target": "core/auth.ts", "type": "direct" }
  ]
}
```

### `POST /api/analysis/blast-radius`
Payload: `{ "targetSymbol": "validateSession()", "targetFile": "tokenValidator.ts" }`
Returns the 4-stage pipeline:
```json
{
  "blastRadius": "HIGH",
  "totalBlastScope": 14,
  "directCount": 3,
  "transitiveCount": 8,
  "testSuitesMapped": 2,
  "uncoveredHotspots": 1,
  "directConsumers": [
    { "file": "auth/router.ts", "tag": "DIRECT", "inboundCalls": 3, "line": 42 }
  ],
  "transitiveEgress": [
    { "file": "controllers/user.ts", "tag": "TRANSITIVE", "callers": "14 Transitive Callers" }
  ],
  "testValidation": [
    { "file": "tokenValidator.test.ts", "status": "Passing", "cases": "12 Test Cases • Statically Linked" }
  ]
}
```

### `GET /api/signals/hotspots`
Returns ordered hotspots ranking:
```json
[
  {
    "rank": "#01",
    "path": "scripts/auth.js",
    "lines": 225,
    "callers": 42,
    "deps": 8,
    "score": 53.98,
    "signal": "High Fan-In + Rapid Churn"
  }
]
```

### `GET /api/git/commits` & `GET /api/git/diff`
Returns commit lineage and side-by-side diff additions/deletions.

---

## 3. UI Token Quick Reference

| Token Name | Hex Code | Purpose |
|---|---|---|
| `canvas.base` | `#0B0E14` | Viewport backplane |
| `canvas.panel` | `#111622` | Component & card background |
| `canvas.card` | `#182030` | Active item & hover row |
| `outline.razor` | `#1E2638` | Structural hairline (1px) |
| `outline.contrast` | `#2D3A54` | Focused handles |
| `spectrum.cyan` | `#00F2FE` | Focal execution, direct connections |
| `spectrum.violet` | `#9D4EDD` | Transitive dependencies |
| `spectrum.amber` | `#FFB703` | Blast radius warnings, hotspots |
| `spectrum.emerald` | `#06D6A0` | Statically verified tests, clean git |
| `spectrum.crimson` | `#EF476F` | Destructive mutations, uncovered hazards |

---

## 4. State Representation Checklist

Ensure that the client handles all 4 states on every view:
- [x] **Populated State**: Full data visualization matching design mocks.
- [x] **Loading State**: Shimmering terminal bars and progress indicators (`<LoadingState />`).
- [x] **Empty State**: Technical wireframe box with action button (`<EmptyState />`).
- [x] **Error State**: Laser Crimson banner with traceback (`<ErrorState />`).
