
import React, { useState } from 'react';

export const BatteryROI: React.FC = () => {
    const [cost, setCost] = useState<number>(12000);
    const [size, setSize] = useState<number>(13.5); // kWh (e.g. Tesla Powerwall 2)
    
    // 2025 Federal Battery Rebate Logic (Hypothetical Tapering Model)
    // < 14kWh: Full Rebate ($3500)
    // > 14kWh: Reduced Rebate
    const REBATE_BASE = 3500;
    const TAPER_THRESHOLD = 14;
    
    const rebate = size <= TAPER_THRESHOLD 
        ? REBATE_BASE 
        : Math.max(0, REBATE_BASE - ((size - TAPER_THRESHOLD) * 500));

    const realCost = cost - rebate;
    const savingsPerYear = 1800; // Est. arbitrage savings
    const paybackYears = realCost / savingsPerYear;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-32 h-32 text-neon-green" fill="currentColor" viewBox="0 0 24 24"><path d="M16 9v-4l8 7-8 7v-4h-8v-6h8zm-16-7v20h14v-2h-12v-16h12v-2h-14z"/></svg>
                </div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white italic mb-2">BATTERY ROI ENGINE <span className="text-neon-green not-italic text-sm border border-neon-green px-2 rounded">2025 REBATES ACTIVE</span></h2>
                    <p className="text-slate-400 mb-8 max-w-lg">
                        Thinking of getting a battery? The 2025 Federal "Tapering" Rebate rewards systems under 14kWh. 
                        Let's calculate your real price.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">QUOTED SYSTEM COST (INSTALLED)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-400">$</span>
                                <input 
                                    type="number" 
                                    value={cost}
                                    onChange={(e) => setCost(Number(e.target.value))}
                                    className="w-full bg-slate-800 border-b-2 border-slate-600 focus:border-neon-green text-white text-2xl p-2 pl-8 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">SYSTEM SIZE (kWh)</label>
                            <input 
                                type="number" 
                                value={size}
                                onChange={(e) => setSize(Number(e.target.value))}
                                className="w-full bg-slate-800 border-b-2 border-slate-600 focus:border-neon-green text-white text-2xl p-2 outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                {size > TAPER_THRESHOLD ? '⚠️ Over 14kWh Threshold (Rebate Reduced)' : '✅ Optimal Size for Max Rebate'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-400 font-bold">2025 Federal STC Rebate</span>
                            <span className="text-neon-green font-mono font-bold text-xl">-${rebate.toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-slate-700 mb-4"></div>
                        <div className="flex justify-between items-end">
                            <span className="text-white font-black text-lg">REAL COST</span>
                            <span className="text-white font-black text-4xl">${realCost.toLocaleString()}</span>
                        </div>
                         <div className="mt-4 flex gap-2 items-center bg-slate-900 p-2 rounded text-xs text-slate-400">
                             <span>⚡ Est. Payback Period:</span>
                             <span className="text-white font-bold">{paybackYears.toFixed(1)} Years</span>
                             <span>(assuming $1,800/yr savings)</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Recommendation */}
            <div className="bg-gradient-to-r from-emerald-900/50 to-slate-900 border border-emerald-500/30 p-6 rounded-xl">
                <h3 className="text-emerald-400 font-bold mb-2">BillBot Strategy:</h3>
                {size > 14 ? (
                     <p className="text-slate-300 text-sm">
                        You are losing rebate value by going over 14kWh. Consider a 13.5kWh unit (like Powerwall 2) to claim the full ${REBATE_BASE} rebate.
                     </p>
                ) : (
                    <p className="text-slate-300 text-sm">
                        Great choice. This size maximizes the 2025 government incentive. Combined with a Virtual Power Plant (VPP) plan, you could eliminate your bill entirely.
                    </p>
                )}
            </div>
        </div>
    );
};
