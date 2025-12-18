
import React from 'react';
import { FinancialHealth } from '../types';
import { LEDIndicator } from './ui/LEDIndicator';

interface SafeZoneShieldProps {
    health: FinancialHealth;
}

export const SafeZoneShield: React.FC<SafeZoneShieldProps> = ({ health }) => {
    const cashflow = health.monthlyIncome - health.monthlyExpenses;
    const runway = health.savings / Math.max(1, health.monthlyExpenses);
    
    let status: 'SAFE' | 'CAUTION' | 'DANGER' = 'SAFE';
    let color = 'text-emerald-500';
    let ledColor: 'green' | 'yellow' | 'red' = 'green';
    let title = 'SAFE ZONE ACTIVE';
    let msg = 'Operational burn covered. Reserves accumulating.';
    let bg = 'bg-emerald-500/5';
    let border = 'border-emerald-500/20';

    if (cashflow < 0) {
        status = 'DANGER';
        color = 'text-rose-500';
        ledColor = 'red';
        title = 'SHORTFALL DETECTED';
        msg = `System bleed: $${Math.abs(cashflow).toLocaleString()}/mo. Action required.`;
        bg = 'bg-rose-500/5';
        border = 'border-rose-500/20';
    } else if (runway < 1.0) {
        status = 'CAUTION';
        color = 'text-amber-500';
        ledColor = 'yellow';
        title = 'BUFFER CRITICAL';
        msg = `Net positive, but liquid reserves cover < 1 month. Stability fragile.`;
        bg = 'bg-amber-500/5';
        border = 'border-amber-500/20';
    }

    return (
        <div className={`relative flex items-center gap-6 p-6 rounded-[2.5rem] border ${bg} ${border} shadow-well transition-all duration-500 overflow-hidden`}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:10px_10px]"></div>

            {/* The Shield Icon / Status Indicator */}
            <div className="relative w-16 h-16 shrink-0">
                <div className={`absolute inset-0 rounded-2xl shadow-well bg-industrial-base border border-black/5 flex items-center justify-center`}>
                    <div className={`text-3xl ${status === 'DANGER' ? 'animate-pulse' : ''}`}>
                        {status === 'SAFE' && '🛡️'}
                        {status === 'CAUTION' && '⚠️'}
                        {status === 'DANGER' && '🚨'}
                    </div>
                </div>
                {/* Orbital LED */}
                <div className="absolute -top-1 -right-1">
                    <LEDIndicator active={true} color={ledColor} />
                </div>
            </div>

            {/* Text Context */}
            <div className="flex-1">
                <h3 className={`font-black text-sm uppercase tracking-widest ${color} mb-1`}>{title}</h3>
                <p className="text-industrial-subtext text-[11px] font-medium leading-relaxed">{msg}</p>
                
                {status === 'SAFE' && (
                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-industrial-well-bg rounded-full overflow-hidden shadow-well">
                            <div className="h-full bg-emerald-500 w-[80%] rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">NOMINAL</span>
                    </div>
                )}
            </div>
        </div>
    );
};
