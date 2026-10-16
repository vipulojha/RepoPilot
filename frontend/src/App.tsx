import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import {
  Activity,
  Command,
  GitBranch,
  LayoutDashboard,
  Network,
  Search,
  Settings2,
  Terminal,
  X,
} from 'lucide-react'
import { api, type Repository } from './lib/api/client'
import {
  DependencyGraphWorkspace,
  FileDetailSource,
  FilesExplorer,
  GitActionsPanel,
  GitStatusPanel,
  ChangeIntelligencePanel,
  HistoryPanel,
  CommitDetailPanel,
  FileHistoryPanel,
  ComparePanel,
  HotspotsWorkspace,
  ImpactWorkspace,
  OnboardingPanel,
  RepositoryCockpit,
  SearchWorkspace,
  TestsWorkspace,
  WorkspaceHeader,
  WorkspacePanel,
  WorkspaceState,
  ObsidianTelemetryShell,
} from './components/rebuild'
import './components/rebuild/rebuild.css'
import { AppSidebar, type NavigationPage } from './components/layout/AppSidebar'
import { AppHeader } from './components/layout/AppHeader'
import { CommandPalette as HandoffCommandPalette } from './components/modals/CommandPalette'
import { HandoffDataBoundary } from './lib/handoffData'
import { CockpitView } from './views/CockpitView'
import { FilesView } from './views/FilesView'
import { SearchView } from './views/SearchView'
import { DependencyGraphView } from './views/DependencyGraphView'
import { DependencyAtlasView } from './views/DependencyAtlasView'
import { ImpactAnalysisView } from './views/ImpactAnalysisView'
import { HotspotsView } from './views/HotspotsView'
import { TestsView } from './views/TestsView'
import { HistoryView } from './views/HistoryView'
import { ChangeIntelligenceView } from './views/ChangeIntelligenceView'
import { GitActionsView } from './views/GitActionsView'
import { OnboardingView } from './views/OnboardingView'
import { SettingsView } from './views/SettingsView'
import { HelpView } from './views/HelpView'

type Page =
  | 'Dashboard' | 'Files' | 'File Detail' | 'Search' | 'Dependency Graph' | 'Dependency Atlas' | 'Impact Analysis'
  | 'Hotspots' | 'Tests' | 'Status' | 'Change Intelligence' | 'Git Actions' | 'Stash'
  | 'History' | 'Commit Detail' | 'File History' | 'Compare' | 'Settings' | 'Help & Shortcuts' | 'Onboarding'

type EntryMode = 'local' | 'github' | 'file'

const pageGroups = [
  { label: 'Repository', icon: LayoutDashboard, pages: ['Dashboard', 'Files', 'Search'] as Page[] },
  { label: 'Intelligence', icon: Network, pages: ['Dependency Graph', 'Impact Analysis', 'Hotspots', 'Tests'] as Page[] },
  { label: 'Git', icon: GitBranch, pages: ['Status', 'Change Intelligence', 'Git Actions', 'Stash', 'History', 'Compare'] as Page[] },
]

