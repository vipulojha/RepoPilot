import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type GitHistory, type GraphNode, type GraphEdge, type Hotspot, type Overview, type RepositoryFile, type SearchHit, type TestRelationship, type GitStatus, type GitChangedFile, type ImpactItem, type Scan } from './api/client'

export type HandoffEndpoint = 'scan' | 'overview' | 'files' | 'graph' | 'hotspots' | 'changes' | 'history' | 'git'
export type HandoffStatus = 'ready' | 'empty' | 'partial' | 'unavailable'
export type HandoffEndpointErrors = Partial<Record<HandoffEndpoint, string>>

type Settled<T> = { value: T | null; error: string | null }

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : 'RepoPilot could not load this data.'
}

async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  try { return { value: await promise, error: null } } catch (error) { return { value: null, error: errorMessage(error) } }
}

export interface HandoffData {
  overview: Overview | null
  files: RepositoryFile[]
  search: SearchHit[]
  graph: { nodes: GraphNode[]; edges: GraphEdge[] }
  hotspots: Hotspot[]
  tests: TestRelationship[]
  history: GitHistory | null
  git: GitStatus | null
  changedFiles: GitChangedFile[]
  affectedFiles: ImpactItem[]
  changeStats: { files: number; additions: number; deletions: number } | null
  changeRisk: { score: number; level: string; reasons: string[] } | null
  scan: Scan | null
  endpointErrors: HandoffEndpointErrors
  status: HandoffStatus
  source: 'api'
}
export const HandoffDataContext = createContext<HandoffData | null>(null)
export const useHandoffDataContext = () => useContext(HandoffDataContext)

export async function loadHandoffData(repositoryId: number) {
  const [scan, overview, files, graph, hotspots, changes, history, git] = await Promise.all([
    settle(api.latestScan(repositoryId)),
    settle(api.overview(repositoryId)),
    settle(api.files(repositoryId)),
    settle(api.graph(repositoryId)),
    settle(api.hotspots(repositoryId)),
    settle(api.changes(repositoryId)),
    settle(api.git.history(repositoryId, 1, 20)),
    settle(api.gitStatus(repositoryId)),
  ])
  const results: [HandoffEndpoint, Settled<unknown>][] = [
    ['scan', scan], ['overview', overview], ['files', files], ['graph', graph],
    ['hotspots', hotspots], ['changes', changes], ['history', history], ['git', git],
  ]
  const endpointErrors = Object.fromEntries(results.filter(([, result]) => result.error).map(([endpoint, result]) => [endpoint, result.error])) as HandoffEndpointErrors
  const values = {
    overview: overview.value,
    files: files.value ?? { items: [] as RepositoryFile[] },
    graph: graph.value ?? { nodes: [] as GraphNode[], edges: [] as GraphEdge[] },
    hotspots: hotspots.value ?? { items: [] as Hotspot[] },
    changes: changes.value ?? { changed_files: [], tests: [] as TestRelationship[], affected_files: [], diff: null, risk: null },
    history: history.value,
    git: git.value,
  }
  const successful = results.filter(([, result]) => !result.error).length
  const hasData = Boolean((values.overview?.file_count ?? 0) > 0 || values.files.items.length || values.graph.nodes.length || values.hotspots.items.length || values.changes.tests.length || values.history?.items.length)
  const status: HandoffStatus = Object.keys(endpointErrors).length ? (successful ? 'partial' : 'unavailable') : (hasData ? 'ready' : 'empty')
  const changedFiles: GitChangedFile[] = (values.changes.changed_files ?? []).map(file => {
    const item = file as unknown as Record<string, unknown>
    const gitData = (item.git ?? item) as Record<string, unknown>
    return { path: String(gitData.path ?? item.path ?? ''), old_path: (gitData.rename_from as string | null) ?? (item.old_path as string | null) ?? null, status: String(gitData.status ?? item.status ?? ''), additions: Number(gitData.additions ?? item.additions ?? 0), deletions: Number(gitData.deletions ?? item.deletions ?? 0), file_id: (item.file_id as number | null) ?? null, unresolved: Boolean(item.unresolved), diff_lines: Array.isArray(item.diff_lines) ? item.diff_lines as GitChangedFile['diff_lines'] : [] }
  })
  return {
    loading: false,
    error: status === 'unavailable' ? Object.values(endpointErrors)[0] ?? 'Repository intelligence is unavailable.' : null,
    data: {
      overview: values.overview,
      files: values.files.items,
      search: [],
      graph: values.graph,
      hotspots: values.hotspots.items,
      tests: values.changes.tests,
      history: values.history,
      git: values.git,
      changedFiles,
      affectedFiles: values.changes.affected_files ?? [],
      changeStats: values.changes.diff ?? null,
      changeRisk: values.changes.risk ? { score: values.changes.risk.score, level: values.changes.risk.level, reasons: values.changes.risk.reasons } : null,
      scan: scan.value,
      endpointErrors,
      status,
      source: 'api' as const,
    },
  }
}

export function useHandoffData(repositoryId: number | null, refreshKey = 0) {
  const [state, setState] = useState<{ loading: boolean; error: string | null; data: HandoffData | null }>({ loading: true, error: null, data: null })
  useEffect(() => {
    let active = true
    if (!repositoryId) { setState({ loading: false, error: null, data: null }); return () => { active = false } }
    setState(current => ({ ...current, loading: true, error: null }))
    loadHandoffData(repositoryId).then(next => active && setState(next)).catch(error => active && setState({ loading: false, error: errorMessage(error), data: null }))
    return () => { active = false }
  }, [repositoryId, refreshKey])
  return state
}

export function HandoffDataBoundary({ repositoryId, children }: { repositoryId: number | null; children: (data: HandoffData) => ReactNode }) {
  const state = useHandoffData(repositoryId)
  if (state.loading) return <div className="state-card"><strong>Loading repository intelligence…</strong><span>Fetching the current snapshot from the API.</span></div>
  if (state.error) return <div className="state-card"><strong>Unable to load repository intelligence</strong><span>{state.error}</span></div>
  if (!state.data) return <div className="state-card"><strong>Connect a repository to begin</strong><span>No repository is selected.</span></div>
  return <HandoffDataContext.Provider value={state.data}>{children(state.data)}</HandoffDataContext.Provider>
}
