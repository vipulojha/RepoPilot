import React, { useState } from 'react';
import { Sparkles, ArrowRight, Activity, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useHandoffDataContext } from '../lib/handoffData';

export interface HotspotsViewProps {
  onAnalyzeImpact?: (path: string) => void;
}

export const HotspotsView: React.FC<HotspotsViewProps> = ({ onAnalyzeImpact }) => {
  const handoffData = useHandoffDataContext();
  const HOTSPOTS_DATA = (handoffData?.hotspots ?? []).map((item, index) => ({ rank: `#${String(index + 1).padStart(2, '0')}`, path: item.path, lines: item.metrics?.lines ?? 0, callers: item.metrics?.fan_in ?? 0, deps: item.metrics?.fan_out ?? 0, score: item.score, signal: item.reasons?.join(', ') ?? '' }));
  const [selectedHotspot, setSelectedHotspot] = useState<string>('#04');

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0E14] select-none overflow-y-auto p-6 space-y-6">
      {/* Top Header & Scatter Plot Split */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-[#1E2638] pb-6">
        <div>
          <div className="text-[10px] font-mono text-[#00F2FE] tracking-widest uppercase mb-1">
            ANALYZE / REPOSITORY SIGNALS
          </div>
          <h1 className="font-headline font-bold text-2xl text-[#F1F5F9] tracking-tight">
            Hotspots
          </h1>
          <p className="text-[12px] font-sans-geist text-[#94A3B8] mt-1">
            Static structural signals derived from AST caller density, fan-in/fan-out ratios, and change churn.
          </p>
        </div>

        {/* Top Right Scatter Plot (Fan-In vs Churn/Complexity) */}
        <div className="bg-[#111622] border border-[#1E2638] p-3 w-full lg:w-96 shrink-0">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] mb-1">
            <span>STATIC AFFINITY MATRIX</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F2FE]" />
              <span className="text-[9px]">Nominal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB703] ml-1" />
              <span className="text-[9px]">High Risk</span>
            </div>
          </div>

          {/* Scatter Plot SVG */}
          <div className="relative h-32 w-full bg-[#0B0E14] border border-[#1E2638] p-1">
            <svg viewBox="0 0 300 100" className="w-full h-full">
              {/* Axes and grid */}
              <line x1="30" y1="10" x2="30" y2="85" stroke="#1E2638" strokeWidth="1" />
              <line x1="30" y1="85" x2="290" y2="85" stroke="#1E2638" strokeWidth="1" />
              <line x1="30" y1="45" x2="290" y2="45" stroke="#1E2638" strokeWidth="0.5" strokeDasharray="2 2" />
              <line x1="160" y1="10" x2="160" y2="85" stroke="#1E2638" strokeWidth="0.5" strokeDasharray="2 2" />

              {/* Y Axis Labels */}
              <text x="25" y="15" fill="#475569" fontSize="8" textAnchor="end" fontFamily="JetBrains Mono">100</text>
              <text x="25" y="50" fill="#475569" fontSize="8" textAnchor="end" fontFamily="JetBrains Mono">50</text>
              <text x="25" y="85" fill="#475569" fontSize="8" textAnchor="end" fontFamily="JetBrains Mono">0</text>

              {/* X Axis Labels */}
              <text x="30" y="96" fill="#475569" fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono">0</text>
              <text x="160" y="96" fill="#475569" fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono">50</text>
              <text x="280" y="96" fill="#475569" fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono">100</text>

              {/* Nominal Cluster (Cyan, bottom left) */}
              {[
                [45, 75], [52, 70], [60, 72], [48, 68], [65, 65], [72, 60],
                [55, 62], [80, 58], [90, 62], [85, 70], [70, 74], [95, 65]
              ].map(([cx, cy], i) => (
                <circle key={`c-${i}`} cx={cx} cy={cy} r="2.2" fill="#00F2FE" opacity="0.8" />
              ))}

              {/* Amber Cluster (High Risk, top right) */}
              {[
                [180, 35], [195, 25], [210, 30], [225, 20], [240, 22], [250, 15],
                [215, 38], [230, 28], [260, 25], [270, 18], [200, 42], [235, 34]
              ].map(([cx, cy], i) => (
                <circle key={`a-${i}`} cx={cx} cy={cy} r="2.5" fill="#FFB703" opacity="0.9" />
              ))}

              {/* Selected hotspot pulse point */}
              <circle cx="215" cy="38" r="5" stroke="#00F2FE" strokeWidth="1.5" fill="none" className="animate-ping" />
            </svg>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[#475569] mt-1">
            <span>Fan-In (Callers)</span>
            <span>Complexity & Churn</span>
          </div>
        </div>
      </div>

      {/* Structural Hotspots Table */}
      <div className="bg-[#111622] border border-[#1E2638]">
        <div className="px-4 py-2.5 border-b border-[#1E2638] flex items-center justify-between bg-[#0E131F]">
          <span className="font-headline font-semibold text-[13px] text-[#F1F5F9] uppercase">
            Structural hotspots
          </span>
          <span className="text-[11px] font-mono text-[#94A3B8]">
            Showing 14 algorithmic signals
          </span>
        </div>

        <div className="divide-y divide-[#1E2638] font-mono text-[12px]">
          {HOTSPOTS_DATA.map((hotspot) => {
            const isSelected = selectedHotspot === hotspot.rank;
            return (
              <div
                key={hotspot.rank}
                onClick={() => setSelectedHotspot(hotspot.rank)}
                className={`flex flex-col md:flex-row items-start md:items-center justify-between p-3 gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#182030] border-l-2 border-[#00F2FE]'
                    : 'hover:bg-[#161B28]'
                }`}
              >
                {/* Left: Rank & File Path */}
                <div className="flex items-center gap-3 min-w-[280px]">
                  <span className="text-[#00F2FE] font-bold text-[11px] w-8">
                    {hotspot.rank}
                  </span>
                  <span className="text-[#DEE2F3] font-semibold hover:text-[#00F2FE] transition-colors truncate">
                    {hotspot.path}
                  </span>
                </div>

                {/* Metrics: lines, callers, deps */}
                <div className="flex items-center gap-4 text-[11px] text-[#94A3B8]">
                  <span>{hotspot.lines} lines</span>
                  <span className="flex items-center gap-0.5 text-[#DEE2F3]">
                    <span className="text-[#475569]">↑↓</span>
                    <span>{hotspot.callers} callers</span>
                  </span>
                  <span className="flex items-center gap-0.5 text-[#DEE2F3]">
                    <span className="text-[#475569]">↑</span>
                    <span>{hotspot.deps} deps</span>
                  </span>
                </div>

                {/* Score Chip */}
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#FFB703]/10 border border-[#FFB703]/40 text-[#FFB703] text-[10px] font-semibold">
                    Score: {hotspot.score.toFixed(2)}
                  </span>
                </div>

                {/* Signal Description */}
                <div className="text-[11px] text-[#94A3B8] font-sans-geist flex-1 truncate">
                  {hotspot.signal}
                </div>

                {/* Analyze Impact Action */}
                <div className="shrink-0">
                  <Button
                    variant={isSelected ? 'outline-cyan' : 'secondary'}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnalyzeImpact?.(hotspot.path);
                    }}
                    icon={<Activity className="w-3 h-3" />}
                  >
                    Analyze impact
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
