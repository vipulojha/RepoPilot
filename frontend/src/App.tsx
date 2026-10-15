import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownLeft, ArrowUpRight, Bell, Braces, ChevronDown, ChevronRight,
  CircleHelp, Command, Database, FileCode2, Folder, GitBranch, Hash, LayoutDashboard,
  ListTree, Maximize2, Menu, Network, PanelLeft, Play, Search, Settings2, ShieldCheck,
  Sparkles, Terminal, TestTube2, TriangleAlert, X,
} from 'lucide-react'

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen(true) }
      if (event.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return <div className="app-shell">
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
  <div className="repo-banner"><div className="repo-banner-icon"><Terminal size={22} /></div><div><strong>repopilot</strong><span>/home/RepoPilot · <b>main</b></span></div><div className="repo-banner-meta"><Status>Analysis ready</Status><span>Scanned 2 minutes ago</span><button className="button button-quiet">Rescan <ArrowUpRight size={14} /></button></div></div>
  <div className="metrics-grid"><Metric label="Files" value="1,284" detail="+36 since last scan" icon={FileCode2} accent="cyan" /><Metric label="Lines of code" value="84.2k" detail="Across 6 languages" icon={Hash} /><Metric label="Symbols" value="7,619" detail="3,104 functions · 412 classes" icon={Braces} accent="violet" /><Metric label="Dependencies" value="2,847" detail="184 unresolved" icon={Network} /><Metric label="Tests" value="218" detail="76% linked to source" icon={TestTube2} accent="amber" /></div>
  <div className="dashboard-grid"><Panel title="Architecture at a glance" action={<button className="text-button" onClick={() => setPage('Dependency Graph')}>Open full graph <ArrowUpRight size={13} /></button>} className="architecture-panel"><MiniGraph /></Panel><Panel title="Repository composition" action={<button className="icon-button"><Maximize2 size={14} /></button>}><div className="composition"><div className="donut"><div><strong>6</strong><span>languages</span></div></div><div className="legend"><Legend name="TypeScript" value="48%" color="cyan" /><Legend name="Python" value="27%" color="violet" /><Legend name="TSX / JSX" value="15%" color="amber" /><Legend name="Other" value="10%" color="slate" /></div></div><div className="bar-stack"><span style={{ width: '48%' }} /><span style={{ width: '27%' }} /><span style={{ width: '15%' }} /><span style={{ width: '10%' }} /></div></Panel></div>
  <div className="dashboard-grid lower"><Panel title="High-connectivity modules" action={<button className="text-button" onClick={() => setPage('Hotspots')}>View hotspots <ArrowUpRight size={13} /></button>}><HotspotRows /></Panel><Panel title="Last scan notes"><div className="note-list"><div><span className="note-icon success"><ShieldCheck size={14} /></span><span><strong>Snapshot is consistent</strong><small>All indexed records share snapshot 01.</small></span></div><div><span className="note-icon warning"><TriangleAlert size={14} /></span><span><strong>184 unresolved imports</strong><small>Mostly package aliases in generated paths.</small></span></div></div></Panel></div>
</> }
function Legend({ name, value, color }: { name: string; value: string; color: string }) { return <div><span><i className={`dot ${color}`} />{name}</span><strong>{value}</strong></div> }
function MiniGraph() { return <div className="mini-graph"><div className="graph-grid" /><div className="graph-lines"><span className="line l1" /><span className="line l2" /><span className="line l3" /><span className="line l4" /></div><GraphNode x="center" title="src" sub="284 files" tone="root" /><GraphNode x="n1" title="auth" sub="34 files" tone="cyan" /><GraphNode x="n2" title="session" sub="18 files" tone="violet" /><GraphNode x="n3" title="ui" sub="92 files" tone="amber" /><GraphNode x="n4" title="tests" sub="76 files" tone="slate" /><div className="graph-caption"><span><i className="dot cyan" />Core modules</span><span><i className="dot amber" />Test surface</span><span>12 of 184 modules shown</span></div></div> }
function GraphNode({ x, title, sub, tone }: { x: string; title: string; sub: string; tone: string }) { return <div className={`graph-node ${x} ${tone}`}><div className="node-icon"><Braces size={13} /></div><div><strong>{title}</strong><span>{sub}</span></div></div> }
function HotspotRows() { return <div className="hotspot-list"><div><span className="rank">01</span><FileCode2 size={15} /><span><strong>AuthService.ts</strong><small>src/auth · 18 dependents</small></span><b className="hot-number">18</b></div><div><span className="rank">02</span><FileCode2 size={15} /><span><strong>Router.ts</strong><small>src/core · 15 dependents</small></span><b className="hot-number">15</b></div><div><span className="rank">03</span><FileCode2 size={15} /><span><strong>SessionManager.ts</strong><small>src/session · 12 dependents</small></span><b className="hot-number">12</b></div></div> }

