import React from 'react';

interface RecessedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const RecessedInput: React.FC<RecessedInputProps> = ({ label, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="tactile-label px-1 opacity-70">
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          {...props}
          className={`
            w-full bg-industrial-well-bg/50 rounded-xl px-4 py-3.5
            text-[15px] font-semibold text-industrial-text placeholder-industrial-subtext/45
            shadow-pressed outline-none border border-black/5 min-h-[48px]
            focus:bg-industrial-well-bg transition-all duration-200
            focus:border-blue-500/30
            ${className}
          `}
        />
      </div>
    </div>
  );
};

