/**
 * Mock data representation for RepoPilot UI Design Handoff.
 * Faithfully mirrors the visual data shown across all reference screenshots.
 */

export interface SourceFileItem {
  id: string;
  path: string;
  name: string;
  language: 'TypeScript' | 'C#' | 'JSON' | 'Markdown' | 'HTML' | 'Go' | 'Python' | 'Rust';
  languageColor: string;
  fileSize: string;
  lines: number;
  fanIn: number | null;
  impactRisk: 'Low' | 'Medium' | 'High';
}

export interface HotspotItem {
  rank: string;
  path: string;
  lines: number;
  callers: number;
  deps: number;
  score: number;
  signal: string;
}

export interface CommitItem {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  timestamp: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  tags?: { label: string; type: 'coupling' | 'clean' | 'warning' }[];
  details?: {
    files: { path: string; adds: number; dels: number }[];
    warning?: string;
  };
}

export interface GraphNode {
  id: string;
  label: string;
  sublabel: string;
  category: 'api' | 'core' | 'service' | 'model' | 'ui' | 'util' | 'middleware';
  x: number;
  y: number;
  fanIn: number;
  fanOut: number;
  risk: 'Low' | 'Medium' | 'High';
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'direct' | 'transitive' | 'cyclic';
}

export const REPO_SUMMARY = {
  name: 'repo-pilot',
  branch: 'main',
  scope: 'local',
  snapshot: 'Snapshot 1',
  snapshotStatus: 'ANALYSIS READY',
  snapshotDetail: 'fully nally processed codebase',
  metrics: {
    filesIndexed: 87,
    linesSLOC: 10064,
    symbolsParsed: 31,
    dependenciesResolved: 14,
    testsClassified: 12,
    cleanWorkingTree: true,
  },
  engineVersion: 'v2.4.1 (Ready)',
};

export const SOURCE_FILES: SourceFileItem[] = [
  { id: '1', path: 'src/api/router.ts', name: 'router.ts', language: 'TypeScript', languageColor: '#3178C6', fileSize: '1.2 KB', lines: 23, fanIn: 14, impactRisk: 'Low' },
  { id: '2', path: 'src/models/user.cs', name: 'user.cs', language: 'C#', languageColor: '#178600', fileSize: '2.2 KB', lines: 38, fanIn: 32, impactRisk: 'Medium' },
  { id: '3', path: 'package.json', name: 'package.json', language: 'JSON', languageColor: '#CB3837', fileSize: '1.8 KB', lines: 63, fanIn: null, impactRisk: 'Low' },
  { id: '4', path: 'README.md', name: 'README.md', language: 'Markdown', languageColor: '#083FA1', fileSize: '11.8 KB', lines: 317, fanIn: 5, impactRisk: 'Low' },
  { id: '5', path: 'src/core/auth.ts', name: 'auth.ts', language: 'TypeScript', languageColor: '#3178C6', fileSize: '5.4 KB', lines: 145, fanIn: 18, impactRisk: 'High' },
  { id: '6', path: 'src/api/server.cs', name: 'server.cs', language: 'C#', languageColor: '#178600', fileSize: '8.1 KB', lines: 210, fanIn: 45, impactRisk: 'High' },
  { id: '7', path: 'index.html', name: 'index.html', language: 'HTML', languageColor: '#E34F26', fileSize: '3.5 KB', lines: 92, fanIn: 2, impactRisk: 'Low' },
  { id: '8', path: 'src/core/utils.ts', name: 'utils.ts', language: 'TypeScript', languageColor: '#3178C6', fileSize: '4.2 KB', lines: 112, fanIn: 24, impactRisk: 'Medium' },
  { id: '9', path: 'packages/auth/tokenValidator.ts', name: 'tokenValidator.ts', language: 'TypeScript', languageColor: '#3178C6', fileSize: '6.8 KB', lines: 188, fanIn: 34, impactRisk: 'High' },
  { id: '10', path: 'services/inventoryService.cs', name: 'inventoryService.cs', language: 'C#', languageColor: '#178600', fileSize: '14.2 KB', lines: 448, fanIn: 22, impactRisk: 'Medium' },
];

