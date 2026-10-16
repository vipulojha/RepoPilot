import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  withText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 28, className = '', withText = true }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Exact Cybernetic 'R' Icon from design assets */}
      <div 
        className="relative flex items-center justify-center shrink-0 bg-[#0E131F] border border-[#1E2638]"
        style={{ width: size, height: size }}
      >
        {/* Reticle corner marks */}
        <span className="absolute top-0.5 left-0.5 w-1 h-1 border-t border-l border-[#00F2FE]/60" />
        <span className="absolute top-0.5 right-0.5 w-1 h-1 border-t border-r border-[#00F2FE]/60" />
        <span className="absolute bottom-0.5 left-0.5 w-1 h-1 border-b border-l border-[#00F2FE]/60" />
        <span className="absolute bottom-0.5 right-0.5 w-1 h-1 border-b border-r border-[#00F2FE]/60" />

        <svg 
          viewBox="0 0 100 100" 
          className="w-4/5 h-4/5 overflow-visible"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Circuit tracks behind */}
          <path d="M 18 36 H 32 V 64 H 18" stroke="#9D4EDD" strokeWidth="2.5" strokeDasharray="3 3" />
          <path d="M 60 36 H 78 V 64 H 64" stroke="#9D4EDD" strokeWidth="2.5" strokeDasharray="3 3" />
          <path d="M 56 64 H 76" stroke="#FFB703" strokeWidth="2.5" strokeDasharray="2 2" />
          <circle cx="76" cy="64" r="2.5" fill="#FFB703" />

          {/* Glowing Main Circuit 'R' */}
          <path
            d="M 32 22 H 60 C 74 22 74 50 60 50 H 32 M 45 50 L 68 78"
            stroke="#00F2FE"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(0, 242, 254, 0.8))'
            }}
          />
          {/* Pin nodes */}
          <circle cx="32" cy="22" r="3.5" stroke="#00F2FE" strokeWidth="2" fill="#0B0E14" />
          <circle cx="32" cy="50" r="3" fill="#00F2FE" />
          <circle cx="68" cy="78" r="3.5" stroke="#00F2FE" strokeWidth="2" fill="#0B0E14" />
          <circle cx="32" cy="78" r="3.5" stroke="#00F2FE" strokeWidth="2" fill="#0B0E14" />
        </svg>
      </div>

      {withText && (
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5">
            <span className="font-headline font-bold text-sm tracking-tight text-[#F1F5F9]">
              RepoPilot
            </span>
          </div>
          <span className="text-[10px] text-[#475569] font-mono leading-none tracking-wider uppercase">
            repository intelligence
          </span>
        </div>
      )}
    </div>
  );
};
