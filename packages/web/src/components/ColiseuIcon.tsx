import React from 'react';

interface ColiseuIconProps {
  className?: string;
  size?: number;
}

export const ColiseuIcon: React.FC<ColiseuIconProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-xl bg-gradient-to-b from-red-600 via-red-700 to-zinc-900 p-0.5 shadow-lg shadow-red-900/30 flex items-center justify-center shrink-0 ${className}`}
    >
      <div className="w-full h-full bg-[#0A0A0C] rounded-[10px] flex items-center justify-center overflow-hidden p-1">
        <img
          src="/coliseu_icon.png"
          alt="Coliseu TCG"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};
