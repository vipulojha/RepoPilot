import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './api/client'
import { loadHandoffData } from './handoffData'

vi.mock('./api/client', () => ({ api: {
  latestScan: vi.fn(), overview: vi.fn(), files: vi.fn(), graph: vi.fn(), hotspots: vi.fn(), changes: vi.fn(),
  git: { history: vi.fn() }, gitStatus: vi.fn(),
} }))

const scan = { id: 1, repository_id: 7, status: 'ready' as const, started_at: null, completed_at: null, processed_files: 0, discovered_files: 0, percentage: 100, statistics: { file_count: 0, total_bytes: 0, total_lines: 0 }, warnings: [] }
const overview = { snapshot_id: 1, file_count: 0, total_lines: 0, total_bytes: 0, symbol_count: 0, dependency_count: 0, test_file_count: 0, language_counts: {}, warning_count: 0, hotspot_count: 0 }

function configureSuccesses() {
  vi.mocked(api.latestScan).mockResolvedValue(scan)
  vi.mocked(api.overview).mockResolvedValue(overview)
  vi.mocked(api.files).mockResolvedValue({ snapshot_id: 1, items: [], next_cursor: null, has_more: false })
  vi.mocked(api.graph).mockResolvedValue({ snapshot_id: 1, root_file_id: 0, nodes: [], edges: [], node_count: 0, edge_count: 0, truncated: false, direction: 'both', depth: 2 })
  vi.mocked(api.hotspots).mockResolvedValue({ snapshot_id: 1, items: [], next_cursor: null, has_more: false, total: 0 })
  vi.mocked(api.changes).mockResolvedValue({ state: 'ready', repository_id: 7, snapshot_id: 1, git: null, diff: null, changed_files: [], affected_files: [], hotspots: [], tests: [], risk: null, truncated: false } as never)
  vi.mocked(api.git.history).mockResolvedValue({ items: [], page: 1, limit: 20, has_more: false, ref: 'HEAD', detached: false, empty: true })
  vi.mocked(api.gitStatus).mockResolvedValue({} as never)
}

describe('loadHandoffData', () => {
  beforeEach(() => { vi.clearAllMocks(); configureSuccesses() })

  it('returns an empty successful workspace for legitimate empty data', async () => {
    const result = await loadHandoffData(7)
    expect(result.error).toBeNull()
    expect(result.data.status).toBe('empty')
    expect(result.data.endpointErrors).toEqual({})
  })

  it('preserves an overview failure', async () => {
    vi.mocked(api.overview).mockRejectedValue(new Error('overview unavailable'))
    const result = await loadHandoffData(7)
    expect(result.data.endpointErrors.overview).toBe('overview unavailable')
    expect(result.data.status).toBe('partial')
  })

  it('preserves a files failure instead of returning a fake empty file list', async () => {
    vi.mocked(api.files).mockRejectedValue(new Error('files unavailable'))
    const result = await loadHandoffData(7)
    expect(result.data.endpointErrors.files).toBe('files unavailable')
    expect(result.data.files).toEqual([])
    expect(result.data.status).toBe('partial')
  })

  it('preserves a graph failure instead of reporting zero relationships', async () => {
    vi.mocked(api.graph).mockRejectedValue(new Error('graph unavailable'))
    const result = await loadHandoffData(7)
    expect(result.data.endpointErrors.graph).toBe('graph unavailable')
    expect(result.data.graph.nodes).toEqual([])
    expect(result.data.status).toBe('partial')
  })

  it('reports partial failures while keeping successful data', async () => {
    vi.mocked(api.files).mockResolvedValue({ snapshot_id: 1, items: [{ id: 3, snapshot_id: 1, relative_path: 'src/main.ts', name: 'main.ts', extension: '.ts', language: 'TypeScript', classification: 'source', size_bytes: 10, line_count: 1, is_binary: false, is_test: false, warning: null }], next_cursor: null, has_more: false })
    vi.mocked(api.graph).mockRejectedValue(new Error('graph unavailable'))
    const result = await loadHandoffData(7)
    expect(result.data.files).toHaveLength(1)
    expect(result.data.endpointErrors).toEqual({ graph: 'graph unavailable' })
    expect(result.data.status).toBe('partial')
  })

  it('reports total failure as unavailable', async () => {
    vi.mocked(api.latestScan).mockRejectedValue(new Error('repository unavailable'))
    vi.mocked(api.overview).mockRejectedValue(new Error('repository unavailable'))
    vi.mocked(api.files).mockRejectedValue(new Error('repository unavailable'))
    vi.mocked(api.graph).mockRejectedValue(new Error('repository unavailable'))
    vi.mocked(api.hotspots).mockRejectedValue(new Error('repository unavailable'))
    vi.mocked(api.changes).mockRejectedValue(new Error('repository unavailable'))
    vi.mocked(api.git.history).mockRejectedValue(new Error('repository unavailable'))
    vi.mocked(api.gitStatus).mockRejectedValue(new Error('repository unavailable'))
    const result = await loadHandoffData(7)
    expect(result.error).toBe('repository unavailable')
    expect(result.data.status).toBe('unavailable')
  })
})
