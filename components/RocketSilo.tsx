
import React, { useState } from 'react';
import { Goal } from '../types';
import { useGoalCalculator } from '../hooks/useGoalCalculator';

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
        className={`relative w-36 h-80 transition-all duration-300 ${isPaused ? 'opacity-50 grayscale' : 'hover:-translate-y-2'}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
    >
      {/* Tooltip Overlay */}
      <div className={`absolute -top-20 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-xs p-3 rounded-lg shadow-xl z-50 pointer-events-none transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'} w-48 text-center`}>
        <div className="font-bold text-white mb-1">{goal.name}</div>
        <div className="font-mono text-slate-300 mb-1">${goal.currentAmount} / ${goal.targetAmount}</div>
        {isPaused ? (
            <div className="text-rose-400 font-bold uppercase">PAUSED (CRISIS MODE)</div>
        ) : (
             !isReady && <div className="text-cyan-400 font-bold">Needs ${status.weeklyContributionNeeded}/wk</div>
        )}
      </div>

      {/* The Silo Structure */}
      <div className={`w-full h-56 bg-slate-800/50 border-2 ${isReady ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-slate-600'} rounded-t-full rounded-b-lg relative overflow-hidden backdrop-blur-sm z-10`}>
        
        {/* Fuel Liquid (Animated) */}
        <div 
          className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-900 to-cyan-500 transition-all duration-1000 ease-out opacity-80 pointer-events-none"
          style={{ height: fuelLevel }}
        >
          {/* Bubbles */}
          <div className="w-full h-full absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent_70%)]"></div>
          <div className="w-full h-2 bg-white/20 absolute top-0 animate-pulse" />
        </div>

        {/* Scaffolding Lines */}
        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_19px,#fff_20px)]"></div>

        {/* The Rocket Silhouette */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 flex-col">
           <span className={`text-5xl filter drop-shadow-lg transition-transform duration-500 ${isReady ? 'animate-bounce' : ''}`}>🚀</span>
           {isPaused && <span className="text-4xl absolute">🔒</span>}
        </div>

        {/* Status Light */}
        <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
          isPaused ? 'bg-slate-500' :
          status.statusColor === 'green' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 
          status.statusColor === 'amber' ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
        }`} />
      </div>
      
      {/* Controls - INCREASED Z-INDEX and moved out of flow if needed */}
      <div className="mt-3 flex flex-col gap-2 relative z-20">
          {isReady ? (
              <button 
                onClick={(e) => { e.stopPropagation(); onLaunch(); }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded shadow-lg animate-pulse cursor-pointer active:scale-95 transition-transform"
              >
                  LAUNCH MISSION
              </button>
          ) : (
              !isPaused && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onAddFuel(100); }} 
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold py-2 rounded border border-slate-700 cursor-pointer active:scale-95 transition-transform"
                >
                    + Fuel $100
                </button>
              )
          )}
      </div>

      {/* Base Label */}
      <div className="text-center mt-1">
          <div className="text-white font-bold text-sm truncate">{goal.name}</div>
          <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">{goal.valueTag}</div>
          <div className="font-mono text-[10px] text-slate-500">
            {status.daysRemaining} Days to Launch
          </div>
      </div>
    </div>
  );
};
