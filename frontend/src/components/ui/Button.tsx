import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'danger' | 'outline-cyan';
  size?: 'sm' | 'md' | 'icon';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  let baseStyles = 'inline-flex items-center justify-center font-sans-geist font-semibold tracking-wide transition-colors select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 border-0 rounded-none';

  let sizeStyles = 'h-[28px] px-3 text-[12px] gap-1.5';
  if (size === 'sm') {
    sizeStyles = 'h-[24px] px-2 text-[11px] gap-1';
  } else if (size === 'icon') {
    sizeStyles = 'w-[24px] h-[24px] p-0 text-[12px]';
  }

  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-[#00F2FE] text-[#0B0E14] hover:bg-[#38F9FF] active:bg-[#00C2CC] shadow-[0_0_12px_rgba(0,242,254,0.3)]';
      break;
    case 'outline-cyan':
      variantStyles = 'bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/50 hover:bg-[#00F2FE]/20 hover:border-[#00F2FE]';
      break;
    case 'secondary':
      variantStyles = 'bg-[#182030] border border-[#1E2638] text-[#DEE2F3] hover:border-[#2D3A54] hover:bg-[#1E2638] hover:text-white';
      break;
    case 'ghost':
      variantStyles = 'bg-transparent text-[#94A3B8] hover:bg-[#182030] hover:text-[#F1F5F9]';
      break;
    case 'icon':
      variantStyles = 'bg-transparent text-[#94A3B8] hover:bg-[#182030] hover:text-[#00F2FE] border border-transparent hover:border-[#1E2638]';
      break;
    case 'danger':
      variantStyles = 'bg-[#EF476F]/10 border border-[#EF476F]/50 text-[#EF476F] hover:bg-[#EF476F]/20';
      break;
  }

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
};
