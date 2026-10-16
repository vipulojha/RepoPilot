import React, { useMemo, useState } from 'react';
import { Gauge, ShieldAlert, Cpu, Activity, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useHandoffDataContext } from '../lib/handoffData';

interface AtlasNode {
  id: string;
  name: string;
  tag: string;
  tagColor: string;
  detail: string;
  x: number;
  y: number;
  couplingBadge?: { label: string; color: string };
}

export const DependencyAtlasView: React.FC<{ onSelectFile?: (fileId: number) => void }> = ({ onSelectFile }) => {
  const data = useHandoffDataContext();
  const nodes: AtlasNode[] = useMemo(() => (data?.graph.nodes ?? []).map((node, index) => {
    const columns = 6;
    const language = (node.language || 'FILE').slice(0, 2).toUpperCase();
    return { id: String(node.id), name: node.name || node.path, tag: language, tagColor: node.is_test ? '#FFB703' : '#00F2FE', detail: `${node.incoming + node.outgoing} links | ${node.incoming} in / ${node.outgoing} out`, x: 100 + (index % columns) * 160, y: 120 + Math.floor(index / columns) * 90, couplingBadge: node.incoming + node.outgoing > 8 ? { label: 'High coupling', color: '#FFB703' } : undefined };
  }), [data]);
  const [activeNode, setActiveNode] = useState<string>('');
  const selectedNode = data?.graph.nodes.find(node => String(node.id) === activeNode);

  /* Positions are presentation-only; topology and labels come from the graph API. */
  const graphEdges = data?.graph.edges ?? [];
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const edgePaths = graphEdges.flatMap(edge => {
    const source = nodeById.get(String(edge.source)); const target = nodeById.get(String(edge.target));
    return source && target ? [`M ${source.x} ${source.y} L ${target.x} ${target.y}`] : [];
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#07090E] select-none overflow-hidden relative font-mono text-[#DEE2F3]">
      {/* Blueprint Header */}
      <div className="h-[56px] px-6 border-b border-[#1E2638] bg-[#0A0D14] flex items-center justify-between shrink-0 z-20">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-[14px] text-[#F1F5F9] tracking-wider">
              REPO PILOT // DEPENDENCY ATLAS
            </span>
          </div>
          <div className="text-[10px] text-[#00F2FE] tracking-widest uppercase">
            SIGNATURE DEPENDENCY GRAPH
          </div>
        </div>

        {/* Telemetry indices */}
        <div className="flex items-center gap-6 text-[11px] text-[#94A3B8]">
          <div>
            <span className="text-[#475569] block text-[9px]">TELEMETRY</span>
            <span className="text-[#DEE2F3]">{data?.graph.nodes.length ?? 0} / {data?.graph.edges.length ?? 0}</span>
          </div>
          <div>
            <span className="text-[#475569] block text-[9px]">EDGE DENSITY</span>
            <span className="text-[#00F2FE]">{nodes.length ? `${(graphEdges.length / nodes.length).toFixed(2)} / node` : '—'}</span>
          </div>
          <div>
            <span className="text-[#475569] block text-[9px]">VERSION</span>
            <span className="text-[#DEE2F3]">{selectedNode?.name ?? '—'}</span>
          </div>
          <div>
            <span className="text-[#475569] block text-[9px]">SNAPSHOT</span>
            <span className="text-[#DEE2F3]">{data?.overview?.snapshot_id ?? '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 pl-3 border-l border-[#1E2638]">
            <span className="w-2 h-2 rounded-full bg-[#06D6A0] animate-pulse" />
            <span className="text-[10px] text-[#06D6A0] font-semibold">SYSTEM STATUS</span>
          </div>
        </div>
      </div>

      {/* Cybernetic Grid Canvas */}
      <div className="flex-1 relative overflow-auto bg-circuit-grid-dense p-4 flex items-center justify-center">
        {/* Left Telemetry Gauges */}
        <div className="absolute top-6 left-6 z-10 flex flex-col items-center">
          <div className="text-[9px] text-[#475569] mb-1">IMPORTS ANALYSIS</div>
          <div className="relative w-16 h-16 rounded-full border border-[#1E2638] flex items-center justify-center">
            <svg viewBox="0 0 60 60" className="w-full h-full">
              <circle cx="30" cy="30" r="22" stroke="#1E2638" strokeWidth="3" fill="none" />
              <circle cx="30" cy="30" r="22" stroke="#00F2FE" strokeWidth="3" strokeDasharray="60 100" fill="none" />
            </svg>
            <Gauge className="w-5 h-5 text-[#00F2FE] absolute" />
          </div>
           <div className="text-[10px] text-[#94A3B8] mt-2">NODE COUNT: {data?.graph.nodes.length ?? 0}</div>
        </div>

        {/* Right Risk Index Gauge */}
        <div className="absolute top-6 right-6 z-10 flex flex-col items-center">
          <div className="text-[9px] text-[#475569] mb-1">RISK INDEX</div>
          <div className="relative w-16 h-16 rounded-full border border-[#1E2638] flex items-center justify-center bg-[#111622]">
            <svg viewBox="0 0 60 60" className="w-full h-full">
              <circle cx="30" cy="30" r="22" stroke="#1E2638" strokeWidth="3" fill="none" />
              <circle cx="30" cy="30" r="22" stroke="#FFB703" strokeWidth="3" strokeDasharray="75 100" fill="none" />
            </svg>
             <span className="text-[14px] font-bold text-[#FFB703] absolute font-headline">{data?.graph.edges.length ?? 0}</span>
          </div>
           <div className="text-[9px] text-[#FFB703] mt-2 uppercase tracking-wider">{data?.overview?.hotspot_count ?? 0} hotspots</div>
        </div>

        {/* Visual Graph Nodes & Bus Lines SVG */}
        <svg viewBox="0 0 1050 820" className="w-[1050px] h-[820px] select-none">
          <defs>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00F2FE" floodOpacity="0.8" />
            </filter>
            <filter id="glow-violet" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#9D4EDD" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Cyan Primary Highway Circuit Track */}
           {edgePaths.map((path, index) => <path key={index} d={path} fill="none" stroke="#00F2FE" strokeWidth="1.5" opacity="0.65" />)}

          {/* Render Atlas Nodes */}
          {nodes.map((node) => {
                 const isSelected = activeNode === node.id;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x - 60}, ${node.y - 20})`}
                 onClick={() => { setActiveNode(node.id); onSelectFile?.(Number(node.id)) }}
                className="cursor-pointer"
              >
                {/* Node Box */}
                <rect
                  width="130"
                  height="42"
                  fill="#0D111A"
                  stroke={isSelected ? '#00F2FE' : '#1E2638'}
                  strokeWidth={isSelected ? '2' : '1'}
                />

                {/* Coupling Badge (if any) */}
                {node.couplingBadge && (
                  <g transform="translate(45, -10)">
                    <rect width="70" height="14" fill="#FFB703" rx="0" />
                    <text
                      x="35"
                      y="10"
                      fill="#0B0E14"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="JetBrains Mono"
                    >
                      {node.couplingBadge.label}
                    </text>
                  </g>
                )}

                {/* Name */}
                <text
                  x="8"
                  y="18"
                  fill="#F1F5F9"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="JetBrains Mono"
                >
                  {node.name}
                </text>

                {/* Detail */}
                <text
                  x="8"
                  y="32"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                >
                  {node.detail}
                </text>

                {/* Tag Pill */}
                <rect
                  x="102"
                  y="8"
                  width="20"
                  height="13"
                  fill={node.tagColor}
                  fillOpacity="0.2"
                  stroke={node.tagColor}
                  strokeWidth="0.8"
                />
                <text
                  x="112"
                  y="18"
                  fill={node.tagColor}
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono"
                >
                  {node.tag}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
