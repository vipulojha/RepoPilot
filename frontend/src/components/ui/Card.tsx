import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  variant?: 'panel' | 'card' | 'trough';
  accentBorder?: 'cyan' | 'violet' | 'amber' | 'emerald' | 'crimson' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  variant = 'panel',
  accentBorder = 'none',
  className = '',
  ...props
}) => {
  let bg = 'bg-[#111622]';
  if (variant === 'card') bg = 'bg-[#182030]';
  if (variant === 'trough') bg = 'bg-[#161B28]';

  let borderTop = '';
  switch (accentBorder) {
    case 'cyan':
      borderTop = 'border-t-2 border-t-[#00F2FE]';
      break;
    case 'violet':
      borderTop = 'border-t-2 border-t-[#9D4EDD]';
      break;
    case 'amber':
      borderTop = 'border-t-2 border-t-[#FFB703]';
      break;
    case 'emerald':
      borderTop = 'border-t-2 border-t-[#06D6A0]';
      break;
    case 'crimson':
      borderTop = 'border-t-2 border-t-[#EF476F]';
      break;
  }

  return (
    <div
      className={`relative border border-[#1E2638] ${bg} ${borderTop} rounded-none ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between px-3 h-[30px] border-b border-[#1E2638] bg-[#0E131F]/50 select-none">
          <div className="flex items-center gap-2 overflow-hidden">
            {typeof title === 'string' ? (
              <span className="font-headline font-semibold text-[12px] tracking-wide text-[#F1F5F9] uppercase truncate">
                {title}
              </span>
            ) : (
              title
            )}
            {subtitle && (
              <span className="text-[11px] text-[#94A3B8] font-mono truncate">
                {subtitle}
              </span>
            )}
          </div>
          {headerAction && <div className="shrink-0 flex items-center gap-2">{headerAction}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
