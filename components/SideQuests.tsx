
import React, { useState } from 'react';
import { ChassisWell } from './ui/ChassisWell';
import { TactileButton } from './ui/TactileButton';
import { LEDIndicator } from './ui/LEDIndicator';

export const SideQuests: React.FC = () => {
    // MOCK WEATHER for demo purposes (In real app, fetch from BOM API)
    const [weather] = useState({ temp: 28, condition: 'Sunny' });
    
    // 52 Week Challenge Logic (Current week simulation)
    const mockWeek = Math.ceil((new Date().getDate() + new Date().getMonth() * 30) / 7);
    const amountToSave = 52 - mockWeek + 1; // Reverse 52 week challenge

    return (
        <div className="max-w-4xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4">
             <div className="mb-10 px-2 text-center">
                <h2 className="text-2xl md:text-4xl font-black text-industrial-text uppercase tracking-tighter">SIDE QUESTS</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <LEDIndicator active={true} color="blue" />
                  <p className="tactile-label text-industrial-subtext/60">Gamified Accumulation // V2.0</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* QUEST 1: WEATHER CHALLENGE */}
                <ChassisWell label="Dynamic Weather Station">
                    <div className="h-40 bg-industrial-well-bg rounded-2xl shadow-well border border-black/5 relative flex items-center justify-center overflow-hidden mb-6">
                        <div className="absolute inset-0 bg-industrial-blue/5 animate-pulse"></div>
                        <div className="text-7xl z-10 filter drop-shadow-md">☀️</div>
                        <div className="absolute bottom-3 right-4">
                            <span className="text-industrial-text font-black text-2xl tracking-tighter">{weather.temp}°C</span>
                            <div className="text-[8px] font-black text-industrial-subtext/40 uppercase tracking-widest text-right">EXTERNAL</div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-industrial-text uppercase tracking-tight mb-2">THERMOSTAT SYNC</h3>
                        <p className="text-industrial-subtext text-xs font-medium leading-relaxed mb-6">
                            High temp detected. Match the local environment in capital accumulation. 
                            Automatic transfer optimized for current conditions.
                        </p>
                        <div className="flex justify-between items-center bg-industrial-base p-4 rounded-xl shadow-tactile-sm border border-white/10 mb-6">
                            <span className="text-[10px] font-black text-industrial-subtext uppercase">Target Transfer</span>
                            <span className="text-industrial-blue font-black font-mono text-2xl tracking-tighter">${weather.temp}.00</span>
                        </div>
                        <TactileButton color="blue" fullWidth>
                            EXECUTE SYNC
                        </TactileButton>
                    </div>
                </ChassisWell>

                {/* QUEST 2: 52-WEEK REVERSE */}
                <ChassisWell label="Reverse Duration Challenge">
                    <div className="h-40 bg-industrial-well-bg rounded-2xl shadow-well border border-black/5 relative flex items-center justify-center overflow-hidden mb-6">
                         <div className="text-7xl z-10 filter drop-shadow-md">📅</div>
                         <div className="absolute top-4 left-4 bg-industrial-orange text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-lg">HARD MODE</div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-industrial-text uppercase tracking-tight mb-2">DEGRESSIVE ACCUMULATION</h3>
                        <p className="text-industrial-subtext text-xs font-medium leading-relaxed mb-6">
                            Front-load the effort. Save maximum early, ease off as the year matures. 
                            Currently operating in <span className="text-industrial-text font-bold uppercase tracking-tight">Cycle {mockWeek}</span>.
                        </p>
                        <div className="flex justify-between items-center bg-industrial-base p-4 rounded-xl shadow-tactile-sm border border-white/10 mb-6">
                            <span className="text-[10px] font-black text-industrial-subtext uppercase">Week {mockWeek} Load</span>
                            <span className="text-emerald-500 font-black font-mono text-2xl tracking-tighter">${amountToSave}.00</span>
                        </div>
                        <TactileButton color="white" fullWidth className="border border-industrial-border-dark/10">
                            STASH PROTOCOL
                        </TactileButton>
                    </div>
                </ChassisWell>

            </div>
        </div>
    );
};
