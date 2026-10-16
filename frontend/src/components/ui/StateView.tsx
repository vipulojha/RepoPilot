import React from 'react';
import { AlertTriangle, Database, RefreshCw, Terminal } from 'lucide-react';
import { Button } from './Button';

interface LoadingStateProps {
  label?: string;
  sublabel?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'ANALYZING AST TOPOLOGY...',
  sublabel = 'Resolving symbol hierarchies and transitive call boundaries',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 w-full h-full min-h-[300px] bg-[#0B0E14] border border-[#1E2638] text-center select-none">
      <div className="relative w-12 h-12 mb-4 flex items-center justify-center">
        <div className="absolute inset-0 border border-[#00F2FE]/20" />
        <div className="w-8 h-8 border-2 border-t-[#00F2FE] border-r-transparent border-b-[#9D4EDD] border-l-transparent animate-spin" />
      </div>
      <div className="font-mono text-[12px] text-[#00F2FE] tracking-widest uppercase mb-1">
        {label}
      </div>
      <div className="font-mono text-[11px] text-[#94A3B8] max-w-md">
        {sublabel}
      </div>
      {/* Telemetry skeleton bars */}
      <div className="w-64 mt-6 space-y-2">
        <div className="h-1 bg-[#182030] overflow-hidden">
          <div className="h-full bg-[#00F2FE] w-2/3 animate-pulse" />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-[#475569]">
          <span>PARSING SYMBOLS</span>
          <span>67%</span>
        </div>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Structural Signals Detected',
  description = 'Run an AST rescan or select another branch to evaluate symbol coverage and call graphs.',
  actionLabel = 'Run AST Rescan',
  onAction,
  icon,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center p-12 w-full h-full min-h-[300px] bg-[#111622] border border-[#1E2638] text-center select-none">
      {/* Corner reticles */}
      <span className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#2D3A54]" />
      <span className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#2D3A54]" />
      <span className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#2D3A54]" />
      <span className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#2D3A54]" />

      <div className="w-10 h-10 mb-4 bg-[#182030] border border-[#2D3A54] flex items-center justify-center text-[#94A3B8]">
        {icon || <Database className="w-5 h-5 text-[#94A3B8]" />}
      </div>
      <h3 className="font-headline font-semibold text-[14px] text-[#F1F5F9] mb-1">
        {title}
      </h3>
      <p className="font-sans-geist text-[12px] text-[#94A3B8] max-w-sm mb-5">
        {description}
      </p>
      {actionLabel && (
        <Button variant="outline-cyan" onClick={onAction} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  error?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'AST Parse Interrupt',
  error = 'The repository analysis service returned an error. Retry the current operation or rescan the repository.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 w-full h-full min-h-[300px] bg-[#111622] border border-[#EF476F]/40 text-center select-none">
      <div className="w-10 h-10 mb-3 bg-[#EF476F]/10 border border-[#EF476F]/50 flex items-center justify-center text-[#EF476F]">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="font-headline font-semibold text-[14px] text-[#EF476F] mb-1">
        {title}
      </h3>
      <div className="bg-[#0B0E14] border border-[#EF476F]/30 p-3 my-3 text-left max-w-lg w-full font-mono text-[11px] text-[#DEE2F3] overflow-x-auto">
        <div className="text-[#EF476F] mb-1 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" />
          <span>PARSER FAILURE // CODEBASE ANOMALY</span>
        </div>
        <p className="text-[#94A3B8]">{error}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry AST Pipeline
        </Button>
      )}
    </div>
  );
};
