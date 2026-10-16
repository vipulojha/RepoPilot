import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckSquare,
  FileCode,
  Search,
  Sliders,
  RotateCcw,
  GitCommit,
  Sparkles,
  ChevronRight,
  FolderTree,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useHandoffDataContext } from '../lib/handoffData';

export const ChangeIntelligenceView: React.FC<{ onSelectFile?: (fileId: number) => void }> = ({ onSelectFile }) => {
  const data = useHandoffDataContext();
  const changes = data?.changedFiles ?? [];
  const affectedFiles = data?.affectedFiles ?? [];
  const risk = data?.changeRisk;
  const stats = data?.changeStats;
  const [isSplitView, setIsSplitView] = useState(true);
  const [selectedFile, setSelectedFile] = useState(changes[0]?.path ?? '');
  const selectedAnalysis = useMemo(() => data?.changedFiles.find(file => file.path === selectedFile), [data, selectedFile]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0E14] select-none overflow-hidden font-mono text-[#DEE2F3]">
      {/* 3-Pane Workstation Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: Changed files (Left) */}
        <div className="w-[280px] border-r border-[#1E2638] bg-[#0E131F] flex flex-col shrink-0">
          <div className="p-3 border-b border-[#1E2638]">
            <div className="font-headline font-semibold text-[13px] text-[#F1F5F9] mb-2">
              Changed files
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#94A3B8] uppercase mb-2">
              <span>CHANGED FILES ({changes.length})</span>
              <span>L1</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#475569] absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search/Filter"
                className="w-full h-[26px] pl-8 pr-2 bg-[#0B0E14] border border-[#1E2638] text-[11px] text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#00F2FE]"
              />
            </div>
          </div>

          <div className="p-2 space-y-1 overflow-y-auto">
            {changes.map((f, i) => {
              const isSelected = selectedFile === f.path;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedFile(f.path)}
                  className={`p-2 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#182030] border-[#00F2FE]'
                      : 'bg-[#111622] border-[#1E2638] hover:border-[#2D3A54]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="accent-[#00F2FE] cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-[#DEE2F3] truncate">
                      {f.path}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pl-5 text-[10px]">
                    <div className="flex items-center gap-1.5">
                       <span className="text-[#FFB703] font-bold">{f.status.slice(0, 1).toUpperCase()}</span>
                      <span
                        className={`px-1 py-0.2 uppercase font-semibold ${
                           data?.hotspots.some(h => h.file_id === f.file_id && h.score >= 67)
                            ? 'bg-[#EF476F]/20 text-[#EF476F]'
                            : 'bg-[#06D6A0]/20 text-[#06D6A0]'
                        }`}
                      >
                        {data?.hotspots.some(h => h.file_id === f.file_id && h.score >= 67) ? 'High Risk' : 'Tracked'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                       <span className="text-[#06D6A0]">+{f.additions}</span>
                       <span className="text-[#EF476F]">/-{f.deletions}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pane 2: Side-by-side Diff Viewer (Center) */}
        <div className="flex-1 flex flex-col bg-[#0B0E14] overflow-hidden">
          {/* Diff Header */}
          <div className="h-[44px] px-4 border-b border-[#1E2638] bg-[#0E131F] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[#94A3B8]">{'{ }'}</span>
              <span className="font-semibold text-[12px] text-[#F1F5F9]">
                {selectedFile}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
              <span>Split View</span>
              <button
                onClick={() => setIsSplitView(!isSplitView)}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer border-0 ${
                  isSplitView ? 'bg-[#00F2FE]' : 'bg-[#1E2638]'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-[#0B0E14] transition-transform ${
                    isSplitView ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Diff Code Columns */}
          <div className="flex-1 overflow-auto flex text-[11px] font-mono">
            {/* Left side (Original / Deletions) */}
            <div className="flex-1 border-r border-[#1E2638] bg-[#0B0E14] overflow-x-auto">
              <div className="py-2">
                {(selectedAnalysis?.diff_lines ?? []).filter(line => line.type !== 'add').map((line, idx) => {
                  const isDel = line.type === 'del';
                  return (
                    <div
                      key={idx}
                      className={`flex items-center px-2 py-0.5 leading-5 ${
                        isDel ? 'bg-[#EF476F]/15 text-[#EF476F]' : 'text-[#94A3B8]'
                      }`}
                    >
                      <span className="w-8 shrink-0 text-[#475569] select-none text-right pr-2">
                        {line.old_num ?? ''}
                      </span>
                      <span className="font-mono whitespace-pre">{line.code}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side (Modified / Additions) */}
            <div className="flex-1 bg-[#0B0E14] overflow-x-auto">
              <div className="py-2">
                {(selectedAnalysis?.diff_lines ?? []).filter(line => line.type !== 'del').map((line, idx) => {
                  const isAdd = line.type === 'add';
                  return (
                    <div
                      key={idx}
                      className={`flex items-center px-2 py-0.5 leading-5 ${
                        isAdd ? 'bg-[#06D6A0]/15 text-[#06D6A0]' : 'text-[#DEE2F3]'
                      }`}
                    >
                      <span className="w-8 shrink-0 text-[#475569] select-none text-right pr-2">
                        {line.new_num ?? ''}
                      </span>
                      <span className="font-mono whitespace-pre">{line.code}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Pane 3: Change Intelligence & Risk Auditor (Right) */}
        <div className="w-[340px] border-l border-[#1E2638] bg-[#0E131F] flex flex-col justify-between shrink-0 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="font-headline font-bold text-[13px] text-[#F1F5F9] pb-2 border-b border-[#1E2638]">
              Change Intelligence & Risk Auditor
            </div>

            {/* High Risk Alert Banner */}
            <div className={`mt-3 p-3 border text-[11px] ${risk?.level === 'high' ? 'bg-[#EF476F]/10 border-[#EF476F]/40 text-[#EF476F]' : 'bg-[#FFB703]/10 border-[#FFB703]/40 text-[#FFB703]'}`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{risk ? `${risk.level} risk` : 'Risk unavailable'}</div>
                  <div className="text-[10px] text-[#DEE2F3] mt-1 font-sans-geist">
                    {risk?.reasons?.length ? risk.reasons.join(' · ') : 'The change API returned no risk explanation for this snapshot.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Metric Blocks */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
              <div className="p-2.5 bg-[#111622] border border-[#1E2638]">
                <div className="text-[#94A3B8] text-[10px]">Total Blast Scope</div>
                <div className="font-headline font-bold text-lg text-[#F1F5F9] mt-0.5">
                  {stats?.files ?? changes.length} files · +{stats?.additions ?? 0}/-{stats?.deletions ?? 0}
                </div>
              </div>

              <div className="p-2.5 bg-[#111622] border border-[#1E2638]">
                <div className="text-[#94A3B8] text-[10px]">Affected Symbols</div>
                <div className="font-mono font-semibold text-[11px] text-[#00F2FE] truncate mt-1">
                  {affectedFiles.length ? `${affectedFiles.length} affected files` : '—'}
                </div>
              </div>
            </div>

            {/* Mapped Test Suites */}
            <div className="p-2.5 bg-[#111622] border border-[#1E2638] mt-2">
              <div className="text-[#94A3B8] text-[10px] mb-1">Mapped Test Suites</div>
              <div className="font-headline font-bold text-base text-[#00F2FE]">
                {data?.tests.length ?? 0} test suites
              </div>
              <div className="text-[10px] text-[#94A3B8] space-y-0.5 mt-1">
                {data?.tests.slice(0, 2).map(test => <div key={`${test.test_file_id}-${test.source_file_id}`}>{test.test_path} ↗</div>)}
                {!data?.tests.length && <div>No test relationships returned.</div>}
              </div>
            </div>

            {/* Downstream Impact Tree */}
            <div className="mt-4">
              <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-2">
                Downstream Impact
              </div>
              <div className="p-2.5 bg-[#111622] border border-[#1E2638] text-[10px] space-y-1">
                <div className="text-[#00F2FE] font-bold">
                  □ {selectedAnalysis?.path ?? 'No changed file selected'}
                </div>
                <div className="pl-4 text-[#94A3B8] space-y-0.5 border-l border-[#1E2638] ml-2">
                   {affectedFiles.length ? affectedFiles.slice(0, 6).map(file => <button type="button" className="block text-left hover:text-[#00F2FE]" key={`${file.file_id}-${file.depth}`} onClick={() => onSelectFile?.(file.file_id)}>↳ {file.path} · depth {file.depth}</button>) : <div>↳ No affected files returned</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-[#1E2638]">
            <Button variant="primary" className="w-full">
              Analyze Changes
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" icon={<RotateCcw className="w-3 h-3" />}>
                Revert
              </Button>
              <Button variant="secondary" icon={<GitCommit className="w-3 h-3" />}>
                Commit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
