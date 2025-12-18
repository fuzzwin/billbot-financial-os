
import React, { useState } from 'react';
import { Goal } from '../types';
import { useGoalCalculator } from '../hooks/useGoalCalculator';
import { LEDIndicator } from './ui/LEDIndicator';
import { TactileButton } from './ui/TactileButton';
import { ChassisWell } from './ui/ChassisWell';

interface RocketSiloProps {
    goal: Goal;
    onAddFuel: (amount: number) => void;
    onLaunch: () => void;
    isPaused?: boolean;
}

export const RocketSilo: React.FC<RocketSiloProps> = ({ goal, onAddFuel, onLaunch, isPaused }) => {
  const status = useGoalCalculator(goal);
  const [isHovering, setIsHovering] = useState(false);

  if (!status) return null;

  const fuelLevel = `${status.percentageComplete}%`;
  const isReady = status.percentageComplete >= 100;

  return (
    <div 
        className={`relative w-40 h-[22rem] transition-all duration-300 ${isPaused ? 'opacity-50 grayscale' : 'hover:-translate-y-2'}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
    >
      {/* Tooltip Overlay */}
      <div className={`absolute -top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${isHovering ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'} w-56`}>
        <div className="bg-industrial-base rounded-2xl shadow-chassis border-t border-l border-white/10 p-3 text-center">
            <h4 className="text-[10px] font-black text-industrial-text uppercase tracking-tighter mb-1">{goal.name}</h4>
            <div className="font-mono text-industrial-subtext text-[9px] mb-1.5">${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}</div>
            {isPaused ? (
                <div className="flex items-center justify-center gap-1.5">
                    <LEDIndicator active={true} color="orange" />
                    <span className="text-[9px] text-industrial-orange font-black uppercase">PAUSED: CRISIS</span>
                </div>
            ) : (
                 !isReady && (
                    <div className="flex flex-col gap-1 items-center">
                        <div className="w-full bg-industrial-well-bg h-1 rounded-full overflow-hidden shadow-well">
                            <div className="h-full bg-industrial-blue" style={{ width: fuelLevel }}></div>
                        </div>
                        <span className="text-[9px] text-industrial-blue font-black uppercase tracking-widest">{status.weeklyContributionNeeded}/WK REQ</span>
                    </div>
                 )
            )}
        </div>
      </div>

      {/* The Silo Structure */}
      <div className={`w-full h-64 bg-industrial-well-bg border-4 ${isReady ? 'border-emerald-500/30' : 'border-industrial-border-dark/20'} rounded-t-full rounded-b-3xl relative overflow-hidden shadow-well z-10`}>
        
        {/* Fuel Liquid (Animated) */}
        <div 
          className="absolute bottom-0 w-full bg-gradient-to-t from-industrial-blue/40 to-industrial-blue/80 transition-all duration-1000 ease-out opacity-60 pointer-events-none"
          style={{ height: fuelLevel }}
        >
          {/* Bubbles */}
          <div className="w-full h-full absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent_70%)]"></div>
          <div className="w-full h-0.5 bg-white/30 absolute top-0 animate-pulse" />
        </div>

        {/* Scaffolding Lines */}
        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-5 bg-[repeating-linear-gradient(0deg,transparent,transparent_19px,#000_20px)]"></div>

        {/* The Rocket Silhouette */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 flex-col">
           <span className={`text-6xl filter drop-shadow-xl transition-all duration-500 ${isReady ? 'scale-110' : 'scale-90'}`}>
               {isPaused ? '🔒' : '🚀'}
           </span>
        </div>

        {/* Status Light */}
        <div className="absolute top-8 right-6">
            <LEDIndicator 
                active={!isPaused} 
                color={status.statusColor === 'green' ? 'green' : status.statusColor === 'amber' ? 'yellow' : 'red'} 
            />
        </div>
      </div>
      
      {/* Controls */}
      <div className="mt-4 flex flex-col gap-2 relative z-20 px-2">
          {isReady ? (
              <TactileButton 
                onClick={(e) => { e.stopPropagation(); onLaunch(); }}
                color="orange"
                fullWidth
                size="sm"
                className="animate-pulse"
              >
                  LAUNCH MISSION
              </TactileButton>
          ) : (
              !isPaused && (
                <TactileButton 
                    onClick={(e) => { e.stopPropagation(); onAddFuel(100); }} 
                    color="white"
                    size="sm"
                    className="border border-industrial-blue/20"
                >
                    + FUEL $100
                </TactileButton>
              )
          )}
      </div>

      {/* Base Label */}
      <div className="text-center mt-3">
          <div className="text-[10px] font-black text-industrial-text uppercase tracking-tight truncate px-2">{goal.name}</div>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="text-[8px] font-black text-industrial-subtext/40 uppercase tracking-widest">{goal.valueTag}</span>
              <span className="w-1 h-1 rounded-full bg-industrial-subtext/20"></span>
              <span className="text-[8px] font-black text-industrial-subtext/60 uppercase tracking-widest">{status.daysRemaining}D REM</span>
          </div>
      </div>
    </div>
  );
};
