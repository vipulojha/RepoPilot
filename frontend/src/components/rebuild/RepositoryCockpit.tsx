import { useEffect, useState } from 'react'
import { Activity, GitBranch, Network, TestTube2 } from 'lucide-react'
import { api, type Overview, type Repository, type Scan } from '../../lib/api/client'
import { WorkspaceHeader, WorkspacePanel, WorkspaceState } from './WorkspaceStates'

export interface RepositoryCockpitProps { repository: Repository | null }
export function RepositoryCockpit({ repository }: RepositoryCockpitProps) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [scan, setScan] = useState<Scan | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { setOverview(null); setScan(null); setError(''); if (repository) Promise.all([api.overview(repository.id), api.latestScan(repository.id)]).then(([o, s]) => { setOverview(o); setScan(s) }).catch(e => setError(e instanceof Error ? e.message : 'Repository telemetry unavailable')) }, [repository])
  if (!repository) return <WorkspaceState kind="empty"><Activity size={22} /><strong>Select a repository</strong><span>Choose a registered repository to open its cockpit.</span></WorkspaceState>
  return <><WorkspaceHeader eyebrow="Repository / cockpit" title={repository.name} detail={`${repository.path} · ${repository.branch}`} /><div className="telemetry-rail">{[['Files', overview?.file_count], ['Lines', overview?.total_lines], ['Symbols', overview?.symbol_count], ['Dependencies', overview?.dependency_count], ['Tests', overview?.test_file_count]].map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value ?? '—'}</strong><small>snapshot telemetry</small></div>)}</div><WorkspacePanel title="Scan state"><div className="git-status-meta"><span><GitBranch size={14} /> {scan?.status ?? 'Loading'}</span><span><Network size={14} /> snapshot {scan?.id ?? '—'}</span><span><TestTube2 size={14} /> {scan ? `${scan.percentage}% processed` : '—'}</span></div>{error && <WorkspaceState kind="error">{error}</WorkspaceState>}{!overview && !error && <WorkspaceState kind="loading">Loading repository telemetry…</WorkspaceState>}</WorkspacePanel></>
}
