import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, Handle, Position, useReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Search, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useHandoffDataContext } from '../lib/handoffData'

type GraphNodeData = { label: string; path: string; incoming: number; outgoing: number; isTest?: boolean }
type DependencyGraphViewProps = { onSelectFile?: (id: number) => void; onAnalyzeImpact?: (id: number) => void }

function FileNode({ data, selected }: NodeProps<Node<GraphNodeData>>) {
  return <>
    <Handle type="target" position={Position.Top} className="!bg-[#00F2FE] !border-[#00F2FE]" />
    <div className={`w-[220px] border bg-[#111622] px-3 py-2 shadow-lg ${selected ? 'border-[#00F2FE] shadow-cyan-500/20' : 'border-[#2D3A54]'}`}>
      <div className={`mb-1 h-0.5 w-full ${data.isTest ? 'bg-[#FFB703]' : 'bg-[#9D4EDD]'}`} />
      <div className="truncate font-mono text-[12px] font-semibold text-[#F1F5F9]">{data.label}</div>
      <div className="truncate text-[10px] text-[#94A3B8]">{data.path}</div>
      <div className="mt-2 flex gap-3 font-mono text-[10px] text-[#64748B]"><span>in {data.incoming}</span><span>out {data.outgoing}</span></div>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-[#00F2FE] !border-[#00F2FE]" />
  </>
}

const nodeTypes = { file: FileNode }

function GraphCanvas({ nodes, edges, selectedId, setSelectedId }: { nodes: Node<GraphNodeData>[]; edges: Edge[]; selectedId: string; setSelectedId: (id: string) => void }) {
  const { fitView, setViewport } = useReactFlow()
  useEffect(() => { const timer = window.setTimeout(() => fitView({ padding: 0.18, duration: 250 }), 0); return () => window.clearTimeout(timer) }, [fitView, nodes.length])
  return <>
    <div className="absolute left-4 top-4 z-10 flex gap-1">
      <button type="button" onClick={() => fitView({ padding: 0.18, duration: 250 })} className="border border-[#2D3A54] bg-[#111622] px-2.5 py-1.5 font-mono text-[10px] text-[#DEE2F3] hover:border-[#00F2FE] hover:text-[#00F2FE]">Fit / center</button>
      <button type="button" onClick={() => setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 180 })} className="border border-[#2D3A54] bg-[#111622] px-2.5 py-1.5 font-mono text-[10px] text-[#DEE2F3] hover:border-[#00F2FE] hover:text-[#00F2FE]">Reset view</button>
    </div>
    <ReactFlow nodes={nodes.map(node => ({ ...node, selected: node.id === selectedId }))} edges={edges} nodeTypes={nodeTypes} fitView onNodeClick={(_, node) => setSelectedId(node.id)} minZoom={0.25} maxZoom={2}>
      <Background color="#273247" gap={24} size={1} />
      <Controls className="!bg-[#111622] !border-[#2D3A54]" />
      <MiniMap nodeColor={node => node.data?.isTest ? '#FFB703' : '#9D4EDD'} className="!bg-[#0E131F] !border-[#2D3A54]" />
    </ReactFlow>
  </>
}

