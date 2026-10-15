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
  scans: (repositoryId: number) => request<Scan[]>(`/repositories/${repositoryId}/scans`),
  latestScan: (repositoryId: number) => request<Scan>(`/repositories/${repositoryId}/scans/latest`),
  startScan: (repositoryId: number) => request<Scan>(`/repositories/${repositoryId}/scans`, { method: 'POST', body: JSON.stringify({ force: false }) }),
  scan: (repositoryId: number, scanId: number) => request<Scan>(`/repositories/${repositoryId}/scans/${scanId}`),
  files: (repositoryId: number, params: Record<string, string | number | boolean | undefined> = {}) => request<{ snapshot_id: number; items: RepositoryFile[]; next_cursor: number | null; has_more: boolean }>(`/repositories/${repositoryId}/files?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]))}`),
  tree: (repositoryId: number, parentPath = '') => request<{ snapshot_id: number; path: string; items: FileTreeNode[] }>(`/repositories/${repositoryId}/files/tree?parent_path=${encodeURIComponent(parentPath)}`),
  search: (repositoryId: number, query: string) => request<{ snapshot_id: number; items: SearchHit[]; next_cursor: number | null; has_more: boolean }>(`/repositories/${repositoryId}/search?q=${encodeURIComponent(query)}`),
}