function App() {
  const [page, setPage] = useState<Page>(() => Number(localStorage.getItem('repopilot.repositoryId')) ? (readLandingView() as Page) : 'Onboarding')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [repositoryId, setRepositoryId] = useState<number | null>(() => readPreferences().rememberRepository ? Number(localStorage.getItem('repopilot.repositoryId')) || null : null)
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null)
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null)
  const [viewHistory, setViewHistory] = useState<Array<{ page: Page; selectedFileId: number | null; selectedCommit: string | null }>>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [repositoryMenuOpen, setRepositoryMenuOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingMode, setOnboardingMode] = useState<EntryMode>('local')
  const [feedback, setFeedback] = useState('')
  const repositoryMenuRef = useRef<HTMLDivElement>(null)
  const selectedRepository = repositories.find(repository => repository.id === repositoryId) ?? null
  const handoffPage: NavigationPage = page === 'Dashboard' ? 'overview' : page === 'Files' || page === 'File Detail' ? 'files' : page === 'Search' ? 'search' : page === 'Dependency Graph' ? 'dependency-graph' : page === 'Dependency Atlas' ? 'dependency-atlas' : page === 'Impact Analysis' ? 'impact-analysis' : page === 'Hotspots' ? 'hotspots' : page === 'Tests' ? 'tests' : page === 'History' ? 'history' : page === 'Change Intelligence' ? 'change-intelligence' : page === 'Git Actions' ? 'git-actions' : page === 'Settings' ? 'settings' : page === 'Help & Shortcuts' ? 'help' : page === 'Onboarding' ? 'onboarding' : 'overview'
  const currentViewTitle = page === 'Dashboard' ? 'OVERVIEW' : page === 'File Detail' ? 'FILE DETAIL' : page === 'Dependency Graph' ? 'DEPENDENCY GRAPH' : page === 'Dependency Atlas' ? 'DEPENDENCY ATLAS' : page === 'Impact Analysis' ? 'IMPACT ANALYSIS' : page === 'Change Intelligence' ? 'CHANGE INTELLIGENCE' : page === 'Git Actions' ? 'GIT ACTIONS' : page === 'Help & Shortcuts' ? 'HELP & SHORTCUTS' : page.toUpperCase()
  const backLabel = viewHistory[viewHistory.length - 1]?.page === 'Files' ? 'Back to Files' : viewHistory[viewHistory.length - 1]?.page === 'Dependency Graph' ? 'Back to Dependency Graph' : viewHistory[viewHistory.length - 1]?.page === 'Search' ? 'Back to Search' : viewHistory[viewHistory.length - 1]?.page === 'History' ? 'Back to History' : 'Back'

  useEffect(() => {
    api.repositories().then(result => {
      setRepositories(result.items)
      setRepositoryId(current => current && result.items.some(item => item.id === current) ? current : result.items[0]?.id ?? null)
      setPage(current => result.items.length === 0 ? 'Onboarding' : current === 'Onboarding' ? 'Dashboard' : current)
    }).catch(() => setRepositories([]))
  }, [])

  useEffect(() => {
    if (repositoryId) localStorage.setItem('repopilot.repositoryId', String(repositoryId))
    else localStorage.removeItem('repopilot.repositoryId')
  }, [repositoryId])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false)
        setRepositoryMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (repositoryMenuRef.current && !repositoryMenuRef.current.contains(event.target as Node)) setRepositoryMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const openOnboarding = (mode: EntryMode = 'local') => {
    setOnboardingMode(mode)
    setOnboardingOpen(true)
  }

  const selectFile = (fileId: number) => {
    setViewHistory(history => [...history, { page, selectedFileId, selectedCommit }])
    setSelectedFileId(fileId)
    setPage('File Detail')
  }

  const goBack = () => {
    const previous = viewHistory[viewHistory.length - 1]
    if (!previous) {
      setPage('Dashboard')
      return
    }
    setViewHistory(history => history.slice(0, -1))
    setPage(previous.page)
    setSelectedFileId(previous.selectedFileId ?? selectedFileId)
    setSelectedCommit(previous.selectedCommit)
  }

  const rescan = async () => {
    if (!repositoryId) return
    try {
      await api.startScan(repositoryId)
      setFeedback('Scan queued. Workspace telemetry will refresh when the snapshot is ready.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to start repository scan.')
    }
    window.setTimeout(() => setFeedback(''), 4500)
  }

  const finishOnboarding = async (repository: Repository, focus?: string) => {
    setRepositories(current => current.some(item => item.id === repository.id) ? current : [...current, repository])
    setRepositoryId(repository.id)
    let openedFocusedFile = false
    try {
      const scan = await api.latestScan(repository.id).catch(() => api.startScan(repository.id))
      if (focus && scan.status === 'ready') {
        const files = await api.files(repository.id)
        const relative = focus.replace(repository.path, '').replace(/^[/\\]+/, '').replace(/\\/g, '/')
        const file = files.items.find(item => item.relative_path === relative)
        if (file) {
          openedFocusedFile = true
          setSelectedFileId(file.id)
          setViewHistory(history => [...history, { page: 'Onboarding', selectedFileId: null, selectedCommit: null }])
          setPage('File Detail')
        }
      }
    } catch {
      // Registration succeeded even if the first scan is not immediately available.
    }
    setOnboardingOpen(false)
    setPage(current => current === 'Onboarding' && !openedFocusedFile ? 'Dashboard' : current)
    setFeedback(`Connected ${repository.name}.`)
    window.setTimeout(() => setFeedback(''), 3500)
  }

  const navigate = (nextPage: string) => {
    if (nextPage === 'Onboarding') {
      setPage('Onboarding')
      openOnboarding()
      return
    }
    setPage(nextPage as Page)
    if (nextPage === 'Settings' || nextPage === 'Help & Shortcuts') {
      setViewHistory(history => [...history, { page, selectedFileId, selectedCommit }])
    } else {
      setViewHistory([])
    }
    setPaletteOpen(false)
    setRepositoryMenuOpen(false)
  }

  const view = useMemo(() => renderPage({
    page,
    repository: selectedRepository,
    repositoryId,
    selectedFileId,
    selectedCommit,
    setPage,
    setSelectedCommit,
    selectFile,
    onStartOnboarding: () => openOnboarding(),
    onBack: goBack,
    backLabel,
  }), [page, selectedRepository, repositoryId, selectedFileId, selectedCommit, backLabel])

  return <>
    <div className="flex flex-col h-screen w-screen bg-[#0B0E14] text-[#DEE2F3] overflow-hidden select-none">
      <div className="flex-1 flex overflow-hidden">
        <AppSidebar currentPage={handoffPage} activeRepo={selectedRepository?.name ?? 'No repository'} activeBranch={selectedRepository?.branch ?? 'no branch'} onNavigate={next => navigate(next === 'overview' ? 'Dashboard' : next === 'files' ? 'Files' : next === 'search' ? 'Search' : next === 'dependency-graph' ? 'Dependency Graph' : next === 'dependency-atlas' ? 'Dependency Atlas' : next === 'impact-analysis' ? 'Impact Analysis' : next === 'change-intelligence' ? 'Change Intelligence' : next === 'git-actions' ? 'Git Actions' : next === 'settings' ? 'Settings' : next === 'help' ? 'Help & Shortcuts' : next === 'onboarding' ? 'Onboarding' : next[0].toUpperCase() + next.slice(1))} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(value => !value)} />
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0E14]">
          <AppHeader currentViewTitle={currentViewTitle} activeRepo={selectedRepository?.name ?? 'No repository'} activeBranch={selectedRepository?.branch ?? 'no branch'} onOpenCommandPalette={() => setPaletteOpen(true)} onRescan={() => void rescan()} onSwitchRepo={() => openOnboarding()} />
          <main className="flex-1 overflow-auto relative">
            <div className="rp-workspace-wrap">
        {feedback && <div className="rp-feedback" role="status"><Activity size={14} />{feedback}<button onClick={() => setFeedback('')} aria-label="Dismiss feedback"><X size={14} /></button></div>}
        {view}
            </div>
          </main>
        </div>
      </div>
    {repositoryMenuOpen && <RepositoryPopover repositories={repositories} activeId={repositoryId} anchorRef={repositoryMenuRef} onSelect={id => { setRepositoryId(id); setPage('Dashboard'); setRepositoryMenuOpen(false) }} onAdd={() => { setRepositoryMenuOpen(false); openOnboarding() }} />}
    {paletteOpen && <HandoffCommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} onNavigate={next => navigate(next)} onRescan={() => void rescan()} onExportMatrix={() => setFeedback('Dependency matrix export is available from the graph view.')} />}
    {onboardingOpen && <OnboardingOverlay mode={onboardingMode} onComplete={finishOnboarding} onClose={() => setOnboardingOpen(false)} />}
    </div>
  </>
}

