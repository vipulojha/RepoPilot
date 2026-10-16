import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Play,
  RefreshCw,
  Settings,
  ChevronDown,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AST_SIGNAL_PIPELINE } from '../data/mockData';

export const ImpactAnalysisView: React.FC = () => {
  const [isTracingActive, setIsTracingActive] = useState<boolean>(true);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full w-full bg-[#080B10] select-none overflow-hidden relative font-mono text-[#DEE2F3]">
      {/* Top Header Bar */}
      <div className="h-[52px] px-6 border-b border-[#1E2638] bg-[#0E131F] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="font-headline font-bold text-[14px] text-[#00F2FE] tracking-wider">
            REPOPILOT // AST SIGNAL MAP
          </span>
          <span className="text-[#475569]">|</span>
          <span className="text-[12px] text-[#DEE2F3] font-sans-geist">
            Impact Analysis & Propagation Pipeline
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Blast Radius High Warning Banner */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFB703]/10 border border-[#FFB703]/50 text-[#FFB703] text-[11px] font-semibold tracking-wider uppercase">
            <span>BLAST RADIUS: HIGH</span>
          </div>

          <button
            onClick={() => setIsTracingActive(!isTracingActive)}
            className={`flex items-center gap-1.5 h-[28px] px-2.5 text-[11px] font-semibold border transition-all cursor-pointer ${
              isTracingActive
                ? 'bg-[#00F2FE]/20 border-[#00F2FE] text-[#00F2FE] shadow-[0_0_10px_rgba(0,242,254,0.3)]'
                : 'bg-[#182030] border-[#1E2638] text-[#94A3B8]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isTracingActive ? 'Propagation Active' : 'Enable Tracer'}</span>
          </button>

          <Button
            variant="outline-cyan"
            size="sm"
            onClick={() => setIsTracingActive(true)}
            icon={<Play className="w-3 h-3" />}
          >
            Run analysis
          </Button>

          <Button variant="ghost" size="sm" icon={<RefreshCw className="w-3 h-3" />}>
            Refresh
          </Button>
          <Button variant="ghost" size="sm" icon={<Settings className="w-3 h-3" />}>
            Settings
          </Button>
        </div>
      </div>

      {/* Pipeline Stage Column Labels */}
      <div className="px-8 pt-4 pb-1">
        <h2 className="font-headline font-semibold text-lg text-[#F1F5F9]">
          What could this change affect?{' '}
          <span className="text-[#94A3B8] font-normal text-sm">
            Trace reverse dependencies with evidence
          </span>
        </h2>
      </div>

      {/* 4-Stage Horizontal Pipeline Canvas */}
      <div className="flex-1 overflow-auto p-6 relative bg-circuit-grid">
        {/* SVG Wiring Background layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1400 600"
          preserveAspectRatio="none"
        >
          {/* Stage 1 to Stage 2 Lines */}
          <path
            d="M 280 200 H 340 V 130 H 400 M 340 200 H 400 M 340 200 V 290 H 400"
            fill="none"
            stroke={isTracingActive ? '#00F2FE' : '#1E2638'}
            strokeWidth={isTracingActive ? '3' : '1.5'}
            style={isTracingActive ? { filter: 'drop-shadow(0 0 8px #00F2FE)' } : undefined}
          />

          {/* Stage 2 to Stage 3 Lines */}
          <path
            d="M 640 130 H 700 V 160 H 740 M 640 200 H 700 V 250 H 740 M 640 290 H 700 V 340 H 740"
            fill="none"
            stroke="#9D4EDD"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Stage 3 to Stage 4 Lines */}
          {/* To Passing test (Green) */}
          <path
            d="M 980 160 H 1040 V 130 H 1080"
            fill="none"
            stroke="#06D6A0"
            strokeWidth="2"
          />
          {/* To Untested Risk (Amber) with pulsing trace */}
          <path
            d="M 980 250 H 1040 V 250 H 1080"
            fill="none"
            stroke={isTracingActive ? '#FFB703' : '#1E2638'}
            strokeWidth={isTracingActive ? '3' : '1.5'}
            strokeDasharray={isTracingActive ? '6 3' : '3 3'}
            style={isTracingActive ? { filter: 'drop-shadow(0 0 8px #FFB703)' } : undefined}
          />
          {/* To Uncovered Hotspot (Crimson) */}
          <path
            d="M 980 340 H 1040 V 340 H 1080"
            fill="none"
            stroke="#EF476F"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        </svg>

        {/* The 4 Stage Columns Container */}
        <div className="grid grid-cols-4 gap-8 min-w-[1100px] h-full relative z-10">
          {/* Stage 01 : TARGET SYMBOL */}
          <div className="flex flex-col">
            <div className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider mb-3">
              STAGE 01 : TARGET SYMBOL
            </div>

            <div className="mt-20">
              <div
                className={`p-4 bg-[#111622] border transition-all ${
                  isTracingActive
                    ? 'border-[#00F2FE] shadow-[0_0_20px_rgba(0,242,254,0.4)]'
                    : 'border-[#1E2638]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-1.5 py-0.5 bg-[#00F2FE]/20 text-[#00F2FE] text-[9px] font-mono uppercase font-bold">
                    MUTATION SOURCE
                  </span>
                </div>
                <div className="font-mono text-[14px] font-bold text-[#F1F5F9]">
                  {AST_SIGNAL_PIPELINE.target.file}
                </div>
                <div className="font-mono text-[12px] text-[#00F2FE] mt-1">
                  fn: {AST_SIGNAL_PIPELINE.target.symbol}
                </div>
                <div className="mt-3 pt-2 border-t border-[#1E2638] flex items-center justify-between text-[10px] text-[#94A3B8]">
                  <span>Fan-In: {AST_SIGNAL_PIPELINE.target.fanIn}</span>
                  <span className="text-[#00F2FE]">1° Ingress Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stage 02 : DIRECT CONSUMERS (1°) */}
          <div className="flex flex-col">
            <div className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider mb-3">
              STAGE 02 : DIRECT CONSUMERS (1°)
            </div>

            <div className="space-y-4">
              {AST_SIGNAL_PIPELINE.directConsumers.map((consumer, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#111622] border border-[#1E2638] hover:border-[#00F2FE]/60 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[12px] font-semibold text-[#F1F5F9]">
                      {consumer.file}
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#00F2FE]/15 text-[#00F2FE] text-[9px] uppercase font-bold">
                      {consumer.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8]">
                    {consumer.inboundCalls} Inbound Call{consumer.inboundCalls > 1 ? 's' : ''} • Line {consumer.line}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage 03 : TRANSITIVE EGRESS (2°) */}
          <div className="flex flex-col">
            <div className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider mb-3">
              STAGE 03 : TRANSITIVE EGRESS (2°)
            </div>

            <div className="space-y-4">
              {AST_SIGNAL_PIPELINE.transitiveEgress.map((egress, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#111622] border border-[#1E2638] hover:border-[#9D4EDD]/60 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[12px] font-semibold text-[#F1F5F9]">
                      {egress.file}
                    </span>
                    <span className="px-1.5 py-0.2 bg-[#9D4EDD]/15 text-[#9D4EDD] text-[9px] uppercase font-bold">
                      {egress.tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8]">
                    {egress.callers}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage 04 : TEST VALIDATION */}
          <div className="flex flex-col">
            <div className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider mb-3">
              STAGE 04 : TEST VALIDATION
            </div>

            <div className="space-y-4">
              {/* Passing test */}
              <div className="p-3 bg-[#111622] border border-[#06D6A0]/50 hover:border-[#06D6A0] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[12px] font-semibold text-[#F1F5F9]">
                    tokenValidator.test.ts
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#06D6A0]" />
                </div>
                <div className="text-[11px] text-[#06D6A0]">
                  12 Test Cases • Statically Linked
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1">
                  Status: PASSING (Deterministic)
                </div>
              </div>

              {/* Untested Hazard (Amber) */}
              <div
                className={`p-3 bg-[#111622] border transition-all ${
                  isTracingActive
                    ? 'border-[#FFB703] shadow-[0_0_20px_rgba(255,183,3,0.4)] ring-2 ring-[#FFB703]/20'
                    : 'border-[#FFB703]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[12px] font-semibold text-[#F1F5F9]">
                    userController.test.ts
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-[#FFB703]" />
                </div>
                <div className="text-[11px] text-[#FFB703] flex items-center gap-1">
                  <span>⚠</span>
                  <span>Test Safety Net Missing</span>
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1">
                  Indirect caller untested
                </div>
              </div>

              {/* Uncovered Hotspot (Crimson) */}
              <div className="p-3 bg-[#111622] border border-[#EF476F]/50 hover:border-[#EF476F] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[12px] font-semibold text-[#F1F5F9]">
                    proxyRoute.ts
                  </span>
                  <ShieldAlert className="w-3.5 h-3.5 text-[#EF476F]" />
                </div>
                <div className="text-[11px] text-[#EF476F]">
                  🚨 UNCOVERED HOTSPOT
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1">
                  Fan-in: 34 • 0 tests mapped
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Blast Radius Scope Status Bar */}
      <div className="h-[48px] px-6 border-t border-[#1E2638] bg-[#0E131F] flex items-center justify-between shrink-0 select-none text-[11px] font-mono z-20">
        <div className="flex items-center gap-4 text-[#94A3B8]">
          <div>
            Total Blast Scope:{' '}
            <span className="text-[#00F2FE] font-bold">14 Files</span>
          </div>
          <span className="text-[#475569]">|</span>
          <div>
            Direct: <span className="text-[#DEE2F3]">3</span>
          </div>
          <span className="text-[#475569]">|</span>
          <div>
            Transitive: <span className="text-[#DEE2F3]">8</span>
          </div>
          <span className="text-[#475569]">|</span>
          <div>
            Test Suites Mapped: <span className="text-[#06D6A0]">2</span>
          </div>
          <span className="text-[#475569]">|</span>
          <div>
            Uncovered Hotspots:{' '}
            <span className="text-[#EF476F] font-bold">1 File</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-[#06D6A0]">
            <span>Engine: v2.4.1 (Ready)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#06D6A0]" />
          </div>

          <Button variant="primary" size="sm">
            Run Test Suite
          </Button>
        </div>
      </div>
    </div>
  );
};
