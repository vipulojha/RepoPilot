import { useEffect, useState } from 'react'
import { api, type Atlas, type GitHistory, type GraphNode, type GraphEdge, type Hotspot, type Overview, type RepositoryFile, type SearchHit, type TestRelationship, type GitStatus, type GitChangedFile, type ImpactItem, type Scan } from './api/client'

export type HandoffEndpoint = 'scan' | 'overview' | 'files' | 'search' | 'graph' | 'atlas' | 'hotspots' | 'changes' | 'history' | 'git'
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
  atlas: Atlas | null
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
export async function loadHandoffData(repositoryId: number, searchQuery = '') {
  const atlasRequest = typeof api.atlas === 'function' ? settle(api.atlas(repositoryId)) : Promise.resolve<Settled<Atlas>>({ value: null, error: null })
  // Search only when a caller supplies a query; repository opening must not trigger
  // an unbounded search request.
  const searchRequest = searchQuery.trim() ? settle(api.search(repositoryId, searchQuery.trim())) : Promise.resolve<Settled<{ items: SearchHit[] }>>({ value: null, error: null })
  const [scan, overview, files, search, graph, atlas, hotspots, changes, history, git] = await Promise.all([
    settle(api.latestScan(repositoryId)),
    settle(api.overview(repositoryId)),
    settle(api.files(repositoryId)),
    searchRequest,
    settle(api.graph(repositoryId)),
    atlasRequest,
    settle(api.hotspots(repositoryId)),
    settle(api.changes(repositoryId)),
    settle(api.git.history(repositoryId, 1, 20)),
    settle(api.gitStatus(repositoryId)),
  ])
  const results: [HandoffEndpoint, Settled<unknown>][] = [
    ['scan', scan], ['overview', overview], ['files', files], ...(searchQuery.trim() ? [['search', search] as [HandoffEndpoint, Settled<unknown>]] : []), ['graph', graph],
    ...(typeof api.atlas === 'function' ? [['atlas', atlas] as [HandoffEndpoint, Settled<unknown>]] : []), ['hotspots', hotspots], ['changes', changes], ['history', history], ['git', git],
  ]
  const endpointErrors = Object.fromEntries(results.filter(([, result]) => result.error).map(([endpoint, result]) => [endpoint, result.error])) as HandoffEndpointErrors
  const values = {
      overview: overview.value,
      atlas: atlas.value,
    files: files.value ?? { items: [] as RepositoryFile[] },
    graph: graph.value ?? { nodes: [] as GraphNode[], edges: [] as GraphEdge[] },
    hotspots: hotspots.value ?? { items: [] as Hotspot[] },
    changes: changes.value ?? { changed_files: [], tests: [] as TestRelationship[], affected_files: [], diff: null, risk: null },
    history: history.value,
    git: git.value,
  }
  const successful = results.filter(([, result]) => !result.error).length
  const hasData = Boolean((values.overview?.file_count ?? 0) > 0 || values.files.items.length || search.value?.items.length || values.graph.nodes.length || values.hotspots.items.length || values.changes.tests.length || values.history?.items.length)
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
      atlas: values.atlas,
      files: values.files.items,
      search: search.value?.items ?? [],
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