function OnboardingOverlay({ mode, onComplete, onClose }: { mode: EntryMode; onComplete: (repository: Repository, focus?: string) => void; onClose: () => void }) {
  return <div className="rp-overlay"><div className="rp-overlay-card"><button className="rp-overlay-close" onClick={onClose} aria-label="Close onboarding"><X size={16} /></button><OnboardingPanel initialMode={mode} onComplete={onComplete} onCancel={onClose} /></div></div>
}

function RepositoryPopover({ repositories, activeId, anchorRef, onSelect, onAdd }: { repositories: Repository[]; activeId: number | null; anchorRef: RefObject<HTMLDivElement | null>; onSelect: (id: number) => void; onAdd: () => void }) {
  return <div className="rp-repository-popover" ref={anchorRef} role="dialog" aria-label="Registered repositories"><div className="rp-popover-kicker">Workspace repositories</div>{repositories.length ? repositories.map(repository => <button className={`rp-repository-option ${repository.id === activeId ? 'is-active' : ''}`} key={repository.id} onClick={() => onSelect(repository.id)}><GitBranch size={14} /><span><strong>{repository.name}</strong><small>{repository.branch || 'no branch'} · {repository.path}</small></span>{repository.id === activeId && <b>ACTIVE</b>}</button>) : <div className="rp-popover-empty">No repositories registered.</div>}<button className="rp-popover-add" onClick={onAdd}>+ Add repository</button></div>
}

