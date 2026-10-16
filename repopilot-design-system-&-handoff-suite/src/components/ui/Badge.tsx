import React from 'react';

export type BadgeVariant = 'cyan' | 'violet' | 'amber' | 'emerald' | 'crimson' | 'neutral' | 'subtle';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  className = '',
  icon,
}) => {
  let styles = '';
  switch (variant) {
    case 'cyan':
      styles = 'bg-[#00F2FE]/10 border border-[#00F2FE]/40 text-[#00F2FE]';
      break;
    case 'violet':
      styles = 'bg-[#9D4EDD]/10 border border-[#9D4EDD]/40 text-[#9D4EDD]';
      break;
    case 'amber':
      styles = 'bg-[#FFB703]/10 border border-[#FFB703]/40 text-[#FFB703]';
      break;
    case 'emerald':
      styles = 'bg-[#06D6A0]/10 border border-[#06D6A0]/40 text-[#06D6A0]';
      break;
    case 'crimson':
      styles = 'bg-[#EF476F]/10 border border-[#EF476F]/40 text-[#EF476F]';
      break;
    case 'neutral':
      styles = 'bg-[#182030] border border-[#2D3A54] text-[#DEE2F3]';
      break;
    case 'subtle':
      styles = 'bg-[#161B28] border border-[#1E2638] text-[#94A3B8]';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 h-[18px] px-1.5 font-mono text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap select-none rounded-none ${styles} ${className}`}
    >
      {icon && <span className="w-2.5 h-2.5 flex items-center justify-center">{icon}</span>}
      {children}
    </span>
  );
};
