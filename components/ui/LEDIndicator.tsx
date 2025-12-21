import React from 'react';

interface LEDIndicatorProps {
  active: boolean;
  label?: string;
  color?: 'red' | 'green' | 'blue' | 'yellow' | 'orange';
}

export const LEDIndicator: React.FC<LEDIndicatorProps> = ({ 
  active, 
  label, 
  color = 'red' 
}) => {
  const activeColors = {
    red: 'bg-[#EF4444]',
    green: 'bg-[#10B981]',
    blue: 'bg-[#3B82F6]',
    yellow: 'bg-[#FACC15]',
    orange: 'bg-[#FF5C00]'
  };
  const glowColors = {
    red: 'rgba(239, 68, 68, 0.22)',
    green: 'rgba(16, 185, 129, 0.22)',
    blue: 'rgba(59, 130, 246, 0.22)',
    yellow: 'rgba(250, 204, 21, 0.22)',
    orange: 'rgba(255, 92, 0, 0.22)'
  } as const;

  return (
    <div className="flex items-center gap-2">
      <div className={`
        w-3 h-3 rounded-full transition-all duration-300 relative
        ${active
          ? `${activeColors[color]}`
          : 'bg-[#404040] shadow-inner'
        }
      `}>
        {active && (
          <div
            className="absolute -inset-1 rounded-full"
            style={{ boxShadow: `0 0 7px ${glowColors[color]}` }}
          />
        )}
        {/* Physical lens reflection - minimal */}
        {active && <div className="absolute top-[2px] left-[2px] w-1 h-1 bg-white/60 rounded-full" />}
      </div>
      {label && <span className="tactile-label opacity-70">{label}</span>}
    </div>
  );
};

