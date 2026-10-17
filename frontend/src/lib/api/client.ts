const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

interface HealthResponse {
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

interface RepositoryRegistration {
  name: string
  path: string
  branch?: string
}
interface OnboardingInspection { path:string; exists:boolean; kind:'folder'|'file'; canonical_path:string|null; repository_root:string|null; repository_name:string|null; branch:string|null; is_git_repository:boolean; is_project:boolean; is_empty:boolean; is_registered:boolean; repository_id:number|null; supported_file:boolean|null; standalone_supported:boolean; message:string|null }

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

interface FileTreeNode {
  name: string
  path: string
  kind: 'directory' | 'file'
  language?: string | null
  size_bytes?: number | null
  child_count?: number | null
}
export interface SearchHit { type: string; file_id: number; symbol_id: number | null; path: string; name: string; language: string | null; line: number | null; snippet: string; rank: number }
export interface ImpactItem { file_id: number; path: string; depth: number; changed_root_ids: number[]; dependency_path: { file_id: number; path: string }[]; evidence: { imported_name: string; kind: string; source_line: number; source_column: number; evidence: string }[] }
interface ImpactTestValidation { file_id: number; file_path: string; test_file_id?: number; test_path?: string; status: string; tag: string; cases: string; detail: string; type: 'passing' | 'warning' | 'error'; evidence_level?: string }
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
export interface GitChangedFile { path:string; old_path:string|null; status:string; additions:number; deletions:number; file_id:number|null; unresolved?:boolean; diff_lines?:DiffLine[] }
export interface GitCommit { sha:string; short_sha:string; subject:string; author:string; committed_at:string; parents:string[]; is_merge:boolean; changed_files:number; additions:number; deletions:number; files:GitChangedFile[] }
export interface GitHistory { items:GitCommit[]; page:number; limit:number; has_more:boolean; ref:string|null; detached:boolean; empty:boolean }
interface GitCommitDetail extends GitCommit {}
interface GitFileHistory { file_id:number; path:string; commits:GitCommit[]; next_cursor:string|null; has_more:boolean; truncated:boolean }
interface GitCompare { base:string; head:string; files:{path:string;status:string;additions:number;deletions:number;file_id:number|null}[]; additions:number; deletions:number; truncated:boolean }
export interface DiffLine { type:'add'|'del'|'context'; code:string; old_num?:number; new_num?:number }
interface ChangedFileAnalysis { git?:GitChangedFile; path:string; old_path:string|null; status:string; additions:number; deletions:number; file_id:number|null; affected:boolean; unresolved:boolean; diff_lines:DiffLine[] }
interface ChangesResponse { state:string; repository_id:number; snapshot_id:number|null; git:GitStatus|null; diff:{files:number;additions:number;deletions:number}; changed_files:ChangedFileAnalysis[]; affected_files:ImpactItem[]; hotspots:Hotspot[]; tests:TestRelationship[]; risk:{score:number;level:string;reasons:string[];thresholds:Record<string,number>}; truncated:boolean }
type GitAction = 'stage'|'unstage'|'commit'|'branch_create'|'branch_switch'|'fetch'|'push'|'pull'|'revert'|'stash_create'|'stash_list'|'stash_apply'|'stash_pop'|'stash_drop'
type GitActionPayload = { action:GitAction; paths?:string[]; message?:string; name?:string; start_point?:string; confirm_dirty?:boolean; remote?:string; branch?:string; commit?:string; stash?:string; confirm?:boolean }
interface GitActionReceipt { action:GitAction; status:'succeeded'|'rejected'|'conflict'|'failed'; message:string; recovery_guidance?:string|null; git:GitStatus|null; intelligence_stale:boolean; stdout_summary?:string|null }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  const contentType = response.headers.get('content-type') ?? ''
  if (!response.ok) {
    const detail = contentType.includes('json') ? await response.json().catch(() => null) : null
    throw new Error(detail?.detail ?? detail?.error?.message ?? `RepoPilot API request failed: ${response.status}`)
  }
  if (!contentType.includes('json')) throw new Error(`RepoPilot API returned a non-JSON response for ${path}`)
  return response.json() as Promise<T>
}

