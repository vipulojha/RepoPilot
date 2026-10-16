import React, { useState } from 'react';
import {
  Search,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Layers,
  ChevronDown,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useHandoffDataContext } from '../lib/handoffData';

type GraphRenderNode = { id: string; label: string; sublabel: string; category: string; x: number; y: number; risk: string; fanIn: number; fanOut: number };

export const DependencyGraphView: React.FC = () => {
  const handoffData = useHandoffDataContext();
  const GRAPH_NODES: GraphRenderNode[] = (handoffData?.graph.nodes ?? []).map((node, index) => ({ id: String(node.id), label: node.name ?? node.path, sublabel: node.path, category: 'core', x: 80 + (index % 3) * 240, y: 60 + Math.floor(index / 3) * 120, risk: 'low', fanIn: node.incoming, fanOut: node.outgoing }));
  const GRAPH_EDGES = (handoffData?.graph.edges ?? []).map(edge => ({ source: String(edge.source), target: String(edge.target), type: edge.kind === 'import' ? 'direct' : 'transitive' }));
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [depth, setDepth] = useState('2');
  const [zoomLevel, setZoomLevel] = useState(100);

  const selectedNode = GRAPH_NODES.find((n) => n.id === selectedNodeId);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(160, Math.max(60, prev + delta)));
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0E14] select-none overflow-hidden relative">
      {/* Top Controls Bar */}
      <div className="h-[48px] px-4 border-b border-[#1E2638] bg-[#0E131F] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Depth Selector */}
          <div className="flex items-center gap-1.5 h-[28px] px-2 bg-[#182030] border border-[#1E2638] text-[11px] font-mono text-[#DEE2F3]">
            <span className="text-[#94A3B8]">Depth</span>
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              className="bg-transparent text-[#00F2FE] border-0 focus:outline-none cursor-pointer font-medium"
            >
              <option value="1" className="bg-[#111622]">1</option>
              <option value="2" className="bg-[#111622]">2</option>
              <option value="3" className="bg-[#111622]">3</option>
              <option value="all" className="bg-[#111622]">All</option>
            </select>
          </div>

          {/* Search in graph */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-[#475569] absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search in graph..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[28px] pl-8 pr-2 bg-[#0B0E14] border border-[#1E2638] text-[11px] font-mono text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00F2FE]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Fit to screen */}
          <button
            onClick={() => setZoomLevel(100)}
            className="flex items-center gap-1.5 h-[28px] px-2.5 bg-[#182030] hover:bg-[#1E2638] border border-[#1E2638] text-[11px] font-mono text-[#DEE2F3] cursor-pointer"
          >
            <Maximize2 className="w-3 h-3 text-[#94A3B8]" />
            <span>Fit-to-screen</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#182030] border border-[#1E2638] h-[28px]">
            <button
              onClick={() => handleZoom(-10)}
              className="w-6 h-full flex items-center justify-center text-[#94A3B8] hover:text-[#00F2FE] hover:bg-[#1E2638] cursor-pointer"
            >
              -
            </button>
            <span className="px-2 text-[11px] font-mono text-[#DEE2F3] tabular-nums">
              {zoomLevel}%
            </span>
            <button
              onClick={() => handleZoom(10)}
              className="w-6 h-full flex items-center justify-center text-[#94A3B8] hover:text-[#00F2FE] hover:bg-[#1E2638] cursor-pointer"
            >
              +
            </button>
          </div>

          {/* Node & Edge count badge */}
          <div className="px-2.5 py-1 bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE] text-[11px] font-mono">
            {GRAPH_NODES.length} nodes • {GRAPH_EDGES.length} edges
          </div>

          {/* Analyze Selected Action */}
          <Button
            variant="outline-cyan"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Analyze Selected
          </Button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-circuit-grid bg-[#080B10]">
        <svg
          className="w-full h-full min-h-[600px] cursor-grab active:cursor-grabbing"
          viewBox="0 0 1000 750"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
        >
          <defs>
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#00F2FE" />
            </marker>
            <marker
              id="arrow-violet"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#9D4EDD" />
            </marker>
          </defs>

          {/* Edges */}
          {GRAPH_EDGES.map((edge, edgeIndex) => {
            const sourceNode = GRAPH_NODES.find((n) => n.id === edge.source);
            const targetNode = GRAPH_NODES.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isTransitive = edge.type === 'transitive';
            const strokeColor = isTransitive ? '#9D4EDD' : '#00F2FE';
            const isSelectedConn =
              sourceNode.id === selectedNodeId || targetNode.id === selectedNodeId;

            // Compute orthogonal or stepped path
            const midY = (sourceNode.y + targetNode.y) / 2;
            const pathData = `M ${sourceNode.x + 80} ${sourceNode.y + 40} C ${sourceNode.x + 80} ${midY}, ${targetNode.x + 80} ${midY}, ${targetNode.x + 80} ${targetNode.y}`;

            return (
               <g key={`${edge.source}-${edge.target}-${edgeIndex}`} opacity={isSelectedConn ? 1 : 0.6}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isSelectedConn ? '2' : '1.2'}
                  strokeDasharray={isTransitive ? '4 3' : undefined}
                  markerEnd={`url(#${isTransitive ? 'arrow-violet' : 'arrow-cyan'})`}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {GRAPH_NODES.map((node) => {
            const isSelected = selectedNodeId === node.id;
            let topAccent = '#00F2FE';
            if (node.category === 'core') topAccent = '#9D4EDD';
            if (node.category === 'api') topAccent = '#00F2FE';
            if (node.category === 'service') topAccent = '#06D6A0';
            if (node.category === 'model') topAccent = '#FFB703';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNodeId(node.id)}
                className="cursor-pointer select-none"
              >
                {/* Node Box */}
                <rect
                  width="160"
                  height="54"
                  fill="#111622"
                  stroke={isSelected ? '#00F2FE' : '#1E2638'}
                  strokeWidth={isSelected ? '2' : '1'}
                  style={
                    isSelected
                      ? { filter: 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.4))' }
                      : undefined
                  }
                />
                {/* Top Accent Line */}
                <line
                  x1="0"
                  y1="0"
                  x2="160"
                  y2="0"
                  stroke={topAccent}
                  strokeWidth="3"
                />

                {/* Port Sockets (sharp squares) */}
                <rect x="76" y="-3" width="8" height="6" fill={topAccent} />
                <rect x="76" y="51" width="8" height="6" fill={topAccent} />
                <rect x="-3" y="24" width="6" height="6" fill="#1E2638" />
                <rect x="157" y="24" width="6" height="6" fill="#1E2638" />

                {/* Node Text */}
                <text
                  x="12"
                  y="22"
                  fill="#F1F5F9"
                  fontFamily="JetBrains Mono"
                  fontSize="12"
                  fontWeight="600"
                >
                  {node.label}
                </text>
                <text
                  x="12"
                  y="40"
                  fill="#94A3B8"
                  fontFamily="Geist"
                  fontSize="11"
                >
                  {node.sublabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Toolbar at bottom-left */}
        <div className="absolute bottom-4 left-4 flex flex-col bg-[#111622] border border-[#1E2638] z-10 shadow-lg">
          <button
            onClick={() => handleZoom(10)}
            className="w-8 h-8 flex items-center justify-center text-[#94A3B8] hover:text-[#00F2FE] hover:bg-[#182030] border-b border-[#1E2638] cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-10)}
            className="w-8 h-8 flex items-center justify-center text-[#94A3B8] hover:text-[#00F2FE] hover:bg-[#182030] border-b border-[#1E2638] cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="w-8 h-8 flex items-center justify-center text-[#94A3B8] hover:text-[#00F2FE] hover:bg-[#182030] border-b border-[#1E2638] cursor-pointer"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center text-[#94A3B8] hover:text-[#00F2FE] hover:bg-[#182030] border-b border-[#1E2638] cursor-pointer"
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedNodeId(GRAPH_NODES[0]?.id ?? '')}
            className="w-8 h-8 flex items-center justify-center text-[#94A3B8] hover:text-[#00F2FE] hover:bg-[#182030] cursor-pointer"
            title="Reset Focus"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Mini-map Box at bottom-right */}
        <div className="absolute bottom-4 right-4 w-44 h-28 bg-[#0E131F] border border-[#2D3A54] p-1.5 z-10 shadow-lg">
          <div className="text-[9px] font-mono text-[#475569] uppercase mb-1">
            Minimap
          </div>
          <div className="w-full h-20 bg-[#0B0E14] border border-[#1E2638] relative overflow-hidden flex items-center justify-center">
            {/* Abstract node wireframes */}
            <div className="w-24 h-14 border border-[#00F2FE]/40 relative">
              <span className="absolute top-1 left-3 w-4 h-2 bg-[#00F2FE]/60" />
              <span className="absolute top-6 left-3 w-4 h-2 bg-[#9D4EDD]/60" />
              <span className="absolute top-10 left-3 w-4 h-2 bg-[#06D6A0]/60" />
              <span className="absolute top-6 left-12 w-4 h-2 bg-[#FFB703]/60" />
            </div>
            {/* Viewport rectangle indicator */}
            <div className="absolute inset-2 border border-[#00F2FE] bg-[#00F2FE]/5 pointer-events-none" />
          </div>
        </div>

        {/* Node Detail Drawer (if selected) */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-72 bg-[#111622] border border-[#2D3A54] p-3 z-10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E2638] pb-2 mb-2">
              <span className="text-[10px] font-mono text-[#00F2FE] uppercase font-semibold">
                Node Inspector
              </span>
              <span className="px-1.5 py-0.2 bg-[#00F2FE]/15 text-[#00F2FE] text-[9px] font-mono uppercase">
                {selectedNode.category}
              </span>
            </div>
            <div className="font-mono text-[12px] font-bold text-[#F1F5F9] truncate">
              {selectedNode.label}
            </div>
            <div className="text-[11px] font-sans-geist text-[#94A3B8] mb-3">
              {selectedNode.sublabel}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#0B0E14] p-2 border border-[#1E2638] mb-3">
              <div>
                <span className="text-[#475569] block">Fan-In:</span>
                <span className="text-[#DEE2F3] font-semibold">{selectedNode.fanIn} callers</span>
              </div>
              <div>
                <span className="text-[#475569] block">Fan-Out:</span>
                <span className="text-[#DEE2F3] font-semibold">{selectedNode.fanOut} targets</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#475569] block">Risk Rating:</span>
                <span className={`font-semibold ${selectedNode.risk === 'High' ? 'text-[#EF476F]' : 'text-[#06D6A0]'}`}>
                  {selectedNode.risk} Impact Radius
                </span>
              </div>
            </div>

            <Button variant="primary" className="w-full text-xs">
              Trace Impact Egress
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
