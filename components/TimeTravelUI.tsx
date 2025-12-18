
import React from 'react';
import { LEDIndicator } from './ui/LEDIndicator';

interface TimeTravelUIProps {
    year: number;
    setYear: (y: number) => void;
    mode: 'DRIFT' | 'TURBO';
    setMode: (m: 'DRIFT' | 'TURBO') => void;
    netWorthDelta: number;
}

export const TimeTravelUI: React.FC<TimeTravelUIProps> = ({ year, setYear, mode, setMode, netWorthDelta }) => {
    
    const getTangibleGoal = (amount: number) => {
        if (amount > 150000) return "🏡 Full House Deposit";
        if (amount > 100000) return "💎 Financial Freedom Starter";
        if (amount > 60000) return "🏎️ Luxury Car (Cash)";
        if (amount > 40000) return "🏠 Apartment Deposit";
        if (amount > 20000) return "🌍 6-Month World Trip";
        if (amount > 10000) return "🚗 Reliable Used Car";
        if (amount > 5000) return "🎸 High-End Hobby Gear";
        return "🛡️ solid Emergency Fund";
    };

    return (
        <div className="absolute bottom-0 left-0 w-full bg-industrial-base/95 backdrop-blur-xl border-t border-industrial-border-dark/10 z-30 flex flex-col p-6 animate-in slide-in-from-bottom-10 shadow-chassis rounded-t-[2.5rem]">
            
            <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-black text-industrial-text text-sm uppercase tracking-widest">
                            {year === 2025 ? 'CHRONO: PRESENT' : `CHRONO: ${year}`}
                        </h3>
                        {year > 2025 && (
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${mode === 'TURBO' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-industrial-orange/10 border-industrial-orange/20 text-industrial-orange'}`}>
                                <LEDIndicator active={true} color={mode === 'TURBO' ? 'green' : 'orange'} />
                                <span className="text-[9px] font-black uppercase tracking-widest">{mode === 'TURBO' ? 'Turbo-Path' : 'Drift-Path'}</span>
                            </div>
                        )}
                    </div>
                    
                    {year > 2025 ? (
                        <div className="space-y-1">
                            <p className={`text-[11px] font-black tracking-tight ${netWorthDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {netWorthDelta >= 0 ? 'Δ +' : 'Δ -'}${Math.abs(netWorthDelta).toLocaleString()} PROJECTED EQUITY
                            </p>
                            {netWorthDelta > 5000 && (
                                <p className="text-[9px] font-bold text-industrial-subtext/60 flex items-center gap-1.5">
                                    <span className="uppercase tracking-widest opacity-40">Output Equivalent:</span>
                                    <span className="text-industrial-blue bg-industrial-blue/5 px-1.5 py-0.5 rounded border border-industrial-blue/10 uppercase tracking-tighter">{getTangibleGoal(netWorthDelta)}</span>
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-[10px] font-medium text-industrial-subtext/60 uppercase tracking-wide">Adjust slider to simulate future capital outcomes.</p>
                    )}
                </div>
                
                {/* Mode Toggle */}
                <div className="flex bg-industrial-well-bg p-1 rounded-xl shadow-well border border-black/5 shrink-0">
                    <button 
                        onClick={() => setMode('DRIFT')}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'DRIFT' ? 'bg-industrial-base text-industrial-orange shadow-tactile-sm' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
                    >
                        Drift
                    </button>
                    <button 
                        onClick={() => setMode('TURBO')}
                        className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'TURBO' ? 'bg-industrial-base text-emerald-500 shadow-tactile-sm' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
                    >
                        Turbo
                    </button>
                </div>
            </div>

            <div className="relative h-10 flex items-center group">
                {/* Track */}
                <div className="absolute w-full h-2 bg-industrial-well-bg rounded-full overflow-hidden shadow-well border border-black/5">
                    {/* Tick Marks */}
                    <div className="w-full h-full flex justify-between px-1">
                        {[0,1,2,3,4,5].map(i => <div key={i} className="w-[1px] h-full bg-industrial-subtext/10"></div>)}
                    </div>
                    {/* Fill */}
                    <div 
                        className={`absolute top-0 left-0 h-full transition-all duration-300 ${mode === 'TURBO' ? 'bg-emerald-500/40' : 'bg-industrial-orange/40'}`} 
                        style={{ width: `${((year - 2025) / 5) * 100}%` }}
                    ></div>
                </div>
                
                {/* Thumb Input */}
                <input 
                    type="range" 
                    min="2025" 
                    max="2030" 
                    step="1"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="absolute w-full h-12 opacity-0 cursor-pointer z-10"
                />
                
                {/* Custom Thumb Visual (Mechanical Dial Look) */}
                <div 
                    className="absolute w-8 h-8 bg-industrial-base rounded-full shadow-tactile-raised border border-white/10 pointer-events-none transition-all duration-300 flex items-center justify-center group-active:scale-90"
                    style={{ left: `calc(${((year - 2025) / 5) * 100}% - 16px)` }}
                >
                    <div className={`w-2.5 h-2.5 rounded-full ${mode === 'TURBO' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-industrial-orange shadow-[0_0_6px_#FF4F00]'}`}></div>
                    {/* Dial marker */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-industrial-subtext/20"></div>
                </div>
            </div>
            
            <div className="flex justify-between text-[9px] text-industrial-subtext/40 font-black uppercase tracking-[0.2em] mt-3 px-1">
                <span>2025</span>
                <span>2026</span>
                <span>2027</span>
                <span>2028</span>
                <span>2029</span>
                <span>2030</span>
            </div>
        </div>
    );
};
