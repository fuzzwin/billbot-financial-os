
import React, { useState } from 'react';
import { FinancialHealth } from '../types';

interface GigPortProps {
    health: FinancialHealth;
    onUpdateHealth: (h: FinancialHealth) => void;
}

export const GigPort: React.FC<GigPortProps> = ({ health, onUpdateHealth }) => {
    const [income, setIncome] = useState('');
    const [animating, setAnimating] = useState(false);

    const quarantineTax = () => {
        const gross = parseFloat(income);
        if (!gross) return;
        
        setAnimating(true);
        setTimeout(() => {
            const tax = gross * 0.30;
            onUpdateHealth({
                ...health,
                taxVault: (health.taxVault || 0) + tax,
                savings: health.savings + (gross - tax) // Only net hits savings
            });
            setIncome('');
            setAnimating(false);
            alert(`$${tax.toFixed(2)} moved to Tax Vault. $${(gross - tax).toFixed(2)} is safe to spend.`);
        }, 2000);
    };

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-white italic">GIG ECONOMY PORT</h2>
                <p className="text-slate-400 mt-2">Received a payout? Dock here to separate your tax.</p>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 relative overflow-hidden">
                
                {/* Vault Visual */}
                <div className="absolute top-4 right-4 flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tax Vault</span>
                    <span className="text-2xl font-mono text-emerald-400 font-bold">🔒 ${health.taxVault?.toFixed(2) || '0.00'}</span>
                </div>

                <div className="mt-8 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400">GROSS PAYOUT (Uber/DoorDash/Freelance)</label>
                        <div className="relative mt-2">
                            <span className="absolute left-4 top-4 text-slate-500 text-xl">$</span>
                            <input 
                                type="number" 
                                value={income}
                                onChange={(e) => setIncome(e.target.value)}
                                className="w-full bg-slate-950 border-b-2 border-slate-700 p-4 pl-10 text-3xl text-white outline-none focus:border-neon-blue"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="h-32 relative bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                        {animating ? (
                            <div className="absolute w-12 h-8 bg-yellow-500 rounded animate-[smoke_2s_linear_forwards] flex items-center justify-center text-xs font-bold text-black shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                                TAX
                            </div>
                        ) : (
                            <p className="text-slate-600 text-sm">Truck waiting for cargo...</p>
                        )}
                        {/* Road */}
                        <div className="absolute bottom-0 w-full h-1 bg-slate-700"></div>
                    </div>

                    <button 
                        onClick={quarantineTax}
                        disabled={animating || !income}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-lg"
                    >
                        {animating ? 'QUARANTINING...' : 'PROCESS PAYOUT (30% TAX)'}
                    </button>
                    
                    <p className="text-center text-xs text-slate-500">
                        We automatically hide 30% of this income so you don't accidentally spend it.
                    </p>
                </div>
            </div>
        </div>
    );
};
