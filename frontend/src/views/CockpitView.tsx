import React from 'react';
import {
  CheckCircle2,
  Search,
  Activity,
  History,
  ArrowRight,
  Share2,
  AlertTriangle,
  FlaskConical,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useHandoffDataContext } from '../lib/handoffData';
import { NavigationPage } from '../components/layout/AppSidebar';

export interface CockpitViewProps {
  onNavigate: (page: NavigationPage) => void;
}

export const CockpitView: React.FC<CockpitViewProps> = ({ onNavigate }) => {
  const handoffData = useHandoffDataContext();
  const overview = handoffData?.overview;
  const REPO_SUMMARY = { snapshot: overview ? `Snapshot ${overview.snapshot_id}` : 'No snapshot', snapshotStatus: overview ? 'READY' : 'EMPTY', snapshotDetail: overview ? 'API snapshot' : 'Connect a repository', metrics: { filesIndexed: overview?.file_count ?? 0, linesSLOC: overview?.total_lines ?? 0, symbolsParsed: overview?.symbol_count ?? 0, dependenciesResolved: overview?.dependency_count ?? 0, testsClassified: overview?.test_file_count ?? 0 } };
  return (
    <div className="p-6 space-y-5 max-w-[1500px] mx-auto select-none overflow-y-auto">
      {/* View Header */}
      <div>
        <h1 className="font-headline font-bold text-2xl tracking-tight text-[#F1F5F9] uppercase">
          Repository Cockpit
        </h1>
        <p className="font-mono text-xs text-[#94A3B8] mt-0.5">
          // See the system before you change it
        </p>
      </div>

      {/* Snapshot Ready Banner */}
      <div className="flex items-center gap-2.5 px-3 py-2 bg-[#111622] border border-[#1E2638] text-xs">
        <CheckCircle2 className="w-4 h-4 text-[#00F2FE]" />
        <span className="font-headline font-semibold text-[#DEE2F3]">
          {REPO_SUMMARY.snapshot}
        </span>
        <span className="px-1.5 py-0.5 bg-[#00F2FE]/15 border border-[#00F2FE]/40 text-[#00F2FE] text-[10px] font-mono uppercase font-semibold">
          {REPO_SUMMARY.snapshotStatus}
        </span>
        <span className="text-[#94A3B8] font-mono">
          - {REPO_SUMMARY.snapshotDetail}
        </span>
      </div>

      {/* Main Grid: Left metrics, Right Fast Path & Current Changes */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left: 6 Metric Cards (8 cols) */}
        <div className="xl:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Files */}
          <div className="p-3 bg-[#111622] border border-[#1E2638] flex flex-col justify-between h-[110px]">
            <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-mono uppercase">
              <span>Files</span>
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 h-1.5 bg-[#1E2638]" />
                <span className="w-1 h-2 bg-[#2D3A54]" />
                <span className="w-1 h-3 bg-[#00F2FE]/60" />
                <span className="w-1 h-2 bg-[#2D3A54]" />
              </div>
            </div>
            <div>
              <div className="font-headline font-bold text-2xl text-[#F1F5F9] tabular-nums">
                {REPO_SUMMARY.metrics.filesIndexed}
              </div>
              <div className="text-[11px] font-mono text-[#94A3B8]">indexed</div>
            </div>
            {/* Sparkline mini bars */}
            <div className="flex items-end gap-1 h-5 pt-1">
              {[40, 60, 30, 80, 50, 90, 70, 85].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#1E2638] hover:bg-[#00F2FE]/50 transition-colors"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Lines */}
          <div className="p-3 bg-[#111622] border border-[#1E2638] flex flex-col justify-between h-[110px]">
            <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-mono uppercase">
              <span>Lines</span>
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 h-2 bg-[#2D3A54]" />
                <span className="w-1 h-3 bg-[#00F2FE]/60" />
              </div>
            </div>
            <div>
              <div className="font-headline font-bold text-2xl text-[#F1F5F9] tabular-nums">
                {REPO_SUMMARY.metrics.linesSLOC.toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-[#94A3B8]">SLOC</div>
            </div>
            <div className="flex items-end gap-1 h-5 pt-1">
              {[30, 45, 60, 55, 70, 85, 95, 90].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#1E2638] hover:bg-[#00F2FE]/50 transition-colors"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Symbols */}
          <div className="p-3 bg-[#111622] border border-[#1E2638] flex flex-col justify-between h-[110px]">
            <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-mono uppercase">
              <span>Symbols</span>
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 h-1 bg-[#1E2638]" />
                <span className="w-1 h-2.5 bg-[#9D4EDD]" />
              </div>
            </div>
            <div>
              <div className="font-headline font-bold text-2xl text-[#F1F5F9] tabular-nums">
                {REPO_SUMMARY.metrics.symbolsParsed}
              </div>
              <div className="text-[11px] font-mono text-[#94A3B8]">parsed</div>
            </div>
            <div className="flex items-end gap-1 h-5 pt-1">
              {[20, 30, 50, 40, 60, 75, 50, 80].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#1E2638] hover:bg-[#9D4EDD]/60 transition-colors"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Dependencies */}
          <div className="p-3 bg-[#111622] border border-[#1E2638] flex flex-col justify-between h-[110px]">
            <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-mono uppercase">
              <span>Dependencies</span>
              <span className="text-[10px] text-[#00F2FE]">14 resolved</span>
            </div>
            <div>
              <div className="font-headline font-bold text-2xl text-[#F1F5F9] tabular-nums">
                {REPO_SUMMARY.metrics.dependenciesResolved}
              </div>
              <div className="text-[11px] font-mono text-[#94A3B8]">resolved</div>
            </div>
            <div className="flex items-end gap-1 h-5 pt-1">
              {[20, 40, 35, 60, 80, 100, 70, 50].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 transition-colors ${i === 4 ? 'bg-[#00F2FE]' : 'bg-[#1E2638]'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Tests */}
          <div className="p-3 bg-[#111622] border border-[#1E2638] flex flex-col justify-between h-[110px]">
            <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-mono uppercase">
              <span>Tests</span>
              <span className="text-[10px] text-[#06D6A0]">100% PASS</span>
            </div>
            <div>
              <div className="font-headline font-bold text-2xl text-[#F1F5F9] tabular-nums">
                {REPO_SUMMARY.metrics.testsClassified}
              </div>
              <div className="text-[11px] font-mono text-[#94A3B8]">classified</div>
            </div>
            {/* Staircase test representation */}
            <div className="flex items-end gap-1 h-5 pt-1">
              {[20, 35, 50, 65, 80, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#1E2638] hover:bg-[#06D6A0]/60 transition-colors"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Clean working tree / Git diagram */}
          <div className="p-3 bg-[#111622] border border-[#1E2638] flex flex-col justify-between h-[110px]">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#06D6A0]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-semibold">Clean working tree</span>
            </div>
            {/* Git Branch Graphic representation */}
            <div className="py-2">
              <svg viewBox="0 0 160 30" className="w-full h-8 overflow-visible">
                {/* Main line */}
                <path d="M 10 20 H 150" stroke="#2D3A54" strokeWidth="2" />
                {/* Branch out line */}
                <path d="M 40 20 C 55 20, 55 6, 75 6 H 120" stroke="#00F2FE" strokeWidth="2" fill="none" />
                {/* Commit nodes */}
                <circle cx="20" cy="20" r="3" fill="#2D3A54" />
                <circle cx="50" cy="20" r="3" fill="#06D6A0" />
                <circle cx="80" cy="6" r="3" fill="#9D4EDD" />
                <circle cx="110" cy="6" r="3" fill="#00F2FE" />
                <circle cx="140" cy="20" r="3" fill="#2D3A54" />
              </svg>
            </div>
            <div className="text-[10px] font-mono text-[#475569] truncate">
              upstream synced with origin/main
            </div>
          </div>
        </div>

        {/* Right: Current Changes & Fast Path (4 cols) */}
        <div className="xl:col-span-4 space-y-3">
          {/* Current Changes Telemetry */}
          <div className="p-3 bg-[#111622] border border-[#1E2638] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#94A3B8] uppercase font-semibold">
                Current Changes
              </div>
              <div className="text-[12px] font-headline font-semibold text-[#F1F5F9] mt-0.5">
                Blast radius telemetry
              </div>
              <div className="text-[11px] font-mono text-[#06D6A0] mt-1">
                Zero untracked hazards
              </div>
            </div>
            {/* Concentric telemetry rings and mini graph */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 60 60" className="w-full h-full">
                <circle cx="30" cy="30" r="24" stroke="#1E2638" strokeWidth="2" fill="none" />
                <circle
                  cx="30"
                  cy="30"
                  r="24"
                  stroke="#00F2FE"
                  strokeWidth="2"
                  strokeDasharray="40 100"
                  fill="none"
                />
                <circle cx="30" cy="30" r="17" stroke="#1E2638" strokeWidth="2" fill="none" />
                <circle
                  cx="30"
                  cy="30"
                  r="17"
                  stroke="#9D4EDD"
                  strokeWidth="2"
                  strokeDasharray="30 80"
                  fill="none"
                />
                <circle cx="30" cy="30" r="10" stroke="#1E2638" strokeWidth="2" fill="none" />
                <circle cx="30" cy="30" r="3" fill="#00F2FE" />
              </svg>
            </div>
          </div>

          {/* Fast Path Navigation Links */}
          <div className="p-3 bg-[#111622] border border-[#1E2638]">
            <div className="text-[10px] font-mono text-[#94A3B8] uppercase font-semibold mb-2">
              Fast Path
            </div>
            <div className="space-y-1">
              <button
                onClick={() => onNavigate('search')}
                className="w-full flex items-center justify-between py-1 px-1.5 hover:bg-[#182030] text-[12px] font-sans-geist text-[#DEE2F3] hover:text-[#00F2FE] transition-colors border-0 cursor-pointer bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>Search code</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#475569]" />
              </button>

              <button
                onClick={() => onNavigate('impact-analysis')}
                className="w-full flex items-center justify-between py-1 px-1.5 hover:bg-[#182030] text-[12px] font-sans-geist text-[#DEE2F3] hover:text-[#00F2FE] transition-colors border-0 cursor-pointer bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>Analyze impact</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#475569]" />
              </button>

              <button
                onClick={() => onNavigate('history')}
                className="w-full flex items-center justify-between py-1 px-1.5 hover:bg-[#182030] text-[12px] font-sans-geist text-[#DEE2F3] hover:text-[#00F2FE] transition-colors border-0 cursor-pointer bg-transparent"
              >
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>Review history</span>
                </div>
                <ArrowRight className="w-3 h-3 text-[#475569]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 3 Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dependency Graph preview card */}
        <div
          onClick={() => onNavigate('dependency-graph')}
          className="p-4 bg-[#111622] border border-[#1E2638] hover:border-[#00F2FE]/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-semibold text-[13px] text-[#F1F5F9] group-hover:text-[#00F2FE] transition-colors">
              Dependency graph
            </h3>
            <Share2 className="w-3.5 h-3.5 text-[#475569] group-hover:text-[#00F2FE]" />
          </div>
          <p className="text-[11px] font-mono text-[#94A3B8] mt-0.5">
            Trace module relationships and structure
          </p>

          {/* Wireframe topological terrain preview */}
          <div className="mt-4 h-24 bg-[#0B0E14] border border-[#1E2638] overflow-hidden relative flex items-center justify-center">
            <svg viewBox="0 0 240 80" className="w-full h-full stroke-[#00F2FE]/40 fill-none">
              <path d="M 0 60 Q 40 20, 80 50 T 160 30 T 240 60" strokeWidth="1.5" />
              <path d="M 0 50 Q 50 10, 100 40 T 180 20 T 240 50" strokeWidth="1" strokeDasharray="3 3" />
              <path d="M 0 70 Q 30 40, 70 65 T 150 45 T 240 70" strokeWidth="1" stroke="#9D4EDD/40" />
              <line x1="40" y1="20" x2="40" y2="80" stroke="#1E2638" />
              <line x1="120" y1="20" x2="120" y2="80" stroke="#1E2638" />
              <line x1="200" y1="20" x2="200" y2="80" stroke="#1E2638" />
            </svg>
          </div>
        </div>

        {/* Hotspots preview card */}
        <div
          onClick={() => onNavigate('hotspots')}
          className="p-4 bg-[#111622] border border-[#1E2638] hover:border-[#FFB703]/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-semibold text-[13px] text-[#F1F5F9] group-hover:text-[#FFB703] transition-colors">
              Hotspots
            </h3>
            <AlertTriangle className="w-3.5 h-3.5 text-[#475569] group-hover:text-[#FFB703]" />
          </div>
          <p className="text-[11px] font-mono text-[#94A3B8] mt-0.5">
            Find structural concentration and risk
          </p>

          {/* Heatmap blob clusters preview */}
          <div className="mt-4 h-24 bg-[#0B0E14] border border-[#1E2638] overflow-hidden relative flex items-center justify-center">
            <div className="absolute w-16 h-16 rounded-full bg-[#9D4EDD]/20 blur-md" />
            <div className="absolute w-10 h-10 rounded-full bg-[#00F2FE]/30 blur-sm translate-x-4" />
            <div className="absolute w-6 h-6 rounded-full bg-[#00F2FE] -translate-x-3 translate-y-1" />
            <div className="absolute w-4 h-4 rounded-full bg-[#FFB703] translate-x-6 -translate-y-2" />
            <svg viewBox="0 0 100 50" className="w-full h-full stroke-[#2D3A54] stroke-dasharray-[2_2]">
              <line x1="30" y1="25" x2="70" y2="20" />
            </svg>
          </div>
        </div>

        {/* Test surface preview card */}
        <div
          onClick={() => onNavigate('tests')}
          className="p-4 bg-[#111622] border border-[#1E2638] hover:border-[#06D6A0]/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-semibold text-[13px] text-[#F1F5F9] group-hover:text-[#06D6A0] transition-colors">
              Test surface
            </h3>
            <FlaskConical className="w-3.5 h-3.5 text-[#475569] group-hover:text-[#06D6A0]" />
          </div>
          <p className="text-[11px] font-mono text-[#94A3B8] mt-0.5">
            Review coverage relationships
          </p>

          {/* Test matrix grid preview */}
          <div className="mt-4 h-24 bg-[#0B0E14] border border-[#1E2638] p-2 flex items-center justify-between gap-3">
            {/* Matrix grid cells */}
            <div className="grid grid-cols-5 gap-1 flex-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 border border-[#1E2638] ${
                    i === 0
                      ? 'bg-[#00F2FE]'
                      : i < 5
                      ? 'bg-[#00F2FE]/40'
                      : i % 3 === 0
                      ? 'bg-[#182030]'
                      : 'bg-[#111622]'
                  }`}
                />
              ))}
            </div>
            {/* Scatter points */}
            <div className="w-16 h-16 border-l border-b border-[#2D3A54] relative">
              <span className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-[#00F2FE] rounded-full" />
              <span className="absolute bottom-4 left-4 w-1 h-1 bg-[#00F2FE]/70 rounded-full" />
              <span className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-[#00F2FE] rounded-full" />
              <span className="absolute bottom-8 left-10 w-1 h-1 bg-[#9D4EDD] rounded-full" />
              <span className="absolute bottom-10 left-12 w-1.5 h-1.5 bg-[#00F2FE] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