function FilesView({ setPage }: { setPage: (p: Page) => void }) { const [expanded, setExpanded] = useState(true); return <><PageHeader eyebrow="Explore / repository tree" title="Files" description="Navigate every file, symbol, and relationship in context." action={<button className="button button-quiet"><Folder size={15} /> Add repository</button>} /><div className="file-layout"><Panel title="Repository" action={<button className="icon-button"><Settings2 size={14} /></button>} className="file-tree-panel"><div className="tree-search"><Search size={14} /><span>Filter files...</span><kbd>/</kbd></div><div className="tree-root"><button onClick={() => setExpanded(!expanded)}><ChevronDown size={14} /><Folder size={15} className="folder-icon" /><strong>repopilot</strong></button>{expanded && <div className="tree-children"><TreeFolder name="src" count="284" open /><TreeFolder name="auth" count="34" open indent /><TreeFolder name="AuthService.ts" file selected indent2 onClick={() => setPage('Impact Analysis')} /><TreeFolder name="AuthController.ts" file indent2 /><TreeFolder name="SessionManager.ts" file indent /><TreeFolder name="ui" count="92" open /><TreeFolder name="tests" count="76" /></div>}</div></Panel><Panel title="Source files" action={<div className="view-toggle"><button className="active">List</button><button>Stats</button></div>} className="file-list-panel"><div className="file-toolbar"><span>1,284 files</span><button className="filter-button">All languages <ChevronDown size={13} /></button><button className="filter-button">Sort: relevance <ChevronDown size={13} /></button></div><div className="file-table"><div className="table-head"><span>File</span><span>Language</span><span>Size</span><span>Relations</span></div>{files.map(file => <button className={`file-row ${file.selected ? 'selected' : ''}`} key={file.path} onClick={() => file.selected && setPage('Impact Analysis')}><span><FileCode2 size={15} /><strong>{file.name}</strong><small>{file.path}</small></span><span><i className={`lang-dot ${file.type}`} />{file.type === 'test' ? 'TypeScript test' : file.type.toUpperCase()}</span><span>{file.meta}</span><span className="relation-count">{file.selected ? '18' : '—'}</span></button>)}</div></Panel></div></> }
function TreeFolder({ name, count, file, selected, open, indent = false, indent2 = false, onClick }: { name: string; count?: string; file?: boolean; selected?: boolean; open?: boolean; indent?: boolean; indent2?: boolean; onClick?: () => void }) { return <button onClick={onClick} className={`tree-row ${selected ? 'selected' : ''} ${indent ? 'indent' : ''} ${indent2 ? 'indent2' : ''}`}>{file ? <FileCode2 size={14} /> : open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} {!file && <Folder size={14} className="folder-icon" />}<span>{name}</span>{count && <small>{count}</small>}</button> }