export const HOTSPOTS_DATA: HotspotItem[] = [
  { rank: '#01', path: 'scripts/auth.js', lines: 225, callers: 42, deps: 8, score: 53.98, signal: 'High Fan-In + Rapid Churn' },
  { rank: '#02', path: 'wwwroot/css/site.css', lines: 1119, callers: 12, deps: 2, score: 50.00, signal: 'High Complexity' },
  { rank: '#03', path: 'Services/InventoryService.Operations.cs', lines: 1028, callers: 35, deps: 14, score: 48.37, signal: 'High Complexity, Zero Tests Linked' },
  { rank: '#04', path: 'lib/api.js', lines: 59, callers: 28, deps: 4, score: 44.34, signal: 'High Caller Density' },
  { rank: '#05', path: 'Services/InventoryService.Queries.cs', lines: 618, callers: 19, deps: 11, score: 41.02, signal: 'High Fan-In, Low Coverage' },
  { rank: '#06', path: 'lib/validators.js', lines: 47, callers: 15, deps: 3, score: 39.68, signal: 'Rapid Structural Mutation' },
  { rank: '#07', path: 'lib/otp.js', lines: 28, callers: 14, deps: 2, score: 39.34, signal: 'Critical Dependencies' },
  { rank: '#08', path: 'Services/InventoryService.cs', lines: 448, callers: 22, deps: 9, score: 37.97, signal: 'Complex Dependencies' },
  { rank: '#09', path: 'lib/password.js', lines: 39, callers: 12, deps: 2, score: 37.31, signal: 'Low Test Coverage' },
  { rank: '#10', path: 'styles/site.css', lines: 326, callers: 11, deps: 1, score: 35.79, signal: 'High Style Churn' },
  { rank: '#11', path: 'package-lock.json', lines: 317, callers: 8, deps: 112, score: 35.63, signal: 'Frequent Dependency Churn' },
  { rank: '#12', path: 'lib/email.js', lines: 53, callers: 9, deps: 3, score: 35.34, signal: 'Moderate Volatility' },
  { rank: '#13', path: 'lib/db.js', lines: 35, callers: 13, deps: 2, score: 35.02, signal: 'Sensitive Hotspot' },
  { rank: '#14', path: 'products/index.html', lines: 269, callers: 6, deps: 1, score: 34.77, signal: 'High Markup Complexity' },
];

export const HISTORY_COMMITS: CommitItem[] = [
  {
    hash: 'b11c2a8c3d98ef9182a392812938128312983192',
    shortHash: 'b11c2a8',
    message: 'Change deployment link in README',
    author: 'Vipul Ojha',
    timestamp: '3/14/2026, 5:59 PM',
    filesChanged: 1,
    additions: 1,
    deletions: 1,
    tags: [{ label: '+2 Cross-Module Coupling', type: 'coupling' }],
  },
  {
    hash: 'ee28f04123891028391023812903810238102938',
    shortHash: 'ee28f04',
    message: 'Fix purchase attribution, auth headers, and dropdown UI visibility',
    author: 'Vipul Ojha',
    timestamp: '3/14/2026, 5:59 PM',
    filesChanged: 1,
    additions: 1,
    deletions: 2,
  },
  {
    hash: '5ce5f1e102938102938109283019283019283019',
    shortHash: '5ce5f1e',
    message: "Refined landing page headline to 'Inventory Redefined' for enterprise focus",
    author: 'Vipul Ojha',
    timestamp: '3/14/2026, 5:59 PM',
    filesChanged: 3,
    additions: 27,
    deletions: 7,
    details: {
      warning: 'High-Impact warning: module boundary cross',
      files: [
        { path: 'README.md', adds: 1, dels: 1 },
        { path: 'src/auth.ts', adds: 1, dels: 1 },
        { path: 'src/auth.ts', adds: 1, dels: 1 },
        { path: 'src/auth.ts', adds: 1, dels: 1 },
        { path: 'src/auth.ts', adds: 1, dels: 1 },
        { path: 'README.suite.md', adds: 1, dels: 1 },
        { path: 'peer_main.ts', adds: 1, dels: 1 },
        { path: 'src/auth.ts', adds: 1, dels: 1 },
      ],
    },
  },
  {
    hash: '23da5f0019283019283019283019283019283019',
    shortHash: '23da5f0',
    message: 'Ultra-Premium README overhaul with architectural & security notes',
    author: 'Vipul Ojha',
    timestamp: '3/14/2026, 5:59 PM',
    filesChanged: 3,
    additions: 27,
    deletions: 7,
    tags: [{ label: 'Clean Boundary', type: 'clean' }],
  },
  {
    hash: 'ee20f04019283019283019283019283019283019',
    shortHash: 'ee20f04',
    message: 'Ultra-Premium README backup with arrsecurity notes',
    author: 'Vipul Ojha',
    timestamp: '3/14/2026, 5:59 PM',
    filesChanged: 3,
    additions: 27,
    deletions: 7,
    tags: [{ label: 'Clean Boundary', type: 'clean' }],
  },
  {
    hash: 'ee28f04b12398129038192038102938102938102',
    shortHash: 'ee28f04',
    message: 'Change deployment link in README to dynamic for mentions',
    author: 'Vipul Ojha',
    timestamp: '3/14/2026, 5:59 PM',
    filesChanged: 3,
    additions: 27,
    deletions: 7,
    tags: [{ label: '+2 Cross-Boundary', type: 'coupling' }],
  },
  {
    hash: '5ce5f1e102938102938109283019283019283020',
    shortHash: '5ce5f1e',
    message: 'Refined deployment names on and enter meetup',
    author: 'Vipul Ojha',
    timestamp: '3/14/2026, 5:59 PM',
    filesChanged: 3,
    additions: 27,
    deletions: 7,
    tags: [{ label: 'Clean Boundary', type: 'clean' }],
  },
];

