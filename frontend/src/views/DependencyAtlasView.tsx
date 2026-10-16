import React, { useState } from 'react';
import { Gauge, ShieldAlert, Cpu, Activity, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

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

export const DependencyAtlasView: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string>('tokenValidator.ts');

  const nodes: AtlasNode[] = [
    { id: 'api-gateway.go-top', name: 'api-gateway.go', tag: 'GO', tagColor: '#00F2FE', detail: '299 size | 1 functions', x: 420, y: 70 },
    { id: 'api-gateway.go-left', name: 'api-gateway.go', tag: 'GO', tagColor: '#00F2FE', detail: '3.08 size | Junctions', x: 80, y: 350 },
    { id: 'tokenValidator.ts-top', name: 'tokenValidator.ts', tag: 'TS', tagColor: '#00F2FE', detail: '703 line | 1 functions', x: 260, y: 170 },
    { id: 'tokenValidator.ts-mid', name: 'tokenValidator.ts', tag: 'TS', tagColor: '#00F2FE', detail: '328 line | 1 functions', x: 190, y: 260 },
    { id: 'router.ts', name: 'router.ts', tag: 'TS', tagColor: '#00F2FE', detail: '138 line | 1 functions', x: 310, y: 260 },
    { id: 'db-pool.rs', name: 'db-pool.rs', tag: 'RS', tagColor: '#FFB703', detail: '700 lines | signatures', x: 440, y: 260, couplingBadge: { label: 'Inert coupling', color: '#FFB703' } },
    { id: 'oauth-service.py', name: 'oauth-service.py', tag: 'PY', tagColor: '#FFB703', detail: '289 line | signatures', x: 570, y: 260 },
    { id: 'config-loader.rs-1', name: 'config-loader.rs', tag: 'RS', tagColor: '#FFB703', detail: '708 line | signatures', x: 700, y: 180 },
    { id: 'config-loader.rs-2', name: 'config-loader.rs', tag: 'RS', tagColor: '#FFB703', detail: 'functions | signatures', x: 700, y: 260, couplingBadge: { label: 'cyclic link', color: '#FFB703' } },
    { id: 'data-pipeline.go-1', name: 'data-pipeline.go', tag: 'GO', tagColor: '#00F2FE', detail: '218 size | signatures', x: 830, y: 260 },
    { id: 'tokenValidator.ts-mid2', name: 'tokenValidator.ts', tag: 'TS', tagColor: '#00F2FE', detail: '296 size | 1 functions', x: 310, y: 370 },
    { id: 'db-pool.rs-2', name: 'db-pool.rs', tag: 'RS', tagColor: '#FFB703', detail: '178 line | signatures', x: 440, y: 370, couplingBadge: { label: 'High coupling', color: '#FFB703' } },
    { id: 'oauth-service.py-2', name: 'oauth-service.py', tag: 'PY', tagColor: '#FFB703', detail: '275 line | 1 junctions', x: 570, y: 370 },
    { id: 'config-loader.rs-3', name: 'config-loader.rs', tag: 'RS', tagColor: '#FFB703', detail: 'functions | signatures', x: 700, y: 370 },
    { id: 'data-pipeline.go-2', name: 'data-pipeline.go', tag: 'GO', tagColor: '#00F2FE', detail: '388 line | signatures', x: 830, y: 370 },
    { id: 'tokenValidator.ts-bot', name: 'tokenValidator.ts', tag: 'TS', tagColor: '#00F2FE', detail: '588 size | functions', x: 190, y: 480 },
    { id: 'router.quer', name: 'router.query', tag: 'TS', tagColor: '#00F2FE', detail: '578 size | Functions', x: 310, y: 480 },
    { id: 'oauth-service.py-3', name: 'oauth-service.py', tag: 'PY', tagColor: '#FFB703', detail: '179 line | signatures', x: 440, y: 480 },
    { id: 'tokenValidator.rs-low', name: 'tokenValidator.ts', tag: 'RS', tagColor: '#FFB703', detail: '230 size | signatures', x: 440, y: 590, couplingBadge: { label: 'High coupling', color: '#FFB703' } },
    { id: 'db-service.py', name: 'db-service.py', tag: 'BS', tagColor: '#FFB703', detail: '238 size | signatures', x: 440, y: 700, couplingBadge: { label: 'cyclic link', color: '#FFB703' } },
  ];

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
            <span className="text-[#DEE2F3]">12.5K / 1855</span>
          </div>
          <div>
            <span className="text-[#475569] block text-[9px]">MCYS</span>
            <span className="text-[#00F2FE]">2.3%</span>
          </div>
          <div>
            <span className="text-[#475569] block text-[9px]">VERSION</span>
            <span className="text-[#DEE2F3]">23029</span>
          </div>
          <div>
            <span className="text-[#475569] block text-[9px]">VERSION</span>
            <span className="text-[#DEE2F3]">W00D22</span>
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
          <div className="text-[10px] text-[#94A3B8] mt-2">NODE COUNT: 342</div>
        </div>

        {/* Right Risk Index Gauge */}
        <div className="absolute top-6 right-6 z-10 flex flex-col items-center">
          <div className="text-[9px] text-[#475569] mb-1">RISK INDEX</div>
          <div className="relative w-16 h-16 rounded-full border border-[#1E2638] flex items-center justify-center bg-[#111622]">
            <svg viewBox="0 0 60 60" className="w-full h-full">
              <circle cx="30" cy="30" r="22" stroke="#1E2638" strokeWidth="3" fill="none" />
              <circle cx="30" cy="30" r="22" stroke="#FFB703" strokeWidth="3" strokeDasharray="75 100" fill="none" />
            </svg>
            <span className="text-[14px] font-bold text-[#FFB703] absolute font-headline">342</span>
          </div>
          <div className="text-[9px] text-[#FFB703] mt-2 uppercase tracking-wider">ELEVATED EXPOSURE</div>
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
          <path
            d="M 170 370 H 420 V 90 H 510 M 510 90 H 870 V 270 M 170 370 H 130 V 710 H 440 M 170 490 H 145 V 720 H 440"
            fill="none"
            stroke="#00F2FE"
            strokeWidth="2.5"
            filter="url(#glow-cyan)"
          />

          {/* Violet Cross-Bus Lines */}
          <path
            d="M 260 280 H 750 V 380 M 360 280 V 500 H 600 M 470 280 V 700"
            fill="none"
            stroke="#9D4EDD"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Amber Downstream Coupling Lines */}
          <path
            d="M 490 280 V 370 M 620 280 V 600 H 700 M 750 280 V 370"
            fill="none"
            stroke="#FFB703"
            strokeWidth="1.5"
          />

          {/* Render Atlas Nodes */}
          {nodes.map((node) => {
            const isSelected = activeNode === node.name;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x - 60}, ${node.y - 20})`}
                onClick={() => setActiveNode(node.name)}
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