function GraphView({ setPage }: { setPage: (p: Page) => void }) { return <><PageHeader eyebrow="Explore / relationships" title="Dependency Graph" description="See how modules connect. Expand the neighborhood, not the noise." action={<button className="button button-primary" onClick={() => setPage('Impact Analysis')}><Activity size={15} /> Analyze selected</button>} /><div className="graph-toolbar"><button className="filter-button"><Network size={14} /> Files <ChevronDown size={13} /></button><button className="filter-button"><ArrowDownLeft size={14} /> Incoming <ChevronDown size={13} /></button><button className="filter-button">Depth 2 <ChevronDown size={13} /></button><button className="filter-button">Group: Module <ChevronDown size={13} /></button><span className="toolbar-spacer" /><button className="icon-button"><Search size={15} /></button><button className="icon-button"><Maximize2 size={15} /></button></div><div className="graph-workspace"><div className="graph-canvas"><div className="graph-grid large" /><div className="canvas-label">NEIGHBORHOOD · 18 NODES · 24 EDGES</div><div className="big-lines"><span className="bline b1" /><span className="bline b2" /><span className="bline b3" /><span className="bline b4" /><span className="bline b5" /></div><BigGraphNode className="root-node" title="AuthService.ts" path="src/auth" tone="selected" /><BigGraphNode className="gn1" title="AuthController.ts" path="src/auth" tone="cyan" /><BigGraphNode className="gn2" title="SessionManager.ts" path="src/session" tone="violet" /><BigGraphNode className="gn3" title="AuthMiddleware.ts" path="src/auth" tone="cyan" /><BigGraphNode className="gn4" title="LoginPage.tsx" path="src/ui" tone="amber" /><BigGraphNode className="gn5" title="auth.test.ts" path="tests" tone="test" /><div className="canvas-controls"><button>+</button><button>−</button><span /><button><Maximize2 size={14} /></button></div></div><aside className="graph-inspector"><div className="inspector-kicker">SELECTED FILE</div><div className="selected-file"><div className="file-symbol cyan-bg"><FileCode2 size={16} /></div><div><strong>AuthService.ts</strong><span>src/auth/AuthService.ts</span></div></div><div className="inspector-stats"><div><strong>18</strong><span>dependents</span></div><div><strong>6</strong><span>dependencies</span></div></div><div className="inspector-section"><div className="inspector-title">Relationships</div><div className="relationship"><ArrowDownLeft size={13} /><span>Imported by</span><b>14</b></div><div className="relationship"><ArrowUpRight size={13} /><span>Imports</span><b>6</b></div><div className="relationship"><TestTube2 size={13} /><span>Referenced by tests</span><b>2</b></div></div><button className="button button-primary full" onClick={() => setPage('Impact Analysis')}><Activity size={14} /> Run impact analysis</button></aside></div><div className="graph-legend"><span><i className="legend-line cyan" />Import</span><span><i className="legend-line violet" />Transitive</span><span><i className="legend-line amber" />Test reference</span><span className="legend-note">Showing 18 of 1,284 files · expand a module to explore</span></div></> }
function BigGraphNode({ className, title, path, tone }: { className: string; title: string; path: string; tone: string }) { return <div className={`big-node ${className} ${tone}`}><div className="node-icon"><FileCode2 size={14} /></div><div><strong>{title}</strong><span>{path}</span></div></div> }

function SearchView({ setPage }: { setPage: (p: Page) => void }) { return <><PageHeader eyebrow="Explore / code intelligence" title="Search" description="Find files, symbols, imports, and text without leaving the repository." /><div className="search-input large"><Search size={18} /><span>Search the repository</span><kbd>⌘ K</kbd></div><div className="search-tabs"><button className="active">All <b>24</b></button><button>Files</button><button>Symbols</button><button>Imports</button><button>Text</button></div><div className="search-layout"><Panel title="24 results" action={<span className="muted">Sorted by relevance</span>} className="results-panel"><div className="result-list"><Result type="CLASS" title="AuthService" path="src/auth/AuthService.ts" line="4" text="export class AuthService {" tone="cyan" onClick={() => setPage('Files')} /><Result type="FUNCTION" title="authenticate" path="src/auth/AuthService.ts" line="16" text="async authenticate(credentials: Credentials)" tone="violet" /><Result type="FILE" title="AuthController.ts" path="src/auth/AuthController.ts" line="—" text="Imports AuthService" tone="amber" /><Result type="TEXT MATCH" title="AuthService" path="tests/auth.test.ts" line="18" text="const service = new AuthService(...)" tone="slate" /></div></Panel><Panel title="Search tips" className="tips-panel"><div className="tip"><Command size={16} /><span><strong>Search symbols</strong><small>Use `@` to narrow to classes, functions, and methods.</small></span></div><div className="tip"><Hash size={16} /><span><strong>Search paths</strong><small>Use `/` to find a directory or filename.</small></span></div><div className="tip"><Network size={16} /><span><strong>Open relationships</strong><small>Every result can jump into its dependency context.</small></span></div></Panel></div></> }
function Result({ type, title, path, line, text, tone, onClick }: { type: string; title: string; path: string; line: string; text: string; tone: string; onClick?: () => void }) { return <button className="result-row" onClick={onClick}><span className={`result-type ${tone}`}>{type}</span><span className="result-main"><strong>{title}</strong><small>{path} <b>:{line}</b></small><code>{text}</code></span><ArrowUpRight size={15} /></button> }

