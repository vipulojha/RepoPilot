import type { ReactNode } from 'react'
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Command,
  FileCode2,
  Folder,
  GitBranch,
  LayoutDashboard,
  Menu,
  Network,
  PanelLeft,
  RefreshCw,
  Search,
  Terminal,
  TestTube2,
  TriangleAlert,
} from 'lucide-react'
import type { Repository } from '../../lib/api/client'
import './obsidian-telemetry.css'

export type ObsidianTelemetryShellProps = {
  repository?: Repository
  currentPage: string
  onNavigate: (page: string) => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  onRepositoryPopover: () => void
  onCommandPalette: () => void
  onRescan: () => void
  children: ReactNode
}

const navigation = [
  { label: 'OVERVIEW', items: [{ label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'EXPLORE', items: [{ label: 'Files', icon: Folder }, { label: 'Search', icon: Search }, { label: 'Dependency Graph', icon: Network }] },
  { label: 'SIGNALS', items: [{ label: 'Impact Analysis', icon: Activity }, { label: 'Hotspots', icon: TriangleAlert }, { label: 'Tests', icon: TestTube2 }] },
  { label: 'GIT', items: [{ label: 'Status', icon: GitBranch }, { label: 'Change Intelligence', icon: Activity }, { label: 'Git Actions', icon: Terminal }, { label: 'Stash', icon: Folder }, { label: 'History', icon: GitBranch }, { label: 'Compare', icon: Search }] },
]

export function ObsidianTelemetryShell({
  repository, currentPage, onNavigate, sidebarCollapsed, onToggleSidebar,
  onRepositoryPopover, onCommandPalette, onRescan, children,
}: ObsidianTelemetryShellProps) {
  return <div className={`rp-shell ${sidebarCollapsed ? 'rp-shell--collapsed' : ''}`}>
    <aside className="rp-rail" aria-label="Primary navigation">
      <div className="rp-brand"><span className="rp-brand-mark">R<span>_</span></span>{!sidebarCollapsed && <span className="rp-brand-name">RepoPilot<small>TELEMETRY</small></span>}<button className="rp-icon-button rp-rail-toggle" onClick={onToggleSidebar} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!sidebarCollapsed}><PanelLeft size={16} /></button></div>
      <button className="rp-repository-trigger" onClick={onRepositoryPopover} aria-label="Select repository" aria-haspopup="dialog"><span className="rp-repository-glyph"><GitBranch size={15} /></span>{!sidebarCollapsed && <span className="rp-repository-copy"><strong>{repository?.name ?? 'No repository'}</strong><small>{repository?.branch ?? 'Select a workspace'}</small></span>}{!sidebarCollapsed && <ChevronDown size={14} />}</button>
      <nav className="rp-nav">{navigation.map(section => <div className="rp-nav-group" key={section.label}><span className="rp-nav-label">{!sidebarCollapsed && section.label}</span>{section.items.map(item => <button key={item.label} className={`rp-nav-item ${currentPage === item.label ? 'rp-nav-item--active' : ''}`} onClick={() => onNavigate(item.label)} title={sidebarCollapsed ? item.label : undefined} aria-current={currentPage === item.label ? 'page' : undefined}><item.icon size={16} /><span>{!sidebarCollapsed && item.label}</span></button>)}</div>)}</nav>
      <div className="rp-rail-footer"><span className="rp-live-dot" />{!sidebarCollapsed && <span>LIVE SIGNALS</span>}</div>
    </aside>
    <section className="rp-main">
      <header className="rp-topbar"><button className="rp-icon-button rp-mobile-menu" onClick={onToggleSidebar} aria-label="Toggle navigation"><Menu size={17} /></button><div className="rp-breadcrumbs"><span className="rp-crumb-repository"><GitBranch size={14} />{repository?.name ?? 'RepoPilot'}</span><ChevronRight size={13} /><span>{repository?.branch ?? 'no branch'}</span><ChevronRight size={13} /><strong>{currentPage}</strong></div><div className="rp-topbar-actions"><button className="rp-action-button" onClick={onRescan} disabled={!repository} title="Rescan repository"><RefreshCw size={14} /><span>Rescan</span></button><button className="rp-command-button" onClick={onCommandPalette} aria-label="Open command palette"><Command size={15} /><span>Jump to anything</span><kbd>⌘ K</kbd></button></div></header>
      <main className="rp-content">{children}</main>
    </section>
  </div>
}
