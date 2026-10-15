const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export interface HealthResponse {
  status: string
  service: string
  version: string
}

export interface Repository {
  id: number
  name: string
  path: string
  branch: string
  created_at: string
  updated_at: string
}

export interface RepositoryRegistration {
  name: string
  path: string
  branch?: string
}

export interface Scan {
  id: number
  repository_id: number
  status: 'queued' | 'scanning' | 'finalizing' | 'ready' | 'failed'
  started_at: string | null
  completed_at: string | null
  processed_files: number
  discovered_files: number
  percentage: number
  statistics: { file_count: number; total_bytes: number; total_lines: number }
  warnings: string[]
  error_message?: string | null
}

export interface RepositoryFile {
  id: number
  snapshot_id: number
  relative_path: string
  name: string
  extension: string
  language: string
  classification: string
  size_bytes: number
  line_count: number | null
  is_binary: boolean
  is_test: boolean
  warning: string | null
}

export interface FileTreeNode {
  name: string
  path: string
  kind: 'directory' | 'file'
  language?: string | null
  size_bytes?: number | null
  child_count?: number | null
}
export interface SearchHit { type: string; file_id: number; symbol_id: number | null; path: string; name: string; language: string | null; line: number | null; snippet: string; rank: number }
export interface ImpactItem { file_id: number; path: string; depth: number; changed_root_ids: number[]; dependency_path: { file_id: number; path: string }[]; evidence: { imported_name: string; kind: string; source_line: number; source_column: number; evidence: string }[] }
export interface GraphNode { id: number; path: string; name: string; language: string; classification: string; is_test: boolean; incoming: number; outgoing: number }
export interface GraphEdge { id: number; source: number; target: number; kind: string; imported_name: string; source_line: number; source_column: number; evidence: string }
export interface Hotspot { file_id:number; path:string; name:string; language:string; is_test:boolean; score:number; rank:number; metrics:{lines:number;symbols:number;fan_in:number;fan_out:number;impact_reach:number}; reasons:string[] }
export interface TestRelationship { test_file_id:number; test_path:string; source_file_id:number; source_path:string; kind:string; evidence_level:string; evidence:string }
export interface Overview { snapshot_id:number; file_count:number; total_lines:number; total_bytes:number; symbol_count:number; dependency_count:number; test_file_count:number; language_counts:Record<string,number>; warning_count:number; hotspot_count:number }

export interface GitStatusHead { sha: string; short_sha: string; message: string; author: string; committed_at: string | null }
export interface GitStatusUpstream { name: string; ahead: number; behind: number }
export interface GitStatusRemote { name: string; fetch_url: string; push_url: string }
export interface GitStatus {
  is_git_repository: boolean
  branch: string | null
  detached: boolean
  head: GitStatusHead | null
  clean: boolean
  staged_count: number
  unstaged_count: number
  untracked_count: number
  deleted_count: number
  conflicted_count: number
  ahead: number
  behind: number
  upstream: GitStatusUpstream | null
  remotes: GitStatusRemote[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!response.ok) throw new Error(`RepoPilot API request failed: ${response.status}`)
  return response.json() as Promise<T>
}

export const api = {
  health: () => request<HealthResponse>('/health'),
  repositories: () => request<{ items: Repository[] }>('/repositories'),
  registerRepository: (payload: RepositoryRegistration) => request<Repository>('/repositories', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  deleteRepository: (repositoryId:number) => request<void>(`/repositories/${repositoryId}`, { method:'DELETE' }),
  scans: (repositoryId: number) => request<Scan[]>(`/repositories/${repositoryId}/scans`),
  latestScan: (repositoryId: number) => request<Scan>(`/repositories/${repositoryId}/scans/latest`),
  startScan: (repositoryId: number) => request<Scan>(`/repositories/${repositoryId}/scans`, { method: 'POST', body: JSON.stringify({ force: false }) }),
  scan: (repositoryId: number, scanId: number) => request<Scan>(`/repositories/${repositoryId}/scans/${scanId}`),
  files: (repositoryId: number, params: Record<string, string | number | boolean | undefined> = {}) => request<{ snapshot_id: number; items: RepositoryFile[]; next_cursor: number | null; has_more: boolean }>(`/repositories/${repositoryId}/files?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]))}`),
  file: (repositoryId:number,fileId:number) => request<RepositoryFile>(`/repositories/${repositoryId}/files/${fileId}`),
  tree: (repositoryId: number, parentPath = '') => request<{ snapshot_id: number; path: string; items: FileTreeNode[] }>(`/repositories/${repositoryId}/files/tree?parent_path=${encodeURIComponent(parentPath)}`),
  search: (repositoryId: number, query: string) => request<{ snapshot_id: number; items: SearchHit[]; next_cursor: number | null; has_more: boolean }>(`/repositories/${repositoryId}/search?q=${encodeURIComponent(query)}`),
  impact: (repositoryId: number, changedFileIds: number[], maxDepth = 3) => request<{ snapshot_id: number; changed_roots: { file_id: number; path: string }[]; affected_files: ImpactItem[]; counts: Record<string, number> }>(`/repositories/${repositoryId}/impact`, { method: 'POST', body: JSON.stringify({ changed_file_ids: changedFileIds, max_depth: maxDepth }) }),
  graph: (repositoryId: number, rootFileId: number, direction = 'both', depth = 2) => request<{ snapshot_id: number; root_file_id: number; nodes: GraphNode[]; edges: GraphEdge[]; node_count: number; edge_count: number; truncated: boolean; direction: string; depth: number }>(`/repositories/${repositoryId}/graph?root_file_id=${rootFileId}&direction=${direction}&depth=${depth}`),
  hotspots: (repositoryId:number) => request<{snapshot_id:number;items:Hotspot[];next_cursor:number|null;has_more:boolean;total:number}>(`/repositories/${repositoryId}/hotspots`),
  sourceTests: (repositoryId:number,fileId:number) => request<{snapshot_id:number;items:TestRelationship[]}>(`/repositories/${repositoryId}/files/${fileId}/tests`),
  testSources: (repositoryId:number,fileId:number) => request<{snapshot_id:number;items:TestRelationship[]}>(`/repositories/${repositoryId}/files/${fileId}/tested-sources`),
  overview: (repositoryId:number) => request<Overview>(`/repositories/${repositoryId}/overview`),
  gitStatus: (repositoryId:number) => request<GitStatus>(`/repositories/${repositoryId}/git-status`),
  fileContent: (repositoryId:number,fileId:number) => request<{snapshot_id:number;file_id:number;content:string|null;available:boolean;reason:string|null}>(`/repositories/${repositoryId}/files/${fileId}/content`),
  symbols: (repositoryId:number,fileId:number) => request<{snapshot_id:number;items:{id:number;kind:string;name:string;qualified_name:string;start_line:number;end_line:number}[]}>(`/repositories/${repositoryId}/files/${fileId}/symbols`),
  forwardDependencies: (repositoryId:number,fileId:number) => request<{items:{target_file_id:number|null;imported_name:string;evidence:string}[]}>(`/repositories/${repositoryId}/dependencies/files/${fileId}/forward`),
  reverseDependencies: (repositoryId:number,fileId:number) => request<{items:{source_file_id:number;imported_name:string;evidence:string}[]}>(`/repositories/${repositoryId}/dependencies/files/${fileId}/reverse`),
}
