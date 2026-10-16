import React from 'react';
import { ChevronRight, GitBranch } from 'lucide-react';

export interface BreadcrumbProps {
  repo?: string;
  branch?: string;
  pathSegments?: string[];
  currentView?: string;
  className?: string;
  onRepoClick?: () => void;
  onBranchClick?: () => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  repo = 'repository',
  branch = 'main',
  pathSegments = [],
  currentView,
  className = '',
  onRepoClick,
  onBranchClick,
}) => {
  return (
    <div className={`flex items-center gap-1.5 font-mono text-[12px] text-[#94A3B8] select-none ${className}`}>
      <span className="text-[#475569]">{'{'}</span>
      <button
        onClick={onRepoClick}
        className="text-[#94A3B8] hover:text-[#00F2FE] transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-[12px]"
      >
        {repo}
      </button>
      <span className="text-[#475569]">{'}'}</span>

      <ChevronRight className="w-3.5 h-3.5 text-[#475569]" />

      <button
        onClick={onBranchClick}
        className="flex items-center gap-1 text-[#00F2FE] hover:underline cursor-pointer bg-transparent border-0 p-0 font-mono text-[12px]"
      >
        <GitBranch className="w-3 h-3 text-[#00F2FE]" />
        <span>{branch}</span>
      </button>

      {pathSegments.map((segment, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3.5 h-3.5 text-[#475569]" />
          <span className="text-[#94A3B8]">{segment}</span>
        </React.Fragment>
      ))}

      {currentView && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-[#475569]" />
          <span className="text-[#F1F5F9] font-medium font-headline">{currentView}</span>
        </>
      )}
    </div>
  );
};