function ImpactView({ setPage }: { setPage: (p: Page) => void }) { const [selected, setSelected] = useState('AuthController.ts'); return <><PageHeader eyebrow="Analyze / change impact" title="What could this change affect?" description="Trace reverse dependencies with evidence, not guesses." action={<button className="button button-primary"><Play size={14} /> Run analysis</button>} /><div className="impact-root"><div className="root-file"><div className="file-symbol cyan-bg"><FileCode2 size={17} /></div><div><span>Changed file</span><strong>AuthService.ts</strong><small>src/auth/AuthService.ts</small></div><ChevronDown size={15} /></div><div className="root-options"><span>Reverse dependencies <b>ON</b></span><span>Depth <b>3</b></span><span>Tests <b>ON</b></span></div></div><div className="impact-summary"><div><span className="summary-mark cyan"><ArrowDownLeft size={17} /></span><span><small>Directly affected</small><strong>3 <em>files</em></strong></span></div><div><span className="summary-mark violet"><Network size={17} /></span><span><small>Potentially affected</small><strong>7 <em>files</em></strong></span></div><div><span className="summary-mark amber"><TestTube2 size={17} /></span><span><small>Tests</small><strong>2 <em>tests</em></strong></span></div><div className="confidence"><span><small>Relationship confidence</small><strong>High</strong></span><Status>Evidence-backed</Status></div></div><div className="impact-layout"><div className="impact-chain"><div className="impact-chain-head"><span>RELATIONSHIP CHAIN</span><small>2 hops shown</small></div><div className="chain-root"><span className="chain-dot root" /><strong>AuthService.ts</strong><small>changed file</small></div><div className="chain-branch"><span className="chain-line" /><div className="chain-item active"><span className="chain-dot cyan" /><strong>AuthController.ts</strong><small>imports AuthService</small></div><div className="chain-item"><span className="chain-dot cyan" /><strong>SessionManager.ts</strong><small>imports AuthService</small></div><div className="chain-item"><span className="chain-dot cyan" /><strong>AuthMiddleware.ts</strong><small>uses AuthService</small></div><div className="chain-hop"><span className="chain-dot violet" /><strong>LoginPage.tsx</strong><small>via AuthController</small></div><div className="chain-hop"><span className="chain-dot amber" /><strong>auth.test.ts</strong><small>referenced by test</small></div></div></div><Panel title="Potentially affected files" action={<button className="filter-button">All groups <ChevronDown size={13} /></button>} className="impact-results"><div className="impact-group-list">{impactGroups.map(group => <div className="impact-group" key={group.title}><div className="impact-group-title"><span className={`dot ${group.tone}`} />{group.title}<b>{group.count}</b><ChevronDown size={14} /></div>{group.items.map(item => <button key={item[0]} className={`impact-row ${selected === item[0] ? 'selected' : ''}`} onClick={() => setSelected(item[0])}><span className={`impact-file-icon ${group.tone}`}><FileCode2 size={14} /></span><span><strong>{item[0]}</strong><small>{item[2]}</small></span><span className="evidence"><b>{item[1]}</b><small>{item[3]} confidence</small></span><ArrowUpRight size={14} /></button>)}</div>)}</div></Panel></div><div className="evidence-callout"><ShieldCheck size={16} /><span><strong>Why AuthController.ts?</strong> It imports <code>AuthService</code> at line 4. This is a direct, high-confidence relationship.</span><button onClick={() => setPage('Files')}>Open file <ArrowUpRight size={13} /></button></div></> }

