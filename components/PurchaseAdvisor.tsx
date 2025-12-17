
import React, { useState } from 'react';
import { FinancialHealth } from '../types';
import { adviseOnPurchase } from '../services/geminiService';
import { searchEffectiveLife } from '../services/complianceService';

interface PurchaseAdvisorProps {
    health: FinancialHealth;
}

export const PurchaseAdvisor: React.FC<PurchaseAdvisorProps> = ({ health }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [item, setItem] = useState('');
    const [cost, setCost] = useState('');
    const [isWorkRelated, setIsWorkRelated] = useState(false);
    const [verdict, setVerdict] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // FEATURE 3: ASSET SCANNER LOGIC
    // Estimate Tax Refund based on cost and marginal rate (assumed 32.5% for avg user)
    // In a full app, this would use the precise effective life, but for the "Scanner" UX,
    // users want immediate "Money Back" numbers.
    const numericCost = parseFloat(cost) || 0;
    const marginalRate = 0.325; 
    const estimatedRefund = isWorkRelated ? numericCost * marginalRate : 0;
    const realCost = numericCost - estimatedRefund;

    const handleCheck = async () => {
        if (!item || !cost) return;
        setLoading(true);
        const result = await adviseOnPurchase(health, Number(cost), item);
        setVerdict(result);
        setLoading(false);
    }

    const reset = () => {
        setVerdict(null);
        setItem('');
        setCost('');
        setIsWorkRelated(false);
        setIsOpen(false);
    }

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="w-full bg-gradient-to-r from-neon-purple to-indigo-600 text-white font-black text-xl italic py-6 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform border border-white/10 relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center justify-center gap-3">
                    🛍️ ASSET SCANNER / ADVISOR
                </span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                <button onClick={reset} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                
                <h2 className="text-2xl font-black text-white mb-6 italic text-center">THE SCANNER</h2>
                
                {!verdict ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400">ITEM NAME</label>
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="e.g. MacBook Pro, Steel Cap Boots"
                                value={item}
                                onChange={e => setItem(e.target.value)}
                                className="w-full bg-slate-800 border-b-2 border-slate-600 text-white text-lg p-2 outline-none focus:border-neon-purple"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400">PRICE TAG</label>
                            <div className="relative">
                                <span className="absolute left-2 top-2 text-slate-500">$</span>
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    value={cost}
                                    onChange={e => setCost(e.target.value)}
                                    className="w-full bg-slate-800 border-b-2 border-slate-600 text-white text-lg p-2 pl-6 outline-none focus:border-neon-purple"
                                />
                            </div>
                        </div>

                        {/* FEATURE 3: WORK TOGGLE */}
                        <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
                             <input 
                                type="checkbox" 
                                checked={isWorkRelated} 
                                onChange={e => setIsWorkRelated(e.target.checked)}
                                className="w-5 h-5 accent-emerald-500"
                            />
                            <div>
                                <p className="text-white font-bold text-sm">Is this for work?</p>
                                <p className="text-xs text-slate-400">Unlocks 2025 Tax Depreciation logic.</p>
                            </div>
                        </div>

                        {isWorkRelated && numericCost > 0 && (
                            <div className="bg-emerald-900/30 border border-emerald-500/30 p-4 rounded-lg animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-emerald-400 font-bold text-sm">ESTIMATED TAX REFUND</span>
                                    <span className="text-emerald-400 font-mono font-bold">+${estimatedRefund.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between items-end border-t border-emerald-500/30 pt-2">
                                    <span className="text-white font-black">REAL COST</span>
                                    <span className="text-white font-mono font-black text-xl">${realCost.toFixed(0)}</span>
                                </div>
                                <p className="text-[10px] text-emerald-200/60 mt-2">
                                    *Assumes effective life depreciation claim over 2-3 years at avg marginal rate.
                                </p>
                            </div>
                        )}

                        <button 
                            onClick={handleCheck}
                            disabled={loading || !item || !cost}
                            className="w-full bg-neon-purple text-white font-bold py-4 rounded-xl mt-4 hover:bg-purple-600 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'CONSULTING THE CITY...' : 'RUN AFFORDABILITY CHECK'}
                        </button>
                    </div>
                ) : (
                    <div className="text-center space-y-4 animate-in zoom-in-95">
                        <div className="text-6xl mb-2">
                            {verdict.includes("Green Light") ? "🟢" : verdict.includes("Red Light") ? "🔴" : "🟡"}
                        </div>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <p className="text-lg font-bold text-white mb-2">{verdict.split('.')[0]}.</p>
                            <p className="text-slate-400 text-sm">{verdict.split('.').slice(1).join('.')}</p>
                        </div>
                        <button 
                            onClick={reset}
                            className="text-slate-400 hover:text-white text-sm underline"
                        >
                            Scan another item
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
