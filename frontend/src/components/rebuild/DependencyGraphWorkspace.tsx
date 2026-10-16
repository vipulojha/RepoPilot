import { useEffect, useMemo, useState } from 'react'
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node, type NodeMouseHandler } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { api, type GraphNode } from '../../lib/api/client'
import { WorkspaceHeader, WorkspacePanel, WorkspaceState } from './WorkspaceStates'

export interface DependencyGraphWorkspaceProps { repositoryId: number | null; rootFileId?: number | null; onSelectFile?: (fileId: number) => void }

export function DependencyGraphWorkspace({ repositoryId, rootFileId, onSelectFile }: DependencyGraphWorkspaceProps) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.graph>> | null>(null)
  const [error, setError] = useState('')
  const [depth, setDepth] = useState(2)
  const [mode, setMode] = useState<'repository' | 'file'>('repository')
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  useEffect(() => {
    setData(null); setError(''); setSelectedNode(null)
    if (!repositoryId || (mode === 'file' && !rootFileId)) return
    api.graph(repositoryId, mode === 'file' ? rootFileId ?? undefined : undefined, 'both', depth)
      .then(setData)
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Dependency graph unavailable'))
  }, [repositoryId, rootFileId, mode, depth])

  const nodes = useMemo<Node[]>(() => data?.nodes.map((node, index) => ({
    id: String(node.id),
    position: { x: (index % 4) * 230 + 40, y: Math.floor(index / 4) * 120 + 35 },
    data: { label: <span className={`flow-node ${node.is_test ? 'is-test' : ''}`}><strong>{node.name}</strong><small>{node.path}</small></span> },
  })) ?? [], [data])
  const edges = useMemo<Edge[]>(() => data?.edges.map(edge => ({
    id: String(edge.id), source: String(edge.source), target: String(edge.target), label: edge.kind, type: 'smoothstep', className: edge.kind === 'direct' ? 'edge-direct' : 'edge-transitive',
  })) ?? [], [data])
  const onNodeClick: NodeMouseHandler = (_event, node) => {
    const match = data?.nodes.find(item => String(item.id) === node.id) ?? null
    setSelectedNode(match)
    if (match) onSelectFile?.(match.id)
  }

  if (!repositoryId) return <WorkspaceState kind="empty">Select a repository to map dependencies.</WorkspaceState>
  if (mode === 'file' && !rootFileId) return <><WorkspaceHeader eyebrow="Repository / relationships" title="Dependency graph" detail="Focus mode needs a selected file from Files, Search, or Hotspots." /><WorkspaceState kind="empty">Select a file before focusing the graph.</WorkspaceState></>

  return <>
    <WorkspaceHeader eyebrow="Repository / relationships" title="Dependency graph" detail="Interactive module topology from indexed dependency evidence." action={<div className="graph-rebuild-controls"><button className={mode === 'repository' ? 'is-active' : ''} onClick={() => setMode('repository')}>Build repository graph</button><button className={mode === 'file' ? 'is-active' : ''} onClick={() => setMode('file')} disabled={!rootFileId}>Focus selected file</button><select value={depth} onChange={event => setDepth(Number(event.target.value))}><option value={1}>Depth 1</option><option value={2}>Depth 2</option><option value={3}>Depth 3</option></select></div>} />
    <WorkspacePanel title={data ? `${data.node_count} nodes · ${data.edge_count} edges${data.truncated ? ' · truncated' : ''}` : 'Graph canvas'}>
      {error && <WorkspaceState kind="error">{error}</WorkspaceState>}
      {!data && !error && <WorkspaceState kind="loading">Building dependency topology…</WorkspaceState>}
      {data && data.nodes.length === 0 && <WorkspaceState kind="empty">No dependency relationships were found.</WorkspaceState>}
      {data && data.nodes.length > 0 && <div className="graph-workspace"><div className="graph-canvas"><ReactFlow nodes={nodes} edges={edges} fitView onNodeClick={onNodeClick}><Background /><Controls /><MiniMap /></ReactFlow><div className="graph-legend"><span><i className="legend-direct" /> Direct dependency</span><span><i className="legend-transitive" /> Transitive relationship</span><span><i className="legend-test" /> Test file</span></div></div><aside className="graph-inspector"><div className="inspector-kicker">INSPECTOR</div>{selectedNode ? <><strong>{selectedNode.path}</strong><p className="muted">{selectedNode.language} · {selectedNode.classification}</p><div className="inspector-stats"><span>Fan-in<strong>{selectedNode.incoming}</strong></span><span>Fan-out<strong>{selectedNode.outgoing}</strong></span></div><button className="button button-quiet" onClick={() => onSelectFile?.(selectedNode.id)}>Open file intelligence</button></> : <><strong>{mode === 'file' ? 'File-rooted view' : 'Repository view'}</strong><p className="muted">Select a node to inspect its indexed evidence.</p></>}</aside></div>}
    </WorkspacePanel>
  </>
}
