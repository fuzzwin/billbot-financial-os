
import React, { useState } from 'react';
import { FinancialHealth } from '../types';
import { TactileButton } from './ui/TactileButton';
import { RecessedInput } from './ui/RecessedInput';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

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
        <div className="max-w-2xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-10 px-2">
                <h2 className="text-4xl font-black text-industrial-text uppercase tracking-tighter">GIG ECONOMY PORT</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <LEDIndicator active={true} color="yellow" />
                  <p className="tactile-label text-industrial-subtext/60">Cargo Offload // Tax Quarantine Protocol</p>
                </div>
            </div>

            <ChassisWell label="Operational Docking Bay">
                
                {/* Vault Visual */}
                <div className="bg-industrial-well-bg p-4 rounded-xl shadow-well border border-black/5 flex justify-between items-center mb-10">
                    <div className="flex items-center gap-2">
                        <LEDIndicator active={true} color="orange" />
                        <span className="text-[10px] font-black text-industrial-subtext/60 uppercase tracking-widest">TAX VAULT [🔒]</span>
                    </div>
                    <span className="text-2xl font-black text-industrial-text tracking-tighter">${health.taxVault?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</span>
                </div>

                <div className="space-y-8">
                    <RecessedInput 
                        label="Gross Payout Identifier (AUD)"
                        type="number" 
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        placeholder="0.00"
                    />

                    <div className="h-40 relative bg-industrial-well-bg rounded-2xl shadow-well border border-black/5 flex flex-col items-center justify-center overflow-hidden">
                        {animating ? (
                            <div className="flex flex-col items-center gap-2 animate-bounce">
                                <div className="w-10 h-10 bg-industrial-orange rounded-lg shadow-lg flex items-center justify-center text-white text-[10px] font-black">TAX</div>
                                <div className="text-[8px] font-black text-industrial-orange uppercase tracking-widest">QUARANTINING...</div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center opacity-20">
                                <div className="text-4xl mb-2">🚚</div>
                                <p className="text-[9px] font-black text-industrial-subtext uppercase tracking-[0.2em]">Dock empty // Awaiting Payload</p>
                            </div>
                        )}
                        {/* Ground/Road */}
                        <div className="absolute bottom-0 w-full h-1 bg-industrial-border-dark/10 shadow-well"></div>
                    </div>

                    <TactileButton 
                        onClick={quarantineTax}
                        disabled={animating || !income}
                        color="blue"
                        fullWidth
                        size="lg"
                    >
                        {animating ? 'PROCESSING PAYLOAD...' : 'PROCESS PAYOUT (30% QUARANTINE)'}
                    </TactileButton>
                    
                    <div className="bg-industrial-well-bg/50 p-4 rounded-xl border border-black/5">
                        <p className="text-center text-[10px] text-industrial-subtext/60 font-medium leading-relaxed uppercase tracking-tight">
                            Protocol: Automated 30% retention in Tax Vault. <br/>
                            Residual <span className="text-emerald-500 font-bold">70%</span> cleared for city liquidity.
                        </p>
                    </div>
                </div>
            </ChassisWell>
        </div>
    );
};