export const GRAPH_NODES: GraphNode[] = [
  { id: 'api/router.ts', label: 'api/router.ts', sublabel: 'API route', category: 'api', x: 420, y: 60, fanIn: 14, fanOut: 3, risk: 'Low' },
  { id: 'core/auth.ts', label: 'core/auth.ts', sublabel: 'Security/Auth', category: 'core', x: 420, y: 190, fanIn: 18, fanOut: 5, risk: 'High' },
  { id: 'core/auth_left.ts', label: 'core/auth.ts', sublabel: 'Security/Auth', category: 'core', x: 120, y: 340, fanIn: 6, fanOut: 2, risk: 'Medium' },
  { id: 'models/user.cs', label: 'models/user.cs', sublabel: 'Models', category: 'model', x: 260, y: 340, fanIn: 32, fanOut: 4, risk: 'Medium' },
  { id: 'server.cs', label: 'server.cs', sublabel: 'Main entry', category: 'api', x: 420, y: 340, fanIn: 45, fanOut: 6, risk: 'High' },
  { id: 'services/db.ts', label: 'services/db.ts', sublabel: 'Database service', category: 'service', x: 580, y: 340, fanIn: 24, fanOut: 3, risk: 'Medium' },
  { id: 'middleware/error.ts', label: 'middleware/error.ts', sublabel: 'UI component', category: 'middleware', x: 740, y: 340, fanIn: 12, fanOut: 2, risk: 'Low' },
  { id: 'utils/logger.ts', label: 'utils/logger.ts', sublabel: 'Utility', category: 'util', x: 260, y: 480, fanIn: 28, fanOut: 1, risk: 'Low' },
  { id: 'services/db_sub.ts', label: 'services/db.ts', sublabel: 'Database service', category: 'service', x: 420, y: 480, fanIn: 19, fanOut: 2, risk: 'Medium' },
  { id: 'middleware/error_sub.ts', label: 'middleware/error.ts', sublabel: 'Middleware', category: 'middleware', x: 580, y: 480, fanIn: 10, fanOut: 1, risk: 'Low' },
  { id: 'components/Button.tsx', label: 'components/Button.tsx', sublabel: 'UI component', category: 'ui', x: 420, y: 620, fanIn: 8, fanOut: 0, risk: 'Low' },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { id: 'e1', source: 'api/router.ts', target: 'core/auth.ts', type: 'direct' },
  { id: 'e2', source: 'api/router.ts', target: 'server.cs', type: 'direct' },
  { id: 'e3', source: 'api/router.ts', target: 'services/db.ts', type: 'direct' },
  { id: 'e4', source: 'core/auth.ts', target: 'server.cs', type: 'direct' },
  { id: 'e5', source: 'core/auth.ts', target: 'models/user.cs', type: 'direct' },
  { id: 'e6', source: 'server.cs', target: 'services/db_sub.ts', type: 'direct' },
  { id: 'e7', source: 'models/user.cs', target: 'utils/logger.ts', type: 'direct' },
  { id: 'e8', source: 'models/user.cs', target: 'services/db_sub.ts', type: 'direct' },
  { id: 'e9', source: 'utils/logger.ts', target: 'components/Button.tsx', type: 'direct' },
  { id: 'e10', source: 'services/db_sub.ts', target: 'components/Button.tsx', type: 'direct' },
  { id: 'e11', source: 'core/auth_left.ts', target: 'components/Button.tsx', type: 'direct' },
  { id: 'e12', source: 'core/auth.ts', target: 'middleware/error.ts', type: 'transitive' },
  { id: 'e13', source: 'services/db.ts', target: 'middleware/error_sub.ts', type: 'transitive' },
  { id: 'e14', source: 'middleware/error.ts', target: 'services/db.ts', type: 'transitive' },
  { id: 'e15', source: 'api/router.ts', target: 'components/Button.tsx', type: 'transitive' },
];

