import React, { useState } from 'react';
import {
  GitCommit,
  GitBranch,
  RefreshCw,
  FileCode,
  Check,
  UploadCloud,
  DownloadCloud,
  Archive,
  Layers,
  Terminal,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useHandoffDataContext } from '../lib/handoffData';
import { api } from '../lib/api/client';

export const GitActionsView: React.FC<{ repositoryId?: number | null }> = ({ repositoryId }) => {
  const handoffData = useHandoffDataContext();
  const [commitMessage, setCommitMessage] = useState('');
  const [branchName, setBranchName] = useState('');
  const [stashName, setStashName] = useState('Work in progress');
  const [stagedFiles, setStagedFiles] = useState(() => (handoffData?.changedFiles ?? []).map(file => ({ path: file.path, adds: file.additions, dels: file.deletions, staged: true })));
  const [feedback, setFeedback] = useState('');
  const runAction = (action: string) => { if (!repositoryId) return; api.gitAction(repositoryId, { action: action as any, message: commitMessage || undefined, name: branchName || undefined, confirm: true }).then(receipt => setFeedback(receipt.message)).catch(error => setFeedback(error instanceof Error ? error.message : 'Git action failed')); };

  const toggleStaged = (index: number) => {
    setStagedFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, staged: !f.staged } : f))
    );
  };

  const stagedCount = stagedFiles.filter((f) => f.staged).length;

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0E14] select-none overflow-y-auto p-6 space-y-5 font-mono text-[#DEE2F3]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E2638] pb-4">
        <div>
          <div className="text-[10px] text-[#00F2FE] tracking-widest uppercase mb-1">
            OPERATE / GIT ACTIONS
          </div>
          <h1 className="font-headline font-bold text-2xl text-[#F1F5F9] tracking-tight">
            Git Actions
          </h1>
          <p className="text-[12px] font-sans-geist text-[#94A3B8] mt-1">
            Safe, explicit changes to the selected repository.
          </p>
        </div>

        <Button variant="ghost" size="sm" icon={<RefreshCw className="w-3 h-3" />}>
          Refresh
        </Button>
      </div>

      {/* Mutation Console Banner */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#111622] border border-[#1E2638] text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#DEE2F3]">Mutation Console</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#06D6A0]" />
          <span className="text-[#94A3B8]">
            Connected & Syncing with repoPilot-git-worker
          </span>
        </div>
      </div>

      {/* 2-Pane Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Changed files - staged (6 cols) */}
        <div className="lg:col-span-6 bg-[#111622] border border-[#1E2638] flex flex-col justify-between">
          <div>
            <div className="px-4 py-2.5 border-b border-[#1E2638] flex items-center justify-between bg-[#0E131F]">
              <span className="font-headline font-semibold text-[13px] text-[#F1F5F9] uppercase">
                Changed files · {stagedCount} staged
              </span>
              <span className="text-[10px] text-[#00F2FE]">
                {stagedCount} selected
              </span>
            </div>

            <div className="p-3 space-y-2">
              {stagedFiles.map((file, i) => (
                <div
                  key={i}
                  onClick={() => toggleStaged(i)}
                  className="flex items-center justify-between p-2.5 bg-[#0B0E14] border border-[#1E2638] hover:border-[#2D3A54] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-[#475569] text-xs">{i + 1}.</span>
                    <input
                      type="checkbox"
                      checked={file.staged}
                      onChange={() => toggleStaged(i)}
                      className="accent-[#00F2FE] cursor-pointer"
                    />
                    <FileCode className="w-3.5 h-3.5 text-[#00F2FE] shrink-0" />
                    <span className="text-[12px] text-[#DEE2F3] truncate">
                      {file.path}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] shrink-0">
                    <span className="px-1.5 py-0.2 bg-[#06D6A0]/15 text-[#06D6A0] font-semibold">
                      +{file.adds}
                    </span>
                    {file.dels > 0 && (
                      <span className="px-1.5 py-0.2 bg-[#EF476F]/15 text-[#EF476F] font-semibold">
                        -{file.dels}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Working tree state status */}
          <div className="p-3 border-t border-[#1E2638] bg-[#0E131F] flex items-center gap-2 text-[11px] text-[#94A3B8]">
            <Check className="w-3.5 h-3.5 text-[#00F2FE]" />
            <span>Working tree state: {stagedCount} files staged for commit</span>
          </div>
        </div>

        {/* Right Pane: Commit scope, Branch, Remotes, Stashes (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Commit staged scope */}
          <div className="p-4 bg-[#111622] border border-[#1E2638] space-y-3">
            <div className="text-[11px] font-semibold text-[#DEE2F3] uppercase tracking-wide">
              Commit staged scope
            </div>
            <textarea
              rows={3}
              placeholder="Describe the change... [Cmd+Enter]"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="w-full p-2.5 bg-[#0B0E14] border border-[#1E2638] focus:border-[#00F2FE] text-[12px] font-mono text-[#F1F5F9] placeholder-[#475569] focus:outline-none resize-none"
            />
            <Button onClick={() => runAction('commit')} variant="primary" className="w-full text-xs" icon={<GitCommit className="w-3.5 h-3.5" />}>
              Commit ({stagedCount} files)
            </Button>
          </div>

          {/* Branch management */}
          <div className="p-4 bg-[#111622] border border-[#1E2638] space-y-3">
            <div className="text-[11px] font-semibold text-[#DEE2F3] uppercase tracking-wide">
              Branch
            </div>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full h-[28px] px-2.5 bg-[#0B0E14] border border-[#1E2638] text-[11px] text-[#F1F5F9] focus:outline-none focus:border-[#00F2FE]"
            />
            <div className="flex gap-2">
              <Button onClick={() => runAction('create_branch')} variant="secondary" size="sm" className="flex-1">
                Create
              </Button>
              <Button onClick={() => runAction('switch_branch')} variant="secondary" size="sm" className="flex-1">
                Switch
              </Button>
            </div>
          </div>

          {/* Remote operations */}
          <div className="p-4 bg-[#111622] border border-[#1E2638] space-y-2">
            <div className="text-[11px] font-semibold text-[#DEE2F3] uppercase tracking-wide">
              Remote operations
            </div>
            <div className="flex gap-2">
              <Button onClick={() => runAction('fetch')} variant="secondary" size="sm" className="flex-1" icon={<DownloadCloud className="w-3 h-3" />}>
                Fetch
              </Button>
              <Button onClick={() => runAction('pull')} variant="secondary" size="sm" className="flex-1" icon={<DownloadCloud className="w-3 h-3" />}>
                Pull
              </Button>
              <Button onClick={() => runAction('push')} variant="secondary" size="sm" className="flex-1" icon={<UploadCloud className="w-3 h-3" />}>
                Push
              </Button>
            </div>
          </div>

          {/* Stashes & Stash Ledger */}
          <div className="p-4 bg-[#111622] border border-[#1E2638] space-y-3">
            <div className="text-[11px] font-semibold text-[#DEE2F3] uppercase tracking-wide">
              Stashes
            </div>
            <input
              type="text"
              value={stashName}
              onChange={(e) => setStashName(e.target.value)}
              className="w-full h-[28px] px-2.5 bg-[#0B0E14] border border-[#1E2638] text-[11px] text-[#F1F5F9] focus:outline-none focus:border-[#00F2FE]"
            />
            <Button variant="secondary" size="sm" className="w-full" icon={<Archive className="w-3 h-3" />}>
              Create stash
            </Button>

            {/* Stash Ledger */}
            <div className="pt-2 border-t border-[#1E2638]">
              <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-2">
                Stash Ledger
              </div>
              <div className="space-y-1.5 text-[10px] text-[#94A3B8]">
                <div className="flex items-center justify-between p-1.5 bg-[#0B0E14] border border-[#1E2638]">
                  <span className="text-[#DEE2F3]">stash@&#123;0&#125;: WIP on main: bugfix</span>
                  <span>09/20/2023, 12:26:34</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#0B0E14] border border-[#1E2638]">
                  <span className="text-[#DEE2F3]">stash@&#123;1&#125;: WIP on main: bugfix</span>
                  <span>09/20/2023, 19:28:35</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#0B0E14] border border-[#1E2638]">
                  <span className="text-[#DEE2F3]">stash@&#123;3&#125;: WIP on main: bugfix</span>
                  <span>09/20/2023, 19:35:53</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
