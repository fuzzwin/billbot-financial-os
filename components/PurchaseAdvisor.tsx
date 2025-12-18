
import React, { useState } from 'react';
import { FinancialHealth } from '../types';
import { adviseOnPurchase } from '../services/geminiService';
import { TactileButton } from './ui/TactileButton';
import { RecessedInput } from './ui/RecessedInput';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

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
            <TactileButton 
                onClick={() => setIsOpen(true)}
                color="white"
                fullWidth
                size="lg"
                className="!py-8 !rounded-[2rem] border border-industrial-blue/20 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-industrial-blue/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <div className="relative flex flex-col items-center gap-2">
                    <span className="text-3xl mb-1">🛍️</span>
                    <span className="text-sm font-black text-industrial-text tracking-widest uppercase">Asset Scanner // Advisor</span>
                    <div className="flex items-center gap-1.5">
                        <LEDIndicator active={true} color="blue" />
                        <span className="text-[9px] text-industrial-subtext/40 font-black uppercase tracking-[0.2em]">Operational Logic: Active</span>
                    </div>
                </div>
            </TactileButton>
        );
    }

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-industrial-base/95 backdrop-blur-sm animate-in fade-in">
            <ChassisWell className="w-full max-w-md relative" label="Neural Asset Scanner">
                <button onClick={reset} className="absolute top-4 right-6 text-industrial-subtext/60 hover:text-industrial-text text-xl">✕</button>
                
                {!verdict ? (
                    <div className="space-y-6 pt-4">
                        <RecessedInput 
                            autoFocus
                            label="Module Identifier"
                            placeholder="e.g. MacBook Pro, Steel Cap Boots"
                            value={item}
                            onChange={e => setItem(e.target.value)}
                        />
                        <RecessedInput 
                            label="Acquisition Cost ($)"
                            type="number" 
                            placeholder="0.00"
                            value={cost}
                            onChange={e => setCost(e.target.value)}
                        />

                        {/* WORK TOGGLE */}
                        <div className="flex items-center gap-4 bg-industrial-well-bg p-4 rounded-2xl shadow-well border border-black/5">
                             <input 
                                type="checkbox" 
                                checked={isWorkRelated} 
                                onChange={e => setIsWorkRelated(e.target.checked)}
                                className="w-6 h-6 rounded-lg accent-industrial-blue cursor-pointer"
                            />
                            <div>
                                <p className="text-[11px] font-black text-industrial-text uppercase tracking-tight">Professional Utility</p>
                                <p className="text-[9px] text-industrial-subtext/60 font-medium uppercase tracking-widest">Enable 2025 Depreciation Logic</p>
                            </div>
                        </div>

                        {isWorkRelated && numericCost > 0 && (
                            <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Est. Tax Credit</span>
                                    <span className="text-emerald-500 font-black font-mono">+$${estimatedRefund.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between items-end border-t border-emerald-500/10 pt-3">
                                    <span className="text-[10px] font-black text-industrial-text uppercase tracking-widest">Effective Cost</span>
                                    <span className="text-industrial-text font-black font-mono text-2xl tracking-tighter">${realCost.toFixed(0)}</span>
                                </div>
                                <p className="text-[8px] text-industrial-subtext/40 font-medium mt-3 uppercase tracking-tight leading-relaxed">
                                    *Analysis: Claim over 2-3 years @ avg marginal rate (32.5%).
                                </p>
                            </div>
                        )}

                        <TactileButton 
                            onClick={handleCheck}
                            disabled={loading || !item || !cost}
                            color="blue"
                            fullWidth
                            size="lg"
                            className="mt-6"
                        >
                            {loading ? 'CONSULTING GRID NEURAL...' : 'EXECUTE FEASIBILITY SCAN'}
                        </TactileButton>
                    </div>
                ) : (
                    <div className="text-center py-6 space-y-6 animate-in zoom-in-95">
                        <div className="text-6xl mb-4 filter drop-shadow-lg">
                            {verdict.includes("Green Light") ? "🟢" : verdict.includes("Red Light") ? "🔴" : "🟡"}
                        </div>
                        <div className="bg-industrial-well-bg p-6 rounded-2xl shadow-well border border-black/5 text-left">
                            <h3 className="text-sm font-black text-industrial-text uppercase tracking-tight mb-3">
                                {verdict.includes("Green Light") ? "VERDICT: ACCUMULATE" : verdict.includes("Red Light") ? "VERDICT: ABORT" : "VERDICT: CAUTION"}
                            </h3>
                            <p className="text-industrial-subtext text-xs font-medium leading-relaxed">{verdict.split('.').slice(1).join('.')}</p>
                        </div>
                        <button 
                            onClick={() => { setVerdict(null); setItem(''); setCost(''); setIsWorkRelated(false); }}
                            className="tactile-label text-industrial-subtext/60 hover:text-industrial-text underline decoration-2 underline-offset-4"
                        >
                            Scan another item
                        </button>
                    </div>
                )}
            </ChassisWell>
        </div>
    );
}