export const AST_SIGNAL_PIPELINE = {
  blastRadius: 'HIGH',
  totalBlastScope: 14,
  directCount: 3,
  transitiveCount: 8,
  testSuitesMapped: 2,
  uncoveredHotspots: 1,
  target: {
    symbol: 'validateSession()',
    file: 'tokenValidator.ts',
    fanIn: 'High',
    mutationSource: true,
  },
  directConsumers: [
    { file: 'auth/router.ts', tag: 'DIRECT', inboundCalls: 3, line: 42 },
    { file: 'api/authMiddleware.ts', tag: 'DIRECT', inboundCalls: 1, line: 18 },
    { file: 'core/sessionContext.ts', tag: 'DIRECT', inboundCalls: 8, line: 95 },
  ],
  transitiveEgress: [
    { file: 'controllers/user.ts', tag: 'TRANSITIVE', callers: '14 Transitive Callers', targetTest: 'tokenValidator.test.ts' },
    { file: 'jobs/tokenPrune.ts', tag: 'TRANSITIVE', callers: 'Background Worker', targetTest: 'userController.test.ts' },
    { file: 'gateway/proxyRoute.ts', tag: 'TRANSITIVE', callers: 'External Edge Ingress', targetTest: 'proxyRoute.ts' },
  ],
  testValidation: [
    {
      file: 'tokenValidator.test.ts',
      status: 'Passing',
      tag: 'STATIC LINKED',
      cases: '12 Test Cases • Statically Linked',
      detail: 'Status: PASSING (Deterministic)',
      type: 'passing',
    },
    {
      file: 'userController.test.ts',
      status: 'Untested Risk',
      tag: 'SAFETY GAP',
      cases: 'Test Safety Net Missing',
      detail: 'Indirect caller untested',
      type: 'warning',
    },
    {
      file: 'proxyRoute.ts',
      status: 'Uncovered Hotspot',
      tag: 'HOTSPOT',
      cases: 'UNCOVERED HOTSPOT',
      detail: 'Fan-in: 34 • 0 tests mapped',
      type: 'error',
    },
  ],
};

