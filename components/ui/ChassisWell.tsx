import React from 'react';

interface ChassisWellProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export const ChassisWell: React.FC<ChassisWellProps> = ({ children, label, className = "" }) => (
  <div className={`bg-industrial-base tactile-raised p-4 md:p-6 rounded-[2rem] border-t border-l border-white/10 ${className}`}>
    {label && (
      <div className="tactile-label mb-4 px-2 border-l-2 border-industrial-orange">
        {label}
      </div>
    )}
    <div className="bg-industrial-base tactile-well rounded-2xl p-4 md:p-6 border-t border-l border-black/5">
      {children}
    </div>
  </div>
);

