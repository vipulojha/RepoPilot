import React from 'react';
import { Search, ChevronDown, RefreshCw, Command, Play } from 'lucide-react';
import { Button } from '../ui/Button';

export interface AppHeaderProps {
  currentViewTitle?: string;
  onOpenCommandPalette: () => void;
  onRescan?: () => void;
  onSwitchRepo?: () => void;
  activeRepo?: string;
  activeBranch?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentViewTitle = 'Dashboard',
  onOpenCommandPalette,
  onRescan,
  onSwitchRepo,
  activeRepo = 'repo-pilot',
  activeBranch = 'main',
}) => {
  return (
    <header className="h-[48px] bg-[#0E131F] border-b border-[#1E2638] px-4 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Left: Breadcrumbs & Repository switch */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-mono text-[12px] text-[#94A3B8]">
          <span className="text-[#DEE2F3] font-medium">{activeRepo}</span>
          <span className="text-[#475569]">/</span>
          <span className="text-[#00F2FE] font-medium">{activeBranch}</span>
        </div>

        <button
          onClick={onSwitchRepo}
          className="flex items-center gap-1.5 h-[24px] px-2 bg-[#182030] hover:bg-[#1E2638] border border-[#1E2638] hover:border-[#2D3A54] text-[#DEE2F3] text-[11px] font-sans-geist transition-colors cursor-pointer"
        >
          <span>Repository switch</span>
          <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
        </button>

        <span className="text-[#1E2638] font-mono">|</span>

        <span className="font-headline font-semibold text-[13px] text-[#F1F5F9] tracking-wide uppercase">
          {currentViewTitle}
        </span>
      </div>

      {/* Right: Search / Cmd+K and action controls */}
      <div className="flex items-center gap-3">
        {/* Quick jump trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 h-[28px] w-64 px-2.5 bg-[#0B0E14] border border-[#1E2638] hover:border-[#00F2FE]/50 text-[#94A3B8] hover:text-[#DEE2F3] text-[12px] font-sans-geist transition-all cursor-pointer text-left"
        >
          <Search className="w-3.5 h-3.5 text-[#475569]" />
          <span className="truncate">Jump to anything (Cmd+K)</span>
          <span className="ml-auto flex items-center gap-0.5 px-1 py-0.5 bg-[#182030] border border-[#1E2638] text-[9px] font-mono text-[#475569]">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </span>
        </button>

        {/* Rescan / Run Analysis */}
        <Button
          variant="outline-cyan"
          size="sm"
          onClick={onRescan}
          icon={<RefreshCw className="w-3 h-3" />}
        >
          Rescan
        </Button>

        {/* System status beacon */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#1E2638]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#06D6A0] animate-pulse" />
          <span className="font-mono text-[10px] text-[#06D6A0] font-semibold tracking-wider uppercase">
            SYSTEM STATUS
          </span>
        </div>
      </div>
    </header>
  );
};