export const DIFF_DATA = {
  file: 'packages/auth/tokenValidator.ts',
  changedFiles: [
    { path: 'packages/auth/tokenValidator.ts', risk: 'High Risk', additions: 42, deletions: 6, selected: true },
    { path: 'packages/server/router.ts', risk: 'Low', additions: 12, deletions: 0, selected: false },
    { path: 'core/sessionContext.ts', risk: 'Low', additions: 8, deletions: 1, selected: false },
  ],
  stats: {
    blastScope: 14,
    affectedSymbols: ['validateSessionToken'],
    mappedSuites: ['tests/auth.test.ts', 'tests/session.test.ts'],
    downstream: [
      { name: 'validateSessionToken', children: ['dependent services', 'routes/services', 'routes'] },
    ],
  },
  leftLines: [
    { num: 1, code: "import { routes } from 'packages';", type: 'normal' },
    { num: 2, code: "import { router } from 'routers';", type: 'normal' },
    { num: 3, code: "import { validationContext } from 'userreason';", type: 'normal' },
    { num: 4, code: "import from '.request';", type: 'normal' },
    { num: 5, code: 'export function validateSessionToken(conten) {', type: 'normal' },
    { num: 6, code: '-   const validate session;', type: 'del' },
    { num: 7, code: '', type: 'empty' },
    { num: 8, code: '    export validateSessionToken(validateSessionToken', type: 'del' },
    { num: 9, code: '    const validateValidation.logic) {', type: 'del' },
    { num: 10, code: '    if (selected) {', type: 'del' },
    { num: 11, code: '        validateSession = false;', type: 'del' },
    { num: 12, code: '    }', type: 'del' },
    { num: 13, code: '', type: 'empty' },
    { num: 14, code: '    if (validateSessionToken.login) {', type: 'del' },
    { num: 15, code: '        return validateSessionToken(validateSession;', type: 'del' },
    { num: 16, code: '    }', type: 'del' },
    { num: 17, code: '', type: 'empty' },
    { num: 18, code: '    } else {', type: 'del' },
    { num: 19, code: '        return false;', type: 'del' },
    { num: 20, code: '    }', type: 'del' },
  ],
  rightLines: [
    { num: 1, code: "import { routes } from 'packages';", type: 'normal' },
    { num: 2, code: "import { router } from 'routers';", type: 'normal' },
    { num: 3, code: "import { validationContext } from 'userreason';", type: 'normal' },
    { num: 4, code: "import from '.request';", type: 'normal' },
    { num: 5, code: 'export function validateSessionToken(token) {', type: 'normal' },
    { num: 6, code: '+   const validate session;', type: 'add' },
    { num: 7, code: '    export validateSessionToken(validateSessionToken) {', type: 'add' },
    { num: 8, code: '+   const validateSessionToken(context) {', type: 'add' },
    { num: 9, code: '+   if (valSelected === logic1) {', type: 'add' },
    { num: 10, code: '+       validateSession = false;', type: 'add' },
    { num: 11, code: '+   }', type: 'add' },
    { num: 12, code: '+   if (validateSessionToken.logic) {', type: 'add' },
    { num: 13, code: '+       if (validateSession.length) {', type: 'add' },
    { num: 14, code: '+           return "validateSessionToken(validateSession)";', type: 'add' },
    { num: 15, code: '+       }', type: 'add' },
    { num: 16, code: '+   }', type: 'add' },
    { num: 17, code: '+   else {', type: 'add' },
    { num: 18, code: '+       return false;', type: 'add' },
    { num: 19, code: '+   }', type: 'add' },
  ],
};

export const SEARCH_DATA = {
  query: 'validateSession',
  chips: [
    { key: 'type', value: 'symbol', color: '#9D4EDD' },
    { key: 'lang', value: 'ts', color: '#00F2FE' },
    { key: 'path', value: 'packages/', color: '#06D6A0' },
  ],
  counts: { all: 18, files: 4, symbols: 11, tests: 3 },
  results: [
    {
      file: 'packages/auth/tokenValidator.ts',
      line: 42,
      symbols: [
        { name: 'validateSession', active: true },
        { name: 'validateSessionToken' },
        { name: 'validateSessionTokens' },
        { name: 'validateSessionMission' },
        { name: 'validateSessionToken' },
      ],
    },
    {
      file: 'packages/auth/session.ts',
      line: 12,
      symbols: [{ name: 'validateSessionToken' }],
    },
    {
      file: 'packages/api/middleware.ts',
      line: 89,
      symbols: [{ name: 'validateSession' }],
    },
  ],
  previewCode: [
    { line: 39, code: "import { Session } from 'app/auth';" },
    { line: 40, code: "import { Sessioning } from './appads/auth';" },
    { line: 41, code: '' },
    { line: 41, code: 'export function validateSessionToken(token: string): Session | null {' },
    { line: 42, code: '    export session validateSession(token);', highlight: true },
    { line: 43, code: '    if ((sessions = onSession.Token.sessions | null)) {' },
    { line: 44, code: '        return null;' },
    { line: 45, code: '    }' },
    { line: 45, code: '}' },
  ],
};
