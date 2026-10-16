import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  compact?: boolean;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  compact = false,
  icon,
  suffix,
  className = '',
  ...props
}, ref) => {
  const heightClass = compact ? 'h-[24px] text-[11px] px-2' : 'h-[32px] text-[12px] px-2.5';

  return (
    <div className={`relative flex items-center bg-[#0B0E14] border border-[#1E2638] focus-within:border-[#00F2FE] transition-colors rounded-none w-full ${className}`}>
      {icon && (
        <span className="pl-2 text-[#475569] shrink-0 flex items-center justify-center">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={`w-full bg-transparent text-[#F1F5F9] placeholder-[#475569] font-mono focus:outline-none rounded-none border-0 ${heightClass} ${icon ? 'pl-2' : ''} ${suffix ? 'pr-2' : ''}`}
        {...props}
      />
      {suffix && (
        <span className="pr-2 text-[#475569] shrink-0 flex items-center justify-center">
          {suffix}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