function Hotspots() { return <><PageHeader eyebrow="Analyze / repository signals" title="Hotspots" description="Files with the most structural reach, ranked by inspectable signals." /><Panel title="Structural hotspots" action={<div className="view-toggle"><button className="active">Reverse dependencies</button><button>Fan-out</button><button>Size</button></div>}><div className="hotspot-table"><div className="table-head"><span>File</span><span>Reverse deps</span><span>Fan-out</span><span>Symbols</span><span>Reason</span></div>{[['AuthService.ts','18','6','42','High impact reach'],['Router.ts','15','12','68','Central entrypoint'],['SessionManager.ts','12','4','29','Session boundary'],['UserRepository.ts','9','8','31','Shared data access']].map(row => <div className="hotspot-table-row" key={row[0]}><span><FileCode2 size={15} /><strong>{row[0]}</strong><small>src/{row[0].split('.')[0].toLowerCase()}</small></span><b className="hot-number">{row[1]}</b><span>{row[2]}</span><span>{row[3]}</span><span><Status tone={row[1] === '18' ? 'high' : 'medium'}>{row[4]}</Status></span></div>)}</div></Panel></> }
function TestsView() { return <><PageHeader eyebrow="Analyze / verification surface" title="Tests" description="See which tests are connected to the modules you are about to change." /><div className="metrics-grid two"><Metric label="Test files" value="42" detail="218 discovered tests" icon={TestTube2} accent="amber" /><Metric label="Linked to source" value="76%" detail="Convention + symbol evidence" icon={ShieldCheck} accent="cyan" /></div><Panel title="Test inventory" action={<button className="filter-button">All frameworks <ChevronDown size={13} /></button>}><div className="test-table"><div className="table-head"><span>Test file</span><span>Framework</span><span>Linked modules</span><span>Confidence</span></div>{[['auth.test.ts','Vitest','AuthService · AuthController','High'],['session.test.ts','Vitest','SessionManager','Medium'],['repository.spec.ts','Playwright','UserRepository · API','High']].map(row => <div className="test-row" key={row[0]}><span><TestTube2 size={15} /><strong>{row[0]}</strong><small>tests/{row[0]}</small></span><span>{row[1]}</span><span>{row[2]}</span><Status tone={row[3] === 'High' ? 'high' : 'medium'}>{row[3]}</Status></div>)}</div></Panel></> }

function CommandPalette({ close, setPage }: { close: () => void; setPage: (p: Page) => void }) { const commands: [Page, typeof LayoutDashboard][] = [['Dashboard', LayoutDashboard], ['Files', Folder], ['Dependency Graph', Network], ['Search', Search], ['Impact Analysis', Activity], ['Hotspots', TriangleAlert], ['Tests', TestTube2]]; return <div className="modal-backdrop" onMouseDown={close}><div className="command-palette" onMouseDown={e => e.stopPropagation()}><div className="palette-search"><Search size={17} /><input autoFocus placeholder="Jump to a view or search..." /><kbd>ESC</kbd></div><div className="palette-label">NAVIGATION</div>{commands.map(([label, Icon], index) => <button className={`palette-row ${index === 4 ? 'selected' : ''}`} key={label} onClick={() => { setPage(label); close() }}><Icon size={16} /><span>{label}</span>{index === 4 && <kbd>↵</kbd>}</button>)}<div className="palette-footer"><span><ArrowDownLeft size={13} /> Navigate</span><span><ArrowUpRight size={13} /> Open</span><span><X size={13} /> Close</span></div></div></div> }

export default App
