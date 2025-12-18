import React from 'react';

interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  color?: 'white' | 'orange' | 'blue' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const TactileButton: React.FC<TactileButtonProps> = ({ 
  children, 
  color = "white", 
  size = "md", 
  fullWidth = false,
  className = "",
  ...props 
}) => {
  const colorMap = {
    white: "bg-industrial-base text-industrial-text shadow-tactile-raised active:shadow-tactile-pressed",
    orange: "bg-[#FF4F00] text-white shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.1)]",
    blue: "bg-[#0055FF] text-white shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.1)]",
    yellow: "bg-[#F3CF44] text-industrial-dark-base shadow-[4px_4px_10px_rgba(0,0,0,0.2),-4px_-4px_10px_rgba(255,255,255,0.1)]",
    red: "bg-[#ef4444] text-white shadow-[4px_4px_10px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(255,255,255,0.1)]"
  };

  const sizeMap = {
    sm: "px-3 py-1.5 text-[9px]",
    md: "px-6 py-3 text-[11px]",
    lg: "px-8 py-4 text-[13px]"
  };

  return (
    <button
      {...props}
      className={`
        ${colorMap[color]} 
        ${sizeMap[size]} 
        ${fullWidth ? 'w-full' : ''} 
        rounded-xl font-black uppercase tracking-tighter transition-all duration-75 ease-in-out relative overflow-hidden 
        active:shadow-tactile-pressed active:translate-y-[1px]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
};

