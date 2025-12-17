
import React from 'react';

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
        <div className="absolute bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 z-30 flex flex-col p-4 animate-in slide-in-from-bottom-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center text-white mb-4">
                <div>
                    <h3 className="font-black italic text-lg flex items-center gap-2">
                        {year === 2025 ? 'PRESENT DAY' : `YEAR ${year}`}
                        {year > 2025 && (
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${mode === 'TURBO' ? 'bg-emerald-500 text-slate-900' : 'bg-orange-500 text-slate-900'}`}>
                                {mode === 'TURBO' ? 'Optimized Path' : 'Current Path'}
                            </span>
                        )}
                    </h3>
                    {year > 2025 ? (
                        <div className="flex flex-col">
                            <p className={`text-xs font-mono font-bold ${netWorthDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {netWorthDelta >= 0 ? '▲' : '▼'} Net Worth: {netWorthDelta >= 0 ? '+' : ''}${netWorthDelta.toLocaleString()}
                            </p>
                            {netWorthDelta > 5000 && (
                                <p className="text-xs text-indigo-400 font-bold mt-1 flex items-center gap-1">
                                    <span>✨ EQUIVALENT TO:</span>
                                    <span className="text-white bg-indigo-600/50 px-1 rounded border border-indigo-500/50">{getTangibleGoal(netWorthDelta)}</span>
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500">Drag slider to simulate future outcomes.</p>
                    )}
                </div>
                
                {/* Mode Toggle */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button 
                        onClick={() => setMode('DRIFT')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'DRIFT' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Drift
                    </button>
                    <button 
                        onClick={() => setMode('TURBO')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'TURBO' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        Turbo
                    </button>
                </div>
            </div>

            <div className="relative h-8 flex items-center">
                {/* Track */}
                <div className="absolute w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    {/* Tick Marks */}
                    <div className="w-full h-full flex justify-between px-2">
                        {[0,1,2,3,4,5].map(i => <div key={i} className="w-px h-full bg-slate-600/50"></div>)}
                    </div>
                    {/* Fill */}
                    <div 
                        className={`absolute top-0 left-0 h-full transition-all duration-300 ${mode === 'TURBO' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gradient-to-r from-orange-500 to-red-500'}`} 
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
                
                {/* Custom Thumb Visual */}
                <div 
                    className="absolute w-6 h-6 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] border-2 border-slate-900 pointer-events-none transition-all duration-300 flex items-center justify-center"
                    style={{ left: `calc(${((year - 2025) / 5) * 100}% - 12px)` }}
                >
                    <div className={`w-2 h-2 rounded-full ${mode === 'TURBO' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                </div>
            </div>
            
            <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold mt-2 uppercase tracking-widest">
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
