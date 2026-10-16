import React, { useState } from 'react';
import {
  GitCommit,
  GitBranch,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { HISTORY_COMMITS, CommitItem } from '../data/mockData';

export const HistoryView: React.FC = () => {
  const [selectedCommit, setSelectedCommit] = useState<CommitItem>(HISTORY_COMMITS[2]);

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0E14] select-none overflow-hidden font-mono text-[#DEE2F3]">
      {/* Header */}
      <div className="h-[52px] px-6 border-b border-[#1E2638] bg-[#0E131F] flex items-center justify-between shrink-0">
        <div>
          <div className="text-[10px] text-[#00F2FE] tracking-widest uppercase">
            EXPLORE / GIT HISTORY
          </div>
          <h1 className="font-headline font-bold text-xl text-[#F1F5F9] tracking-tight">
            History
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#00F2FE]/10 border border-[#00F2FE]/40 text-[#00F2FE] text-[11px] font-bold">
            <span>HEAD</span>
            <GitBranch className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Split: Commit Lineage Timeline on left, Commit Detail on right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Commit Timeline List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
          {/* Continuous Cyan Line */}
          <div className="absolute left-[39px] top-8 bottom-8 w-[2px] bg-[#00F2FE]/40" />

          {HISTORY_COMMITS.map((commit, idx) => {
            const isSelected = selectedCommit.shortHash === commit.shortHash;
            return (
              <div
                key={`${commit.shortHash}-${idx}`}
                onClick={() => setSelectedCommit(commit)}
                className={`relative flex items-start gap-4 p-3 pl-12 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#182030] border-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                    : 'bg-[#111622] border-[#1E2638] hover:border-[#2D3A54]'
                }`}
              >
                {/* Node Ring Icon on the lineage line */}
                <div
                  className={`absolute left-3 top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#00F2FE] bg-[#0B0E14] ring-4 ring-[#00F2FE]/20'
                      : 'border-[#00F2FE]/60 bg-[#0B0E14]'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-[#00F2FE]' : 'bg-[#00F2FE]/60'
                    }`}
                  />
                </div>

                {/* Commit info content */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-sans-geist font-semibold text-[13px] text-[#F1F5F9] truncate">
                      {commit.message}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-1.5 py-0.2 bg-[#0B0E14] border border-[#1E2638] text-[10px] text-[#00F2FE]">
                        {commit.shortHash}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {commit.filesChanged} file{commit.filesChanged > 1 ? 's' : ''}{' '}
                        <span className="text-[#06D6A0]">+{commit.additions}</span>{' '}
                        {commit.deletions > 0 && <span className="text-[#EF476F]">-{commit.deletions}</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[11px] text-[#94A3B8]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#DEE2F3]">{commit.author}</span>
                      <span>•</span>
                      <span>{commit.timestamp}</span>
                    </div>

                    {/* Impact Tags */}
                    {commit.tags && (
                      <div className="flex items-center gap-1.5">
                        {commit.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className={`px-2 py-0.2 text-[10px] font-semibold uppercase ${
                              tag.type === 'clean'
                                ? 'bg-[#06D6A0]/10 border border-[#06D6A0]/40 text-[#06D6A0]'
                                : 'bg-[#FFB703]/10 border border-[#FFB703]/40 text-[#FFB703]'
                            }`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Commit Detail Drawer (matches screenshot) */}
        <div className="w-[360px] border-l border-[#1E2638] bg-[#0E131F] p-4 flex flex-col shrink-0 overflow-y-auto">
          <div className="font-headline font-bold text-[14px] text-[#F1F5F9] pb-3 border-b border-[#1E2638]">
            Commit Detail - {selectedCommit.shortHash}
          </div>

          {/* High-Impact Warning Card */}
          <div className="my-4 p-3 bg-[#FFB703]/10 border border-[#FFB703]/40 text-[#FFB703] text-[11px]">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>High-Impact warning: module boundary cross</span>
            </div>
          </div>

          {/* File Changes List */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-2">
              Modified Files in Scope
            </div>

            {[
              { path: 'README.md', adds: 1, dels: 1 },
              { path: 'src/auth.ts', adds: 1, dels: 1 },
              { path: 'src/auth.ts', adds: 1, dels: 1 },
              { path: 'src/auth.ts', adds: 1, dels: 1 },
              { path: 'src/auth.ts', adds: 1, dels: 1 },
              { path: 'README.suite.md', adds: 1, dels: 1 },
              { path: 'peer_main.ts', adds: 1, dels: 1 },
              { path: 'src/auth.ts', adds: 1, dels: 1 },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 bg-[#111622] border border-[#1E2638] text-[11px] hover:border-[#2D3A54]"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                  <span className="text-[#DEE2F3] truncate">{f.path}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                  <span className="text-[#06D6A0]">+{f.adds}</span>
                  <span className="text-[#475569]">|</span>
                  <span className="text-[#EF476F]">-{f.dels}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
