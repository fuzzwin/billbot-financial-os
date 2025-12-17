
import React from 'react';
import { FinancialHealth } from '../types';

interface SafeZoneShieldProps {
    health: FinancialHealth;
}

export const SafeZoneShield: React.FC<SafeZoneShieldProps> = ({ health }) => {
    // Logic for Safe Zone
    // Green: Cashflow > 0 AND Savings > 1 month expenses (Safe Runway)
    // Amber: Cashflow > 0 BUT Savings < 1 month expenses (Fragile)
    // Red: Cashflow < 0 (Bleeding)
    
    const cashflow = health.monthlyIncome - health.monthlyExpenses;
    const runway = health.savings / Math.max(1, health.monthlyExpenses);
    
    let status: 'SAFE' | 'CAUTION' | 'DANGER' = 'SAFE';
    let color = 'text-emerald-400';
    let icon = '🛡️';
    let title = 'SAFE ZONE ACTIVE';
    let msg = 'All upcoming bills covered. Reservoir filling.';
    let glow = 'shadow-[0_0_50px_rgba(52,211,153,0.3)]';
    let border = 'border-emerald-500/50';
    let bg = 'bg-emerald-950/40';

    if (cashflow < 0) {
        status = 'DANGER';
        color = 'text-rose-500';
        icon = '🚨';
        title = 'SHORTFALL DETECTED';
        msg = `You are burning $${Math.abs(cashflow)}/mo more than you earn. Action required.`;
        glow = 'shadow-[0_0_50px_rgba(244,63,94,0.3)] animate-pulse';
        border = 'border-rose-500/50';
        bg = 'bg-rose-950/40';
    } else if (runway < 1.0) {
        status = 'CAUTION';
        color = 'text-amber-400';
        icon = '⚠️';
        title = 'BUFFER THIN';
        msg = `You're positive, but savings cover < 1 month of bills. One surprise could break the city.`;
        glow = 'shadow-[0_0_50px_rgba(251,191,36,0.2)]';
        border = 'border-amber-500/50';
        bg = 'bg-amber-950/40';
    }

    return (
        <div className={`relative flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-md ${bg} ${border} ${glow} transition-all duration-500`}>
            
            {/* The Shield Icon */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className={`w-full h-full ${color}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" opacity="0.2"/>
                    <path d="M12 2.2L4.2 5.6v5.4c0 4.55 3.2 8.9 7.8 10.1 4.6-1.2 7.8-5.55 7.8-10.1V5.6L12 2.2zm0 18c-3.75-1.05-6.6-4.75-6.6-8.95V6.3l6.6-2.95 6.6 2.95v4.95c0 4.2-2.85 7.9-6.6 8.95z"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl animate-bounce">
                    {status === 'SAFE' && '✓'}
                    {status === 'CAUTION' && '!'}
                    {status === 'DANGER' && '×'}
                </div>
            </div>

            {/* Text Context */}
            <div>
                <h3 className={`font-black text-lg tracking-wider ${color}`}>{title}</h3>
                <p className="text-slate-300 text-sm leading-tight">{msg}</p>
                {status === 'SAFE' && (
                    <div className="mt-2 h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 w-[80%] rounded-full animate-pulse"></div>
                    </div>
                )}
            </div>
        </div>
    );
};
