import React from 'react';

interface RecessedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const RecessedInput: React.FC<RecessedInputProps> = ({ label, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="tactile-label px-1">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`
          w-full bg-industrial-base rounded-xl px-4 py-3 
          text-sm font-bold text-industrial-text placeholder-industrial-subtext/50
          shadow-well outline-none focus:ring-1 focus:ring-industrial-orange/30
          transition-all duration-200
          ${className}
        `}
      />
    </div>
  );
};

