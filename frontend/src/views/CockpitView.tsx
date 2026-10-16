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
  GitBranch,
  FileCode2,
} from 'lucide-react';
import { useHandoffDataContext } from '../lib/handoffData';
import { NavigationPage } from '../components/layout/AppSidebar';

export interface CockpitViewProps {
  onNavigate: (page: NavigationPage) => void;
}

export const CockpitView: React.FC<CockpitViewProps> = ({ onNavigate }) => {
  const handoffData = useHandoffDataContext();
  const overview = handoffData?.overview;
  const snapshot = overview ? `Snapshot ${overview.snapshot_id}` : 'No ready snapshot';
  const metrics = overview ? [
    ['Files', overview.file_count, 'indexed', 'cyan'],
    ['Lines', overview.total_lines, 'SLOC', 'cyan'],
    ['Symbols', overview.symbol_count, 'parsed', 'violet'],
    ['Dependencies', overview.dependency_count, 'resolved', 'cyan'],
    ['Tests', overview.test_file_count, 'classified', 'green'],
  ] as const : [];
  const git = handoffData?.git;
  const changes = handoffData?.changeStats;
  const languages = Object.entries(overview?.language_counts ?? {}).sort(([, a], [, b]) => b - a).slice(0, 6);
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
          {snapshot}
        </span>
        <span className="px-1.5 py-0.5 bg-[#00F2FE]/15 border border-[#00F2FE]/40 text-[#00F2FE] text-[10px] font-mono uppercase font-semibold">
          {overview ? 'READY' : 'EMPTY'}
        </span>
        <span className="text-[#94A3B8] font-mono">
          - {overview ? 'API snapshot' : 'Connect a repository'}
        </span>
      </div>

      {/* Main Grid: Left metrics, Right Fast Path & Current Changes */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left: 6 Metric Cards (8 cols) */}
        <div className="xl:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Snapshot metrics */}
          {metrics.map(([label, value, detail, tone]) => <div key={label} className="p-3 bg-[#111622] border border-[#1E2638] flex flex-col justify-between h-[110px]">
            <div className="flex items-center justify-between text-[#94A3B8] text-[11px] font-mono uppercase"><span>{label}</span><span className={`h-1.5 w-8 bg-[#${tone === 'violet' ? '9D4EDD' : tone === 'green' ? '06D6A0' : '00F2FE'}]`} /></div>
            <div><div className="font-headline font-bold text-2xl text-[#F1F5F9] tabular-nums">{value.toLocaleString()}</div><div className="text-[11px] font-mono text-[#94A3B8]">{detail}</div></div>
            <div className="h-px bg-[#2D3A54]" />
          </div>)}
          <div className="p-3 bg-[#111622] border border-[#1E2638] flex flex-col justify-between h-[110px]">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#06D6A0]"><CheckCircle2 className="w-3.5 h-3.5" /><span className="font-semibold">{git ? (git.clean ? 'Clean working tree' : 'Working tree changed') : 'Git state unavailable'}</span></div>
            <div className="font-headline font-bold text-xl text-[#F1F5F9]">{git?.branch ?? '—'}</div>
            <div className="text-[10px] font-mono text-[#475569] truncate">{git ? `${git.staged_count} staged · ${git.unstaged_count} modified · ${git.untracked_count} untracked` : 'No Git status returned'}</div>
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
                {changes ? `${changes.files} changed files · +${changes.additions}/-${changes.deletions}` : 'Change data unavailable'}
              </div>
            </div>
            {/* Concentric telemetry rings and mini graph */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center border border-[#2D3A54] text-center"><span className="font-mono text-[10px] text-[#00F2FE]">{overview?.warning_count ?? '—'}<small className="block text-[#94A3B8]">warnings</small></span></div>
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
          {/* Dependency Graph */}
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

          <div className="mt-4 h-24 bg-[#0B0E14] border border-[#1E2638] p-3 font-mono text-[10px] text-[#94A3B8]">{handoffData?.graph.nodes.length ?? 0} nodes · {handoffData?.graph.edges.length ?? 0} edges<br /><span className="text-[#00F2FE]">real snapshot topology</span></div>
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

          <div className="mt-4 h-24 bg-[#0B0E14] border border-[#1E2638] p-3 font-mono text-[10px] text-[#94A3B8]">{handoffData?.hotspots.length ?? 0} ranked signals<br /><span className="text-[#FFB703]">heuristic structural risk</span></div>
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

          <div className="mt-4 h-24 bg-[#0B0E14] border border-[#1E2638] p-3 font-mono text-[10px] text-[#94A3B8]">{handoffData?.tests.length ?? 0} linked relationships<br /><span className="text-[#06D6A0]">static evidence only</span></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-[#111622] border border-[#1E2638]"><div className="flex items-center gap-2 text-[11px] font-mono text-[#94A3B8] uppercase"><FileCode2 className="w-3.5 h-3.5 text-[#00F2FE]" />Language distribution</div>{languages.length ? <div className="mt-3 space-y-2">{languages.map(([language, count]) => <div key={language} className="flex items-center gap-3 text-[11px] font-mono"><span className="w-24 truncate text-[#DEE2F3]">{language}</span><div className="h-1 flex-1 bg-[#1E2638]"><div className="h-full bg-[#00F2FE]" style={{ width: `${Math.max(4, (count / languages[0][1]) * 100)}%` }} /></div><span className="w-10 text-right text-[#94A3B8]">{count}</span></div>)}</div> : <div className="mt-3 text-[11px] text-[#94A3B8]">Language data unavailable.</div>}</div>
        <div className="p-4 bg-[#111622] border border-[#1E2638]"><div className="flex items-center gap-2 text-[11px] font-mono text-[#94A3B8] uppercase"><GitBranch className="w-3.5 h-3.5 text-[#00F2FE]" />Snapshot notes</div><div className="mt-3 space-y-2 text-[11px] text-[#94A3B8]">{overview ? <><div>Warnings: <span className="text-[#FFB703]">{overview.warning_count}</span></div><div>Hotspots: <span className="text-[#FFB703]">{overview.hotspot_count}</span></div><div>Tests are static relationships; runtime coverage is not reported.</div></> : <div>Connect a repository to load snapshot telemetry.</div>}</div></div>
      </div>
    </div>
  );
};