function CommandPalette({ onClose, onNavigate, onOpenOnboarding }: { onClose: () => void; onNavigate: (page: string) => void; onOpenOnboarding: (mode?: EntryMode) => void }) {
  const [query, setQuery] = useState('')
  const commands = [
    ...pageGroups.flatMap(group => group.pages.map(page => ({ page, group: group.label, icon: group.icon }))),
    { page: 'Onboarding' as Page, group: 'Actions', icon: Terminal },
  ]
  const filtered = commands.filter(command => command.page.toLowerCase().includes(query.toLowerCase()) || command.group.toLowerCase().includes(query.toLowerCase()))
  return <div className="rp-palette-backdrop" onMouseDown={onClose}><div className="rp-palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={event => event.stopPropagation()}><div className="rp-palette-search"><Search size={16} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Jump to a workspace or action…" /><kbd>ESC</kbd></div><div className="rp-palette-body">{filtered.length ? filtered.map(command => <button key={command.page} className="rp-palette-row" onClick={() => { command.page === 'Onboarding' ? onOpenOnboarding() : onNavigate(command.page); onClose() }}><command.icon size={15} /><span><strong>{command.page}</strong><small>{command.group}</small></span><kbd>↵</kbd></button>) : <div className="rp-palette-empty">No matching workspace.</div>}</div><footer><span>↑↓ Navigate</span><span>↵ Open</span><span>Esc Close</span><span><Command size={11} /> K</span></footer></div></div>
}

function renderPage({ page, repository, repositoryId, selectedFileId, selectedCommit, setPage, setSelectedCommit, selectFile, onStartOnboarding, onBack, backLabel }: {
  page: Page
  repository: Repository | null
  repositoryId: number | null
  selectedFileId: number | null
  selectedCommit: string | null
  setPage: (page: Page) => void
  setSelectedCommit: (sha: string) => void
  selectFile: (fileId: number) => void
  onStartOnboarding: () => void
  onBack: () => void
  backLabel: string
}) {
  const handoff = (render: (data: import('./lib/handoffData').HandoffData) => React.ReactNode) => <HandoffDataBoundary repositoryId={repositoryId}>{render}</HandoffDataBoundary>
  switch (page) {
    case 'Dashboard': return handoff(() => <CockpitView onNavigate={next => setPage(next as Page)} />)
    case 'Files': return handoff(() => <FilesView onSelectFile={selectFile} selectedFileId={selectedFileId} />)
    case 'File Detail': return <FileDetailSource repositoryId={repositoryId} fileId={selectedFileId} onBack={onBack} backLabel={backLabel} />
    case 'Search': return handoff(() => <SearchView repositoryId={repositoryId} onSelectFile={selectFile} />)
    case 'Dependency Graph': return handoff(() => <DependencyGraphView onSelectFile={selectFile} />)
    case 'Dependency Atlas': return handoff(() => <DependencyAtlasView />)
    case 'Impact Analysis': return handoff(() => <ImpactAnalysisView repositoryId={repositoryId} selectedFileId={selectedFileId} />)
    case 'Hotspots': return handoff(() => <HotspotsView onAnalyzeImpact={() => setPage('Impact Analysis')} />)
    case 'Tests': return handoff(() => <TestsView repositoryId={repositoryId} selectedFileId={selectedFileId} />)
    case 'Status': return <GitStatusPanel repositoryId={repositoryId} />
    case 'Change Intelligence': return handoff(() => <ChangeIntelligenceView />)
    case 'Git Actions': return handoff(() => <GitActionsView repositoryId={repositoryId} />)
    case 'Stash': return <GitActionsPanel repositoryId={repositoryId} />
    case 'History': return handoff(() => <HistoryView onSelectFile={selectFile} />)
    case 'Commit Detail': return <CommitDetailPanel repositoryId={repositoryId} sha={selectedCommit} />
    case 'File History': return <FileHistoryPanel repositoryId={repositoryId} fileId={selectedFileId} />
    case 'Compare': return <CompareWorkspace repositoryId={repositoryId} />
    case 'Onboarding': return <OnboardingView onComplete={onStartOnboarding} />
    case 'Settings': return <SettingsView onBack={onBack} />
    case 'Help & Shortcuts': return <HelpView onBack={onBack} />
    default: return <RepositoryCockpit repository={repository} />
  }
}

function readPreferences(): { rememberRepository: boolean; landingView: string } {
  try {
    const value = JSON.parse(localStorage.getItem('repopilot.preferences') || '{}')
    return { rememberRepository: value.rememberRepository !== false, landingView: typeof value.landingView === 'string' ? value.landingView : 'Dashboard' }
  } catch {
    return { rememberRepository: true, landingView: 'Dashboard' }
  }
}

function readLandingView() {
  const landingView = readPreferences().landingView
  return ['Dashboard', 'Files', 'Dependency Graph', 'History'].includes(landingView) ? landingView : 'Dashboard'
}

function CompareWorkspace({ repositoryId }: { repositoryId: number | null }) {
  const [base, setBase] = useState('HEAD~1')
  return <><WorkspaceHeader eyebrow="Git / compare" title="Compare" detail="Review a deterministic file-level comparison between two refs." action={<input aria-label="Base ref" value={base} onChange={event => setBase(event.target.value)} placeholder="Base ref" />} /><ComparePanel repositoryId={repositoryId} base={base} /></>
}

export default App
