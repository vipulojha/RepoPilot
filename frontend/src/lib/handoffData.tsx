import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type GitHistory, type GraphNode, type GraphEdge, type Hotspot, type Overview, type RepositoryFile, type SearchHit, type TestRelationship, type GitStatus, type GitChangedFile } from './api/client'

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
  source: 'api' | 'fallback'
}
export const HandoffDataContext = createContext<HandoffData | null>(null)
export const useHandoffDataContext = () => useContext(HandoffDataContext)

export function useHandoffData(repositoryId: number | null) {
  const [state, setState] = useState<{ loading: boolean; error: string | null; data: HandoffData | null }>({ loading: true, error: null, data: null })
  useEffect(() => {
    let active = true
    if (!repositoryId) { setState({ loading: false, error: null, data: null }); return () => { active = false } }
    setState(current => ({ ...current, loading: true, error: null }))
    Promise.all([
      api.overview(repositoryId).catch(() => null),
      api.files(repositoryId).catch(() => ({ items: [] })),
      api.graph(repositoryId).catch(() => ({ nodes: [], edges: [] })),
      api.hotspots(repositoryId).catch(() => ({ items: [] })),
      Promise.resolve({ items: [] as TestRelationship[] }),
      api.git.history(repositoryId, 1, 20).catch(() => null),
      api.gitStatus(repositoryId).catch(() => null),
      api.changes(repositoryId).catch(() => ({ changed_files: [] })),
    ]).then(([overview, files, graph, hotspots, tests, history, git, changes]) => {
      if (!active) return
      const hasApiData = Boolean(overview || files.items.length || graph.nodes.length || hotspots.items.length || tests.items.length || history)
      const changedFiles: GitChangedFile[] = (changes.changed_files ?? []).map(file => { const item = file as unknown as Record<string, unknown>; return { path: String(item.path ?? ''), old_path: (item.old_path as string | null) ?? null, status: String(item.status ?? ''), additions: Number(item.additions ?? 0), deletions: Number(item.deletions ?? 0), file_id: (item.file_id as number | null) ?? null } })
      setState({ loading: false, error: null, data: { overview, files: files.items, search: [], graph, hotspots: hotspots.items, tests: tests.items, history, git, changedFiles, source: hasApiData ? 'api' : 'fallback' } })
    }).catch(error => active && setState({ loading: false, error: error instanceof Error ? error.message : 'Unable to load repository intelligence.', data: null }))
    return () => { active = false }
  }, [repositoryId])
  return state
}

export function HandoffDataBoundary({ repositoryId, children }: { repositoryId: number | null; children: (data: HandoffData) => ReactNode }) {
  const state = useHandoffData(repositoryId)
  if (state.loading) return <div className="state-card"><strong>Loading repository intelligence…</strong><span>Fetching the current snapshot from the API.</span></div>
  if (state.error) return <div className="state-card"><strong>Unable to load repository intelligence</strong><span>{state.error}</span></div>
  if (!state.data) return <div className="state-card"><strong>Connect a repository to begin</strong><span>No repository is selected.</span></div>
  return <HandoffDataContext.Provider value={state.data}>{children(state.data)}</HandoffDataContext.Provider>
}
