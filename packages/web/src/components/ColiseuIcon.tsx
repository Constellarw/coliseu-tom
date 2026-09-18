import React from 'react';

interface ColiseuIconProps {
  className?: string;
  size?: number;
}

export const ColiseuIcon: React.FC<ColiseuIconProps> = ({ className = 'w-9 h-9', size = 36 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-xl bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0 ${className}`}
    >
      <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden relative">
        {/* Arena arch glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent pointer-events-none" />
        
        {/* Colosseum Arches Icon */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
        >
          {/* Top roof arch */}
          <path
            d="M6 18C12 11 36 11 42 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Second tier cornice */}
          <path
            d="M8 26C14 20 34 20 40 26"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Columns & Arches */}
          <path
            d="M10 26V37M18 24V37M30 24V37M38 26V37"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Arch curves */}
          <path
            d="M10 30C10 27 18 27 18 30M18 28C18 25 30 25 30 28M30 28C30 25 38 25 38 28"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {/* Arena base */}
          <path
            d="M6 37H42"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};