export const api = {
  health: () => request<HealthResponse>('/health'),
  repositories: () => request<{ items: Repository[] }>('/repositories'),
  registerRepository: (payload: RepositoryRegistration) => request<Repository>('/repositories', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  inspectPath: (payload:{kind:'folder'|'file';path:string}) => request<OnboardingInspection>('/repositories/inspect', { method:'POST', body:JSON.stringify(payload) }),
  onboardRepository: (payload:{path:string;name?:string;initialize_git?:boolean}) => request<Repository>('/repositories/onboard', { method:'POST', body:JSON.stringify(payload) }),
  cloneRepository: (payload:{url:string;destination:string}) => request<{repository:Repository;cloned_path:string}>('/repositories/clone', { method:'POST', body:JSON.stringify(payload) }),
  deleteRepository: (repositoryId:number) => request<void>(`/repositories/${repositoryId}`, { method:'DELETE' }),
  scans: (repositoryId: number) => request<Scan[]>(`/repositories/${repositoryId}/scans`),
  latestScan: (repositoryId: number) => request<Scan>(`/repositories/${repositoryId}/scans/latest`),
  startScan: (repositoryId: number) => request<Scan>(`/repositories/${repositoryId}/scans`, { method: 'POST', body: JSON.stringify({ force: false }) }),
  scan: (repositoryId: number, scanId: number) => request<Scan>(`/repositories/${repositoryId}/scans/${scanId}`),
  files: (repositoryId: number, params: Record<string, string | number | boolean | undefined> = {}) => request<{ snapshot_id: number; items: RepositoryFile[]; next_cursor: number | null; has_more: boolean }>(`/repositories/${repositoryId}/files?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]))}`),
  file: (repositoryId:number,fileId:number) => request<RepositoryFile>(`/repositories/${repositoryId}/files/${fileId}`),
  tree: (repositoryId: number, parentPath = '') => request<{ snapshot_id: number; path: string; items: FileTreeNode[] }>(`/repositories/${repositoryId}/files/tree?parent_path=${encodeURIComponent(parentPath)}`),
  search: (repositoryId: number, query: string) => request<{ snapshot_id: number; items: SearchHit[]; next_cursor: number | null; has_more: boolean }>(`/repositories/${repositoryId}/search?q=${encodeURIComponent(query)}`),
  impact: (repositoryId: number, changedFileIds: number[], maxDepth = 3) => request<{ snapshot_id: number; changed_roots: { file_id: number; path: string }[]; affected_files: ImpactItem[]; counts: Record<string, number>; test_validation: ImpactTestValidation[] }>(`/repositories/${repositoryId}/impact`, { method: 'POST', body: JSON.stringify({ changed_file_ids: changedFileIds, max_depth: maxDepth }) }),
  graph: (repositoryId: number, rootFileId?: number, direction = 'both', depth = 2) => request<{ snapshot_id: number; root_file_id: number; nodes: GraphNode[]; edges: GraphEdge[]; node_count: number; edge_count: number; truncated: boolean; direction: string; depth: number }>(`/repositories/${repositoryId}/graph?${rootFileId ? `root_file_id=${rootFileId}&` : ''}direction=${direction}&depth=${depth}`),
  hotspots: (repositoryId:number) => request<{snapshot_id:number;items:Hotspot[];next_cursor:number|null;has_more:boolean;total:number}>(`/repositories/${repositoryId}/hotspots`),
  sourceTests: (repositoryId:number,fileId:number) => request<{snapshot_id:number;items:TestRelationship[]}>(`/repositories/${repositoryId}/files/${fileId}/tests`),
  testSources: (repositoryId:number,fileId:number) => request<{snapshot_id:number;items:TestRelationship[]}>(`/repositories/${repositoryId}/files/${fileId}/tested-sources`),
  overview: (repositoryId:number) => request<Overview>(`/repositories/${repositoryId}/overview`),
  gitStatus: (repositoryId:number) => request<GitStatus>(`/repositories/${repositoryId}/git/status`),
  git: {
    history: (repositoryId:number, page=1, limit=20) => request<GitHistory>(`/repositories/${repositoryId}/git/history?page=${page}&limit=${limit}`),
    commit: (repositoryId:number, sha:string) => request<GitCommitDetail>(`/repositories/${repositoryId}/git/commits/${encodeURIComponent(sha)}`),
    fileHistory: (repositoryId:number, fileId:number, cursor?:string, limit=20) => request<GitFileHistory>(`/repositories/${repositoryId}/git/files/${fileId}/history?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),
    compare: (repositoryId:number, base:string, head='HEAD') => request<GitCompare>(`/repositories/${repositoryId}/git/compare?base=${encodeURIComponent(base)}&head=${encodeURIComponent(head)}`),
  },
  changes: (repositoryId:number) => request<ChangesResponse>(`/repositories/${repositoryId}/changes`),
  gitAction: (repositoryId:number, payload:GitActionPayload) => request<GitActionReceipt>(`/repositories/${repositoryId}/git/actions`, { method:'POST', body:JSON.stringify(payload) }),
  fileContent: (repositoryId:number,fileId:number) => request<{snapshot_id:number;file_id:number;content:string|null;available:boolean;reason:string|null}>(`/repositories/${repositoryId}/files/${fileId}/content`),
  symbols: (repositoryId:number,fileId:number) => request<{snapshot_id:number;items:{id:number;kind:string;name:string;qualified_name:string;start_line:number;end_line:number}[]}>(`/repositories/${repositoryId}/files/${fileId}/symbols`),
  forwardDependencies: (repositoryId:number,fileId:number) => request<{items:{target_file_id:number|null;imported_name:string;evidence:string}[]}>(`/repositories/${repositoryId}/dependencies/files/${fileId}/forward`),
  reverseDependencies: (repositoryId:number,fileId:number) => request<{items:{source_file_id:number;imported_name:string;evidence:string}[]}>(`/repositories/${repositoryId}/dependencies/files/${fileId}/reverse`),
}
