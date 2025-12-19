import React from 'react';

interface ChassisWellProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export const ChassisWell: React.FC<ChassisWellProps> = ({ children, label, className = "" }) => (
  <div className={`bg-industrial-base shadow-tactile-raised p-5 md:p-6 rounded-2xl border border-white/15 relative overflow-hidden ${className}`}>
    {label && (
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-industrial-blue rounded-full shadow-sm" />
          <span className="tactile-label text-industrial-subtext/80">
            {label}
          </span>
        </div>
      </div>
    )}
    <div className="relative">
      {children}
    </div>
  </div>
);

