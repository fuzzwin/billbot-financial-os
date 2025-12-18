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
    red: 'bg-red-500 led-glow-red',
    green: 'bg-emerald-500 led-glow-green',
    blue: 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]',
    yellow: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]',
    orange: 'bg-[#FF4F00] shadow-[0_0_6px_rgba(255,79,0,0.6)]'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`
        w-2.5 h-2.5 rounded-full border border-black/10 transition-all duration-300
        ${active
          ? activeColors[color]
          : 'bg-gray-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]'
        }
      `} />
      {label && <span className="tactile-label">{label}</span>}
    </div>
  );
};

