import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownLeft, ArrowUpRight, Bell, Braces, ChevronDown, ChevronRight,
  CircleHelp, Command, Database, FileCode2, Folder, GitBranch, Hash, LayoutDashboard,
  ListTree, Maximize2, Menu, Network, PanelLeft, Play, Search, Settings2, ShieldCheck,
  Sparkles, Terminal, TestTube2, TriangleAlert, X,
} from 'lucide-react'
import { api, RepositoryFile, Scan } from './lib/api/client'
import { Background, Controls, MiniMap, ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

type Page = 'Dashboard' | 'Files' | 'Dependency Graph' | 'Search' | 'Impact Analysis' | 'Hotspots' | 'Tests'

const nav = [
  { label: 'OVERVIEW', items: [{ label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'EXPLORE', items: [{ label: 'Files', icon: Folder }, { label: 'Dependency Graph', icon: Network }, { label: 'Search', icon: Search }] },
  { label: 'ANALYZE', items: [{ label: 'Impact Analysis', icon: Activity }, { label: 'Hotspots', icon: TriangleAlert }, { label: 'Tests', icon: TestTube2 }] },
]

const files = [
  { name: 'AuthService.ts', path: 'src/auth/AuthService.ts', type: 'ts', meta: '4.8 KB', selected: true },
  { name: 'AuthController.ts', path: 'src/auth/AuthController.ts', type: 'ts', meta: '3.1 KB' },
  { name: 'SessionManager.ts', path: 'src/session/SessionManager.ts', type: 'ts', meta: '2.7 KB' },
  { name: 'LoginPage.tsx', path: 'src/ui/LoginPage.tsx', type: 'tsx', meta: '6.4 KB' },
  { name: 'UserRepository.ts', path: 'src/users/UserRepository.ts', type: 'ts', meta: '1.9 KB' },
  { name: 'auth.test.ts', path: 'tests/auth.test.ts', type: 'test', meta: '3.3 KB' },
]

const impactGroups = [
  { title: 'Direct dependents', count: 3, tone: 'cyan', items: [
    ['AuthController.ts', 'Imports AuthService', 'src/auth/AuthController.ts', 'high'],
    ['SessionManager.ts', 'Imports AuthService', 'src/session/SessionManager.ts', 'high'],
    ['AuthMiddleware.ts', 'Uses AuthService', 'src/auth/AuthMiddleware.ts', 'high'],
  ] },
  { title: 'Potentially affected', count: 4, tone: 'violet', items: [
    ['LoginPage.tsx', 'Depends on AuthController', 'src/ui/LoginPage.tsx', 'medium'],
    ['UserService.ts', 'Depends on SessionManager', 'src/users/UserService.ts', 'medium'],
  ] },
  { title: 'Tests', count: 2, tone: 'amber', items: [
    ['auth.test.ts', 'Referenced by test', 'tests/auth.test.ts', 'high'],
    ['session.test.ts', 'Covers SessionManager', 'tests/session.test.ts', 'medium'],
  ] },
]

const codeLines = [
  ['1', "import { SessionManager } from '../session/SessionManager';", 'import'],
  ['2', "import { UserRepository } from '../users/UserRepository';", 'import'],
  ['3', '', ''],
  ['4', 'export class AuthService {', 'keyword'],
  ['5', '  private readonly sessions: SessionManager;', 'plain'],
  ['6', '  private readonly users: UserRepository;', 'plain'],
  ['7', '', ''],
  ['8', '  constructor(', 'plain'],
  ['9', '    sessions: SessionManager,', 'plain'],
  ['10', '    users: UserRepository,', 'plain'],
  ['11', '  ) {', 'plain'],
  ['12', '    this.sessions = sessions;', 'plain'],
  ['13', '    this.users = users;', 'plain'],
  ['14', '  }', 'plain'],
  ['15', '', ''],
  ['16', '  async authenticate(credentials: Credentials) {', 'function'],
  ['17', '    const user = await this.users.findByEmail(credentials.email);', 'plain'],
  ['18', '    if (!user || !verify(credentials, user.hash)) {', 'keyword'],
  ['19', "      throw new AuthError('Invalid credentials');", 'string'],
  ['20', '    }', 'plain'],
  ['21', '    return this.sessions.create(user.id);', 'function'],
  ['22', '  }', 'plain'],
  ['23', '}', 'keyword'],
]

function App() {
  const [page, setPage] = useState<Page>('Dashboard')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [backendReady, setBackendReady] = useState(false)

  useEffect(() => {
    api.health().then(() => setBackendReady(true)).catch(() => setBackendReady(false))
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen(true) }
      if (event.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return <div className="app-shell" data-backend-ready={backendReady}>
    <Sidebar page={page} setPage={setPage} open={sidebarOpen} />
    <main className="main-shell">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle navigation"><Menu size={17} /></button>
        <div className="crumb"><span className="crumb-repo"><Braces size={15} /> repopilot</span><ChevronRight size={13} /><span>main</span><ChevronRight size={13} /><span className="muted">{page}</span></div>
        <div className="top-actions"><button className="command-trigger" onClick={() => setPaletteOpen(true)}><Search size={15} /><span>Jump to anything</span><kbd>⌘ K</kbd></button><button className="icon-button" aria-label="Notifications"><Bell size={16} /><i className="notification-dot" /></button><button className="avatar">VP</button></div>
      </header>
      <div className="content-wrap">
        {page === 'Dashboard' && <Dashboard setPage={setPage} />}
        {page === 'Files' && <FilesView setPage={setPage} />}
        {page === 'Dependency Graph' && <GraphView setPage={setPage} />}
        {page === 'Search' && <SearchView setPage={setPage} />}
        {page === 'Impact Analysis' && <ImpactView setPage={setPage} />}
        {page === 'Hotspots' && <Hotspots />}
        {page === 'Tests' && <TestsView />}
      </div>
    </main>
    {paletteOpen && <CommandPalette close={() => setPaletteOpen(false)} setPage={setPage} />}
  </div>
}

function Sidebar({ page, setPage, open }: { page: Page; setPage: (page: Page) => void; open: boolean }) {
  return <aside className={`sidebar ${open ? '' : 'collapsed'}`}>
    <div className="brand"><div className="brand-mark"><span>R</span><span className="brand-cursor">_</span></div>{open && <div><strong>RepoPilot</strong><small>repository intelligence</small></div>}<button className="icon-button sidebar-toggle" aria-label="Collapse sidebar"><PanelLeft size={16} /></button></div>
    <div className="repo-switcher"><div className="repo-symbol"><GitBranch size={14} /></div>{open && <div className="repo-label"><strong>repopilot</strong><span>main · local</span></div>}{open && <ChevronDown size={14} className="muted" />}</div>
    <nav className="nav-sections">{nav.map(section => <div className="nav-section" key={section.label}><div className="nav-label">{open && section.label}</div>{section.items.map(item => <button key={item.label} className={`nav-item ${page === item.label ? 'active' : ''}`} onClick={() => setPage(item.label as Page)} title={item.label}><item.icon size={16} /><span>{open && item.label}</span>{open && item.label === 'Impact Analysis' && <span className="nav-hot">NEW</span>}</button>)}</div>)}</nav>
    <div className="sidebar-bottom"><div className="scan-status"><span className="status-pulse" />{open && <div><strong>Analysis ready</strong><span>2m ago · snapshot 01</span></div>}</div><button className="nav-item" title="Settings"><Settings2 size={16} />{open && <span>Settings</span>}</button><button className="nav-item" title="Help"><CircleHelp size={16} />{open && <span>Help & shortcuts</span>}</button></div>
  </aside>
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div> }
function Metric({ label, value, detail, icon: Icon, accent = '' }: { label: string; value: string; detail: string; icon: typeof Activity; accent?: string }) { return <div className={`metric ${accent}`}><div className="metric-top"><span>{label}</span><Icon size={15} /></div><strong>{value}</strong><small>{detail}</small></div> }
function Panel({ title, action, children, className = '' }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) { return <section className={`panel ${className}`}><div className="panel-head"><div><h2>{title}</h2></div>{action}</div>{children}</section> }
function Status({ children, tone = 'high' }: { children: React.ReactNode; tone?: string }) { return <span className={`status ${tone}`}><i />{children}</span> }

function Dashboard({ setPage }: { setPage: (p: Page) => void }) { return <>
  <PageHeader eyebrow="Repository overview / snapshot 01" title="Know what you're changing." description="A deterministic map of repopilot's structure, symbols, and relationships." action={<button className="button button-primary" onClick={() => setPage('Impact Analysis')}><Activity size={15} /> Analyze impact</button>} />
  <div className="repo-banner"><div className="repo-banner-icon"><Terminal size={22} /></div><div><strong>repopilot</strong><span>local workspace · <b>main</b></span></div><div className="repo-banner-meta"><Status>Analysis ready</Status><span>Scanned 2 minutes ago</span><button className="button button-quiet">Rescan <ArrowUpRight size={14} /></button></div></div>
  <div className="metrics-grid"><Metric label="Files" value="1,284" detail="+36 since last scan" icon={FileCode2} accent="cyan" /><Metric label="Lines of code" value="84.2k" detail="Across 6 languages" icon={Hash} /><Metric label="Symbols" value="7,619" detail="3,104 functions · 412 classes" icon={Braces} accent="violet" /><Metric label="Dependencies" value="2,847" detail="184 unresolved" icon={Network} /><Metric label="Tests" value="218" detail="76% linked to source" icon={TestTube2} accent="amber" /></div>
  <div className="dashboard-grid"><Panel title="Architecture at a glance" action={<button className="text-button" onClick={() => setPage('Dependency Graph')}>Open full graph <ArrowUpRight size={13} /></button>} className="architecture-panel"><MiniGraph /></Panel><Panel title="Repository composition" action={<button className="icon-button"><Maximize2 size={14} /></button>}><div className="composition"><div className="donut"><div><strong>6</strong><span>languages</span></div></div><div className="legend"><Legend name="TypeScript" value="48%" color="cyan" /><Legend name="Python" value="27%" color="violet" /><Legend name="TSX / JSX" value="15%" color="amber" /><Legend name="Other" value="10%" color="slate" /></div></div><div className="bar-stack"><span style={{ width: '48%' }} /><span style={{ width: '27%' }} /><span style={{ width: '15%' }} /><span style={{ width: '10%' }} /></div></Panel></div>
  <div className="dashboard-grid lower"><Panel title="High-connectivity modules" action={<button className="text-button" onClick={() => setPage('Hotspots')}>View hotspots <ArrowUpRight size={13} /></button>}><HotspotRows /></Panel><Panel title="Last scan notes"><div className="note-list"><div><span className="note-icon success"><ShieldCheck size={14} /></span><span><strong>Snapshot is consistent</strong><small>All indexed records share snapshot 01.</small></span></div><div><span className="note-icon warning"><TriangleAlert size={14} /></span><span><strong>184 unresolved imports</strong><small>Mostly package aliases in generated paths.</small></span></div></div></Panel></div>
</> }
function Legend({ name, value, color }: { name: string; value: string; color: string }) { return <div><span><i className={`dot ${color}`} />{name}</span><strong>{value}</strong></div> }
function MiniGraph() { return <div className="mini-graph"><div className="graph-grid" /><div className="graph-lines"><span className="line l1" /><span className="line l2" /><span className="line l3" /><span className="line l4" /></div><GraphNode x="center" title="src" sub="284 files" tone="root" /><GraphNode x="n1" title="auth" sub="34 files" tone="cyan" /><GraphNode x="n2" title="session" sub="18 files" tone="violet" /><GraphNode x="n3" title="ui" sub="92 files" tone="amber" /><GraphNode x="n4" title="tests" sub="76 files" tone="slate" /><div className="graph-caption"><span><i className="dot cyan" />Core modules</span><span><i className="dot amber" />Test surface</span><span>12 of 184 modules shown</span></div></div> }
function GraphNode({ x, title, sub, tone }: { x: string; title: string; sub: string; tone: string }) { return <div className={`graph-node ${x} ${tone}`}><div className="node-icon"><Braces size={13} /></div><div><strong>{title}</strong><span>{sub}</span></div></div> }
function HotspotRows() { return <div className="hotspot-list"><div><span className="rank">01</span><FileCode2 size={15} /><span><strong>AuthService.ts</strong><small>src/auth · 18 dependents</small></span><b className="hot-number">18</b></div><div><span className="rank">02</span><FileCode2 size={15} /><span><strong>Router.ts</strong><small>src/core · 15 dependents</small></span><b className="hot-number">15</b></div><div><span className="rank">03</span><FileCode2 size={15} /><span><strong>SessionManager.ts</strong><small>src/session · 12 dependents</small></span><b className="hot-number">12</b></div></div> }

function FilesView({ setPage }: { setPage: (p: Page) => void }) {
  const [expanded, setExpanded] = useState(true)
  const [repositoryId, setRepositoryId] = useState<number | null>(null)
  const [scan, setScan] = useState<Scan | null>(null)
  const [items, setItems] = useState<RepositoryFile[]>([])
  const [message, setMessage] = useState('')

  const refresh = async (id: number) => {
    try {
      const [latest, page] = await Promise.all([api.latestScan(id), api.files(id)])
      setScan(latest)
      setItems(page.items)
      setMessage('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load repository files')
    }
  }

  useEffect(() => {
    let cancelled = false
    api.repositories().then(async ({ items: repositories }) => {
      if (cancelled || repositories.length === 0) return
      setRepositoryId(repositories[0].id)
      await refresh(repositories[0].id)
    }).catch(() => setMessage('No repository is available'))
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!repositoryId || !scan || !['queued', 'scanning', 'finalizing'].includes(scan.status)) return
    const timer = window.setInterval(() => api.scan(repositoryId, scan.id).then(next => {
      setScan(next)
      if (next.status === 'ready') refresh(repositoryId)
    }).catch(() => setMessage('Unable to poll scan status')), 750)
    return () => window.clearInterval(timer)
  }, [repositoryId, scan?.id, scan?.status])

  const startScan = async () => {
    if (!repositoryId) return
    try { setScan(await api.startScan(repositoryId)); await refresh(repositoryId) } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to start scan') }
  }
  const action = <button className="button button-quiet" onClick={startScan} disabled={!repositoryId || ['queued', 'scanning', 'finalizing'].includes(scan?.status ?? '')}><Folder size={15} /> {scan?.status === 'ready' ? 'Rescan' : 'Scan repository'}</button>
  if (!repositoryId) return <><PageHeader eyebrow="Explore / repository tree" title="Files" description="Navigate every file, symbol, and relationship in context." action={action} /><div className="panel empty-files"><Folder size={24} /><strong>No repository loaded</strong><span>Register a repository from the API before scanning files.</span></div></>
  if (!scan) return <><PageHeader eyebrow="Explore / repository tree" title="Files" description="Navigate every file, symbol, and relationship in context." action={action} /><div className="panel empty-files"><Activity size={24} /><strong>Repository has not been scanned</strong><span>Start a scan to build the first file snapshot.</span></div>{message && <div className="error-line">{message}</div>}</>
  if (scan.status === 'failed') return <><PageHeader eyebrow="Explore / repository tree" title="Files" description="Navigate every file, symbol, and relationship in context." action={action} /><div className="panel empty-files"><TriangleAlert size={24} /><strong>Scan failed</strong><span>{scan.error_message ?? 'The repository could not be scanned.'}</span></div></>
  return <><PageHeader eyebrow={`Explore / repository tree · snapshot ${scan.id}`} title="Files" description="Navigate every file, symbol, and relationship in context." action={action} /><div className="scan-strip"><Status tone={scan.status === 'ready' ? 'high' : 'medium'}>{scan.status}</Status><span>{scan.processed_files} / {scan.discovered_files || '…'} files · {scan.percentage}%</span></div><div className="file-layout"><Panel title="Repository" action={<button className="icon-button"><Settings2 size={14} /></button>} className="file-tree-panel"><div className="tree-search"><Search size={14} /><span>Filter files...</span><kbd>/</kbd></div><div className="tree-root"><button onClick={() => setExpanded(!expanded)}><ChevronDown size={14} /><Folder size={15} className="folder-icon" /><strong>repository</strong></button>{expanded && <div className="tree-children"><TreeFolder name="Files" count={String(items.length)} open />{items.slice(0, 12).map(file => <TreeFolder key={file.id} name={file.name} file indent onClick={() => setPage('Files')} />)}</div>}</div></Panel><Panel title="Source files" action={<span className="muted">{items.length} files</span>} className="file-list-panel"><div className="file-toolbar"><span>{scan.statistics.file_count} files · {scan.statistics.total_lines} lines</span><button className="filter-button">All languages <ChevronDown size={13} /></button><button className="filter-button">Sorted by path <ChevronDown size={13} /></button></div><div className="file-table"><div className="table-head"><span>File</span><span>Language</span><span>Size</span><span>Lines</span></div>{items.map(file => <button className="file-row" key={file.id}><span><FileCode2 size={15} /><strong>{file.name}</strong><small>{file.relative_path}</small></span><span><i className={`lang-dot ${file.language.toLowerCase()}`} />{file.language}{file.is_test && ' · test'}</span><span>{formatBytes(file.size_bytes)}</span><span className="relation-count">{file.line_count ?? '—'}</span></button>)}</div></Panel></div></>
}

function formatBytes(value: number) { return value < 1024 ? `${value} B` : value < 1024 * 1024 ? `${(value / 1024).toFixed(1)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB` }
function TreeFolder({ name, count, file, selected, open, indent = false, indent2 = false, onClick }: { name: string; count?: string; file?: boolean; selected?: boolean; open?: boolean; indent?: boolean; indent2?: boolean; onClick?: () => void }) { return <button onClick={onClick} className={`tree-row ${selected ? 'selected' : ''} ${indent ? 'indent' : ''} ${indent2 ? 'indent2' : ''}`}>{file ? <FileCode2 size={14} /> : open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} {!file && <Folder size={14} className="folder-icon" />}<span>{name}</span>{count && <small>{count}</small>}</button> }

function GraphView({ setPage }: { setPage: (p: Page) => void }) { const [repositoryId, setRepositoryId] = useState<number|null>(null); const [root, setRoot] = useState<number|null>(null); const [depth, setDepth] = useState(2); const [direction, setDirection] = useState('both'); const [graph, setGraph] = useState<Awaited<ReturnType<typeof api.graph>>|null>(null); const [error, setError] = useState(''); useEffect(() => { api.repositories().then(({items}) => { if (items[0]) { setRepositoryId(items[0].id); api.files(items[0].id).then(({items: files}) => files[0] && setRoot(files[0].id)) } }).catch(() => setError('No repository loaded')) }, []); useEffect(() => { if (repositoryId && root) api.graph(repositoryId, root, direction, depth).then(setGraph).catch(() => setError('Graph unavailable')) }, [repositoryId, root, direction, depth]); const nodes = graph?.nodes.map((node, index) => ({ id: String(node.id), position: { x: (index % 3) * 210, y: Math.floor(index / 3) * 100 }, data: { label: <span className="flow-node"><strong>{node.name}</strong><small>{node.path}</small></span> }, className: node.id === root ? 'flow-root' : '' })) ?? []; const edges = graph?.edges.map(edge => ({ id: String(edge.id), source: String(edge.source), target: String(edge.target), animated: false, label: edge.imported_name })) ?? []; return <><PageHeader eyebrow="Explore / relationships" title="Dependency Graph" description="See how modules connect. Expand the neighborhood, not the noise." action={<button className="button button-primary" onClick={() => setPage('Impact Analysis')}><Activity size={15} /> Analyze selected</button>} /><div className="graph-toolbar"><select className="filter-button" value={direction} onChange={event => setDirection(event.target.value)}><option value="both">Both directions</option><option value="incoming">Dependents</option><option value="outgoing">Dependencies</option></select><select className="filter-button" value={depth} onChange={event => setDepth(Number(event.target.value))}><option value={0}>Depth 0</option><option value={1}>Depth 1</option><option value={2}>Depth 2</option><option value={3}>Depth 3</option></select><span className="toolbar-spacer" /><span className="muted">{graph ? `${graph.node_count} nodes · ${graph.edge_count} edges` : 'Loading graph…'}</span></div>{error && <div className="error-line">{error}</div>}{graph?.truncated && <div className="scan-strip"><TriangleAlert size={14} /> Graph bounded; expand by selecting a node.</div>}<div className="graph-workspace"><div className="graph-canvas"><ReactFlow nodes={nodes} edges={edges} fitView><Background color="#27313c" gap={28} /><MiniMap /><Controls /></ReactFlow></div><aside className="graph-inspector"><div className="inspector-kicker">SELECTED ROOT</div><div className="selected-file"><div className="file-symbol cyan-bg"><FileCode2 size={16} /></div><div><strong>{graph?.nodes.find(node => node.id === root)?.name ?? 'Select a file'}</strong><span>{graph?.nodes.find(node => node.id === root)?.path ?? 'No graph loaded'}</span></div></div><div className="inspector-section"><div className="inspector-title">Graph semantics</div><div className="relationship"><ArrowDownLeft size={13} /><span>Incoming = dependents</span></div><div className="relationship"><ArrowUpRight size={13} /><span>Outgoing = dependencies</span></div></div></aside></div><div className="graph-legend"><span><i className="legend-line cyan" />Internal dependency</span><span className="legend-note">Only READY snapshot relationships are shown</span></div></> }
function BigGraphNode({ className, title, path, tone }: { className: string; title: string; path: string; tone: string }) { return <div className={`big-node ${className} ${tone}`}><div className="node-icon"><FileCode2 size={14} /></div><div><strong>{title}</strong><span>{path}</span></div></div> }

function SearchView({ setPage }: { setPage: (p: Page) => void }) { const [query, setQuery] = useState('User'); const [results, setResults] = useState<import('./lib/api/client').SearchHit[]>([]); const [error, setError] = useState(''); useEffect(() => { const timer = window.setTimeout(() => api.repositories().then(({ items }) => items[0] && api.search(items[0].id, query).then(response => { setResults(response.items); setError('') }).catch(() => setError('Search unavailable'))).catch(() => setError('No repository loaded')), 250); return () => window.clearTimeout(timer) }, [query]); return <><PageHeader eyebrow="Explore / code intelligence" title="Search" description="Find files, symbols, and source text without leaving the repository." /><div className="search-input large"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} autoFocus placeholder="Search the repository" /><kbd>⌘ K</kbd></div><div className="search-tabs"><button className="active">All <b>{results.length}</b></button><button>Files</button><button>Symbols</button><button>Text</button></div><div className="search-layout"><Panel title={`${results.length} results`} action={<span className="muted">Deterministic relevance</span>} className="results-panel">{error ? <div className="empty-files"><TriangleAlert size={20} /><span>{error}</span></div> : results.length === 0 ? <div className="empty-files"><Search size={20} /><span>No matching files, symbols, or source text.</span></div> : <div className="result-list">{results.map(result => <Result key={`${result.type}-${result.file_id}-${result.symbol_id ?? ''}`} type={result.type.toUpperCase()} title={result.name} path={result.path} line={result.line ? String(result.line) : '—'} text={result.snippet} tone={result.type === 'symbol' ? 'cyan' : 'violet'} onClick={() => setPage('Files')} />)}</div>}</Panel><Panel title="Search tips" className="tips-panel"><div className="tip"><Command size={16} /><span><strong>Search symbols</strong><small>Names and qualified names rank above source matches.</small></span></div><div className="tip"><Hash size={16} /><span><strong>Search paths</strong><small>Use a filename or directory fragment.</small></span></div><div className="tip"><Network size={16} /><span><strong>Snapshot safe</strong><small>Results come only from the latest READY scan.</small></span></div></Panel></div></> }
function Result({ type, title, path, line, text, tone, onClick }: { type: string; title: string; path: string; line: string; text: string; tone: string; onClick?: () => void }) { return <button className="result-row" onClick={onClick}><span className={`result-type ${tone}`}>{type}</span><span className="result-main"><strong>{title}</strong><small>{path} <b>:{line}</b></small><code>{text}</code></span><ArrowUpRight size={15} /></button> }

function ImpactView({ setPage }: { setPage: (p: Page) => void }) { const [repositoryId, setRepositoryId] = useState<number | null>(null); const [fileId, setFileId] = useState<number | null>(null); const [path, setPath] = useState(''); const [depth, setDepth] = useState(3); const [result, setResult] = useState<import('./lib/api/client').ImpactItem[]>([]); const [counts, setCounts] = useState<Record<string, number>>({}); const [error, setError] = useState(''); useEffect(() => { api.repositories().then(({ items }) => { if (items[0]) { setRepositoryId(items[0].id); api.files(items[0].id).then(({ items: files }) => { if (files[0]) { setFileId(files[0].id); setPath(files[0].relative_path) } }) } }).catch(() => setError('No repository loaded')) }, []); const run = () => { if (repositoryId && fileId) api.impact(repositoryId, [fileId], depth).then(response => { setResult(response.affected_files); setCounts(response.counts); setError('') }).catch(() => setError('Impact analysis unavailable')) }; return <><PageHeader eyebrow="Analyze / change impact" title="What could this change affect?" description="Trace reverse dependencies with evidence, not guesses." action={<button className="button button-primary" onClick={run} disabled={!fileId}><Play size={14} /> Run analysis</button>} /><div className="impact-root"><div className="root-file"><div className="file-symbol cyan-bg"><FileCode2 size={17} /></div><div><span>Changed file</span><strong>{path || 'Select a file'}</strong><small>Selected repository file</small></div><ChevronDown size={15} /></div><div className="root-options"><span>Reverse dependencies <b>ON</b></span><span>Depth <select value={depth} onChange={event => setDepth(Number(event.target.value))}><option>1</option><option>2</option><option>3</option></select></span></div></div>{error && <div className="error-line">{error}</div>}<div className="impact-summary"><div><span className="summary-mark cyan"><ArrowDownLeft size={17} /></span><span><small>Directly affected</small><strong>{counts.direct ?? 0} <em>files</em></strong></span></div><div><span className="summary-mark violet"><Network size={17} /></span><span><small>Potentially affected</small><strong>{counts.transitive ?? 0} <em>files</em></strong></span></div><div><span className="summary-mark amber"><TestTube2 size={17} /></span><span><small>Total affected</small><strong>{counts.affected ?? 0} <em>files</em></strong></span></div><div className="confidence"><span><small>Relationship confidence</small><strong>Evidence-backed</strong></span><Status>Deterministic</Status></div></div><div className="impact-layout"><div className="impact-chain"><div className="impact-chain-head"><span>RELATIONSHIP PATHS</span><small>{result.length} files</small></div>{result.length === 0 ? <div className="empty-files"><Activity size={20} /><span>Run analysis to see affected files.</span></div> : result.map(item => <div className="chain-item" key={item.file_id}><span className={`chain-dot ${item.depth === 1 ? 'cyan' : 'violet'}`} /><strong>{item.path}</strong><small>Depth {item.depth} · {item.evidence[0]?.imported_name ?? 'dependency evidence'}</small></div>)}</div><Panel title="Potentially affected files" className="impact-results"><div className="impact-group-list">{result.length === 0 ? <div className="empty-files"><span>No affected files.</span></div> : result.map(item => <button key={item.file_id} className="impact-row" onClick={() => setPage('Files')}><span className={`impact-file-icon ${item.depth === 1 ? 'cyan' : 'violet'}`}><FileCode2 size={14} /></span><span><strong>{item.path}</strong><small>{item.dependency_path.map(node => node.path).join(' → ')}</small></span><span className="evidence"><b>Depth {item.depth}</b><small>{item.evidence[0]?.evidence ?? 'Internal dependency'}</small></span><ArrowUpRight size={14} /></button>)}</div></Panel></div></> }

function Hotspots() { const [items,setItems]=useState<import('./lib/api/client').Hotspot[]>([]);const [error,setError]=useState('');useEffect(()=>{api.repositories().then(({items:repos})=>repos[0]&&api.hotspots(repos[0].id).then(response=>setItems(response.items)).catch(()=>setError('Hotspots unavailable'))).catch(()=>setError('No repository loaded'))},[]);return <><PageHeader eyebrow="Analyze / repository signals" title="Hotspots" description="Files with the most structural reach, ranked by inspectable signals." />{error&&<div className="error-line">{error}</div>}<Panel title="Structural hotspots" action={<span className="muted">Static repository signals · no Git churn</span>}><div className="hotspot-table"><div className="table-head"><span>File</span><span>Score</span><span>Fan-in</span><span>Fan-out</span><span>Why</span></div>{items.length===0&&!error?<div className="empty-files"><Activity size={20}/><span>No eligible hotspot data.</span></div>:items.map(item=><div className="hotspot-table-row" key={item.file_id}><span><FileCode2 size={15}/><strong>{item.name}{item.is_test?' · test':''}</strong><small>{item.path} · {item.language}</small></span><b className="hot-number">{item.score}</b><span>{item.metrics.fan_in}</span><span>{item.metrics.fan_out}</span><span><Status tone={item.score>60?'high':'medium'}>{item.reasons[0]??'Structural signals'}</Status></span></div>)}</div></Panel></> }
function TestsView() { const [items,setItems]=useState<import('./lib/api/client').TestRelationship[]>([]);const [error,setError]=useState('');useEffect(()=>{api.repositories().then(({items:repos})=>repos[0]&&api.files(repos[0].id).then(({items:files})=>{const test=files.find(file=>file.is_test);if(test)api.testSources(repos[0].id,test.id).then(response=>setItems(response.items)).catch(()=>setError('Test relationships unavailable'))}).catch(()=>setError('Unable to load tests'))).catch(()=>setError('No repository loaded'))},[]);return <><PageHeader eyebrow="Analyze / verification surface" title="Tests" description="Static associations between tests and source files. No tests are executed." />{error&&<div className="error-line">{error}</div>}<Panel title="Test relationships" action={<span className="muted">Static evidence only</span>}><div className="test-table"><div className="table-head"><span>Test file</span><span>Source file</span><span>Relationship</span><span>Evidence</span></div>{items.length===0&&!error?<div className="empty-files"><TestTube2 size={20}/><span>No deterministic test relationships found.</span></div>:items.map(item=><div className="test-row" key={`${item.test_file_id}-${item.source_file_id}`}><span><TestTube2 size={15}/><strong>{item.test_path}</strong><small>associated test</small></span><span>{item.source_path}</span><span>{item.kind}</span><Status tone={item.evidence_level==='strong'?'high':'medium'}>{item.evidence_level}</Status></div>)}</div></Panel></> }

function CommandPalette({ close, setPage }: { close: () => void; setPage: (p: Page) => void }) { const commands: [Page, typeof LayoutDashboard][] = [['Dashboard', LayoutDashboard], ['Files', Folder], ['Dependency Graph', Network], ['Search', Search], ['Impact Analysis', Activity], ['Hotspots', TriangleAlert], ['Tests', TestTube2]]; return <div className="modal-backdrop" onMouseDown={close}><div className="command-palette" onMouseDown={e => e.stopPropagation()}><div className="palette-search"><Search size={17} /><input autoFocus placeholder="Jump to a view or search..." /><kbd>ESC</kbd></div><div className="palette-label">NAVIGATION</div>{commands.map(([label, Icon], index) => <button className={`palette-row ${index === 4 ? 'selected' : ''}`} key={label} onClick={() => { setPage(label); close() }}><Icon size={16} /><span>{label}</span>{index === 4 && <kbd>↵</kbd>}</button>)}<div className="palette-footer"><span><ArrowDownLeft size={13} /> Navigate</span><span><ArrowUpRight size={13} /> Open</span><span><X size={13} /> Close</span></div></div></div> }

export default App
