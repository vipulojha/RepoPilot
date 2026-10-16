import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'segmented';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center bg-[#0B0E14] border border-[#1E2638] p-0.5 gap-0.5 ${className}`}>
        {items.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-1.5 h-[24px] px-2.5 text-[11px] font-sans-geist font-medium transition-colors cursor-pointer select-none border-0 ${
                isActive
                  ? 'bg-[#182030] text-[#00F2FE] border-b-2 border-b-[#00F2FE]'
                  : 'text-[#94A3B8] hover:text-[#DEE2F3] hover:bg-[#111622]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="font-mono text-[10px] text-[#475569] ml-0.5">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center border-b border-[#1E2638] gap-4 ${className}`}>
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 py-1.5 text-[12px] font-sans-geist font-medium transition-colors cursor-pointer select-none relative -mb-px border-0 bg-transparent ${
              isActive
                ? 'text-[#00F2FE] border-b-2 border-b-[#00F2FE]'
                : 'text-[#94A3B8] hover:text-[#DEE2F3]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`font-mono text-[10px] px-1 py-0.2 ${isActive ? 'bg-[#00F2FE]/20 text-[#00F2FE]' : 'bg-[#182030] text-[#94A3B8]'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