export const DependencyGraphView: React.FC<DependencyGraphViewProps> = ({ onSelectFile, onAnalyzeImpact }) => {
  const handoffData = useHandoffDataContext()
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const graph = handoffData?.graph
  const nodeById = useMemo(() => new Map((graph?.nodes ?? []).map(node => [String(node.id), node])), [graph])
  const nodes = useMemo<Node<GraphNodeData>[]>(() => {
    const visible = (graph?.nodes ?? []).filter(node => !search || `${node.name} ${node.path}`.toLowerCase().includes(search.toLowerCase()))
    const levels = new Map<string, number>(); const incoming = new Map<string, number>()
    visible.forEach(node => incoming.set(String(node.id), 0)); (graph?.edges ?? []).forEach(edge => { if (incoming.has(String(edge.target))) incoming.set(String(edge.target), (incoming.get(String(edge.target)) ?? 0) + 1) })
    const queue: Array<[string, number]> = visible.filter(node => !(incoming.get(String(node.id)) ?? 0)).map(node => [String(node.id), 0])
    while (queue.length) { const [id, level] = queue.shift()!; if ((levels.get(id) ?? -1) >= level) continue; levels.set(id, level); (graph?.edges ?? []).filter(edge => String(edge.source) === id).forEach(edge => queue.push([String(edge.target), level + 1])) }
    visible.forEach(node => { if (!levels.has(String(node.id))) levels.set(String(node.id), 0) })
    const byLevel = new Map<number, typeof visible>()
    visible.forEach(node => { const level = levels.get(String(node.id)) ?? 0; byLevel.set(level, [...(byLevel.get(level) ?? []), node]) })
    const positions = new Map<string, { x: number; y: number }>()
    byLevel.forEach((levelNodes, level) => {
      const ordered = [...levelNodes].sort((a, b) => a.path.localeCompare(b.path) || a.id - b.id)
      const spread = Math.max(1, ordered.length - 1)
      ordered.forEach((node, index) => positions.set(String(node.id), { x: level * 300, y: (index - spread / 2) * 150 }))
    })
    return visible.map(node => ({ id: String(node.id), type: 'file', position: positions.get(String(node.id)) ?? { x: 0, y: 0 }, data: { label: node.name ?? node.path, path: node.path, incoming: node.incoming, outgoing: node.outgoing, isTest: node.is_test } }))
  }, [graph, search])
  const edges = useMemo<Edge[]>(() => (graph?.edges ?? []).filter(edge => nodes.some(node => node.id === String(edge.source)) && nodes.some(node => node.id === String(edge.target))).map(edge => ({ id: String(edge.id), source: String(edge.source), target: String(edge.target), type: 'smoothstep', label: edge.kind, className: edge.kind === 'direct' || edge.kind === 'import' ? 'stroke-[#00F2FE]' : 'stroke-[#9D4EDD] stroke-dasharray-[4_3]' })), [graph, nodes])
  const selectedNode = nodeById.get(selectedId)
  const select = useCallback((id: string) => setSelectedId(id), [])

  if (!handoffData) return <div className="flex h-full items-center justify-center bg-[#0B0E14] text-sm text-[#94A3B8]">Loading dependency graph…</div>
  if (!graph) return <div className="flex h-full items-center justify-center bg-[#0B0E14] text-sm text-[#EF476F]">Unable to load dependency graph.</div>
  if (!graph.nodes.length) return <div className="flex h-full items-center justify-center bg-[#0B0E14] text-sm text-[#94A3B8]">No dependency relationships were found.</div>

  return <div className="flex h-full w-full flex-col overflow-hidden bg-[#0B0E14]">
    <div className="flex h-[48px] shrink-0 items-center justify-between border-b border-[#1E2638] bg-[#0E131F] px-4">
      <div className="relative w-64"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#475569]" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search in graph…" className="h-7 w-full border border-[#1E2638] bg-[#0B0E14] pl-8 pr-2 font-mono text-[11px] text-[#F1F5F9] focus:border-[#00F2FE] focus:outline-none" /></div>
      <div className="flex items-center gap-3"><span className="border border-[#00F2FE]/30 bg-[#00F2FE]/10 px-2.5 py-1 font-mono text-[11px] text-[#00F2FE]">{nodes.length} nodes · {edges.length} edges</span><Button variant="outline-cyan" size="sm" disabled={!selectedNode} onClick={() => selectedNode && onAnalyzeImpact?.(selectedNode.id)} icon={<Sparkles className="h-3.5 w-3.5" />}>Analyze Selected</Button></div>
    </div>
    <div className="relative min-h-0 flex-1 bg-[#080B10]">
      {search && !nodes.length ? <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-[#94A3B8]">No files match “{search}”.</div> : <ReactFlowProvider><GraphCanvas nodes={nodes} edges={edges} selectedId={selectedId} setSelectedId={select} /></ReactFlowProvider>}
      {selectedNode && <aside className="absolute right-4 top-4 z-10 w-72 border border-[#2D3A54] bg-[#111622] p-3 shadow-2xl"><div className="mb-2 border-b border-[#1E2638] pb-2 font-mono text-[10px] font-semibold uppercase text-[#00F2FE]">Node Inspector</div><div className="truncate font-mono text-[12px] font-bold text-[#F1F5F9]">{selectedNode.name ?? selectedNode.path}</div><div className="mb-3 truncate text-[11px] text-[#94A3B8]">{selectedNode.path}</div><div className="grid grid-cols-2 gap-2 border border-[#1E2638] bg-[#0B0E14] p-2 font-mono text-[11px]"><span className="text-[#94A3B8]">Fan-in <b className="text-[#DEE2F3]">{selectedNode.incoming}</b></span><span className="text-[#94A3B8]">Fan-out <b className="text-[#DEE2F3]">{selectedNode.outgoing}</b></span></div><Button variant="primary" className="mt-3 w-full text-xs" onClick={() => onSelectFile?.(selectedNode.id)}>Open file intelligence</Button></aside>}
    </div>
  </div>
}
