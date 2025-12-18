
import React, { useState } from 'react';
import { ChassisWell } from './ui/ChassisWell';
import { RecessedInput } from './ui/RecessedInput';
import { TactileButton } from './ui/TactileButton';
import { LEDIndicator } from './ui/LEDIndicator';

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
        <div className="max-w-4xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="mb-8 px-2 text-center">
                <h2 className="text-3xl font-black text-industrial-text uppercase tracking-tighter flex items-center justify-center gap-3">
                    Battery ROI Engine
                    <span className="bg-industrial-blue/10 text-industrial-blue text-[9px] border border-industrial-blue/50 px-2 py-0.5 rounded uppercase tracking-widest font-black">2025 REBATES ACTIVE</span>
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <LEDIndicator active={true} color="blue" />
                  <p className="tactile-label text-industrial-subtext/60">Federal "Tapering" Protocol // Model V1.2</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <ChassisWell label="Operational Input">
                        <div className="space-y-6">
                            <RecessedInput 
                                label="Quoted System Cost (Installed AUD)"
                                type="number" 
                                value={cost}
                                onChange={(e) => setCost(Number(e.target.value))}
                            />

                            <div className="space-y-2">
                                <RecessedInput 
                                    label="Storage Capacity (kWh)"
                                    type="number" 
                                    value={size}
                                    onChange={(e) => setSize(Number(e.target.value))}
                                />
                                <div className="flex items-center gap-2 px-1">
                                    <LEDIndicator active={size <= TAPER_THRESHOLD} color={size <= TAPER_THRESHOLD ? "green" : "orange"} />
                                    <p className="text-[10px] font-black uppercase tracking-tight text-industrial-subtext/60">
                                        {size > TAPER_THRESHOLD ? 'Over 14kWh Taper Threshold' : 'Optimal Efficiency Configuration'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ChassisWell>

                    <ChassisWell label="Strategic Advisory">
                        <div className="flex gap-4 items-start">
                            <div className="text-3xl filter drop-shadow-sm">⚡</div>
                            <div className="flex-1">
                                <h4 className="text-[11px] font-black text-industrial-text uppercase tracking-tighter mb-1">BillBot Recommendation</h4>
                                {size > 14 ? (
                                    <p className="text-industrial-subtext text-xs leading-relaxed font-medium">
                                        You are losing rebate value by exceeding the 14kWh threshold. Consider a 13.5kWh unit (like Powerwall 2) to claim the full <span className="text-industrial-blue font-bold">${REBATE_BASE}</span> rebate.
                                    </p>
                                ) : (
                                    <p className="text-industrial-subtext text-xs leading-relaxed font-medium">
                                        Optimal choice. This configuration maximizes the 2025 government incentive. Combined with a VPP (Virtual Power Plant) plan, city self-sufficiency increases by <span className="text-emerald-500 font-bold">45%</span>.
                                    </p>
                                )}
                            </div>
                        </div>
                    </ChassisWell>
                </div>

                <div className="space-y-6">
                    <ChassisWell label="Financial Projections" className="h-full">
                        <div className="space-y-8 py-4">
                            <div className="flex justify-between items-center bg-industrial-well-bg p-4 rounded-xl shadow-well border border-black/5">
                                <span className="text-[10px] font-black text-industrial-subtext uppercase">Govt STC Rebate</span>
                                <span className="text-emerald-500 font-black font-mono text-xl">-${rebate.toLocaleString()}</span>
                            </div>

                            <div className="text-center">
                                <p className="tactile-label text-industrial-subtext/60 mb-1">Adjusted Capital Outlay</p>
                                <p className="text-5xl font-black text-industrial-text tracking-tighter">${realCost.toLocaleString()}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-industrial-base p-4 rounded-xl shadow-tactile-sm border border-white/10 text-center">
                                    <p className="tactile-label text-industrial-subtext/40 mb-1">Est. Savings</p>
                                    <p className="text-lg font-black text-industrial-text font-mono">$1.8k/YR</p>
                                </div>
                                <div className="bg-industrial-base p-4 rounded-xl shadow-tactile-sm border border-white/10 text-center">
                                    <p className="tactile-label text-industrial-subtext/40 mb-1">ROI Window</p>
                                    <p className="text-lg font-black text-industrial-blue font-mono">{paybackYears.toFixed(1)}Y</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-industrial-border-dark/10">
                                <TactileButton color="blue" fullWidth>
                                    Commit to Strategy
                                </TactileButton>
                            </div>
                        </div>
                    </ChassisWell>
                </div>
            </div>
        </div>
    );
};
