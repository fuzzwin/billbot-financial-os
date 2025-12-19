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
    blue: "bg-industrial-blue text-white shadow-tactile-raised active:shadow-tactile-pressed border-t border-l border-white/20",
    yellow: "bg-industrial-yellow text-industrial-text shadow-tactile-raised active:shadow-tactile-pressed border-t border-l border-white/20",
    /* Reserve orange/red strictly for warning/danger semantics */
    orange: "bg-industrial-orange text-white shadow-tactile-raised active:shadow-tactile-pressed border-t border-l border-white/20",
    red: "bg-[#EF4444] text-white shadow-tactile-raised active:shadow-tactile-pressed border-t border-l border-white/20"
  };

  const sizeMap = {
    /* Minimum touch height ~44px (mobile) */
    sm: "px-4 py-2.5 text-[12px] min-h-[44px]",
    md: "px-5 py-3 text-[13px] min-h-[44px]",
    lg: "px-7 py-4 text-[15px] min-h-[48px]"
  };

  return (
    <button
      {...props}
      className={`
        ${colorMap[color]} 
        ${sizeMap[size]} 
        ${fullWidth ? 'w-full' : ''} 
        rounded-xl font-semibold tracking-wide transition-all duration-100 relative overflow-hidden 
        active:translate-y-[1px]
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>
    </button>
  );
};

