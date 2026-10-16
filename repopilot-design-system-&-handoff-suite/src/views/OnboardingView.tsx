import React, { useState } from 'react';
import {
  FolderGit2,
  GitBranch,
  Terminal,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Clock,
  Sparkles,
  FolderOpen,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { NavigationPage } from '../components/layout/AppSidebar';

export interface OnboardingViewProps {
  onComplete: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [repoPath, setRepoPath] = useState('/home/developer/workspace/repo-pilot');
  const [branch, setBranch] = useState('main');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      onComplete();
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full bg-[#080B10] p-6 select-none relative font-mono text-[#DEE2F3] overflow-y-auto">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-circuit-grid opacity-60 pointer-events-none" />

      {/* Center Console Container */}
      <div className="relative w-full max-w-2xl bg-[#0E131F] border border-[#2D3A54] shadow-[0_0_30px_rgba(0,0,0,0.8)] z-10">
        {/* Reticle marks */}
        <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#00F2FE]" />
        <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#00F2FE]" />
        <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#00F2FE]" />
        <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#00F2FE]" />

        {/* Top Header */}
        <div className="p-6 border-b border-[#1E2638] flex items-center justify-between bg-[#111622]">
          <Logo size={32} />
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#00F2FE]/10 border border-[#00F2FE]/40 text-[#00F2FE] text-[10px] font-semibold tracking-wider">
            <span>READY FOR INTROSPECTION</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          <div>
            <h2 className="font-headline font-bold text-lg text-[#F1F5F9] tracking-tight">
              Connect Repository or Local Workspace
            </h2>
            <p className="font-sans-geist text-[12px] text-[#94A3B8] mt-1">
              Select a polyglot Git repository or local source directory to initialize AST signal graphs, fan-in matrices, and blast radius predictors.
            </p>
          </div>

          {/* Repo Path Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#94A3B8] uppercase font-semibold">
              Source Directory or Repository URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                className="flex-1 h-[32px] px-3 bg-[#0B0E14] border border-[#1E2638] text-[12px] text-[#F1F5F9] focus:outline-none focus:border-[#00F2FE]"
              />
              <Button variant="secondary" icon={<FolderOpen className="w-3.5 h-3.5" />}>
                Browse
              </Button>
            </div>
          </div>

          {/* Branch & Target Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#94A3B8] uppercase font-semibold">
                Target Branch
              </label>
              <div className="flex items-center h-[32px] px-3 bg-[#0B0E14] border border-[#1E2638]">
                <GitBranch className="w-3.5 h-3.5 text-[#00F2FE] mr-2 shrink-0" />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-transparent text-[12px] text-[#F1F5F9] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-[#94A3B8] uppercase font-semibold">
                AST Scope Mode
              </label>
              <select className="w-full h-[32px] px-2 bg-[#0B0E14] border border-[#1E2638] text-[12px] text-[#00F2FE] focus:outline-none">
                <option>Full Monorepo (Deep Traversal)</option>
                <option>Active Workspace Only</option>
                <option>Git Changed Head Only</option>
              </select>
            </div>
          </div>

          {/* Recent Repositories */}
          <div className="pt-2">
            <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-2">
              Recent Codebases
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div
                onClick={() => {
                  setRepoPath('/home/developer/workspace/repo-pilot');
                  setBranch('main');
                }}
                className="flex items-center justify-between p-2.5 bg-[#111622] border border-[#1E2638] hover:border-[#00F2FE] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-[#00F2FE]" />
                  <span className="font-semibold text-[#DEE2F3]">repo-pilot</span>
                  <span className="text-[#475569]">/main</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#94A3B8]">
                  <span>87 files • 10K SLOC</span>
                  <span>Scanned 2m ago</span>
                </div>
              </div>

              <div
                onClick={() => {
                  setRepoPath('/home/developer/workspace/inventory-service');
                  setBranch('develop');
                }}
                className="flex items-center justify-between p-2.5 bg-[#111622] border border-[#1E2638] hover:border-[#00F2FE] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-[#9D4EDD]" />
                  <span className="font-semibold text-[#DEE2F3]">inventory-service</span>
                  <span className="text-[#475569]">/develop</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#94A3B8]">
                  <span>42 files • 6.2K SLOC</span>
                  <span>Scanned yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-[#1E2638] bg-[#111622] flex items-center justify-between">
          <div className="text-[11px] text-[#94A3B8] flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[#00F2FE]" />
            <span>Deterministic AST Engine v2.4.1</span>
          </div>

          <Button
            variant="primary"
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            icon={isAnalyzing ? <div className="w-3.5 h-3.5 border-2 border-[#0B0E14] border-t-transparent animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          >
            {isAnalyzing ? 'Indexing AST Topologies...' : 'Initialize AST Cockpit'}
          </Button>
        </div>
      </div>
    </div>
  );
};
