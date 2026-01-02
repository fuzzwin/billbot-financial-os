
import React, { useState } from 'react';
import { AccountItem, HardshipRequest, HardshipType } from '../types';
import { generateHardshipLetter } from '../services/complianceService';
import { TactileButton } from './ui/TactileButton';
import { RecessedInput } from './ui/RecessedInput';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

interface CrisisCommandProps {
    accounts: AccountItem[];
}

export const CrisisCommand: React.FC<CrisisCommandProps> = ({ accounts }) => {
    const [mode, setMode] = useState<'TRIAGE' | 'LETTER' | 'OMBUDSMAN'>('TRIAGE');
    
    // Letter State
    const [selectedDebtId, setSelectedDebtId] = useState('');
    const [reason, setReason] = useState('');
    const [type, setType] = useState<HardshipType>('MORATORIUM');
    const [offer, setOffer] = useState('');
    const [generatedLetter, setGeneratedLetter] = useState('');

    const debts = accounts.filter(a => ['LOAN', 'CREDIT_CARD'].includes(a.type));

    const handleGenerate = () => {
        const debt = accounts.find(a => a.id === selectedDebtId);
        if (!debt) return;

        const req: HardshipRequest = {
            userName: "Account Holder", // Ideally passed from profile
            creditorName: debt.name,
            accountNumber: `REF-${debt.id.toUpperCase()}`,
            reason: reason || "reduced working hours/loss of income",
            type,
            durationMonths: 3,
            offerAmount: type === 'REDUCED_PAYMENT' ? Number(offer) : undefined
        };
        
        setGeneratedLetter(generateHardshipLetter(req));
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLetter);
        alert("Letter copied to clipboard.");
    };

    return (
        <div className="max-w-4xl mx-auto pb-24 px-1 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="bg-industrial-orange/5 border border-industrial-orange/20 p-6 md:p-8 rounded-3xl md:rounded-[3rem] mb-6 md:mb-10 flex items-center gap-6 md:gap-8 relative overflow-hidden shadow-tactile-raised border-t border-l border-white/40">
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-industrial-orange/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="text-4xl md:text-6xl z-10 filter drop-shadow-2xl">🚨</div>
                <div className="z-10">
                    <h2 className="text-xl md:text-3xl font-black text-industrial-orange uppercase tracking-tighter leading-none mb-2">CRISIS COMMAND</h2>
                    <div className="flex items-center gap-2 md:gap-3">
                        <LEDIndicator active={true} color="orange" />
                        <p className="tactile-label !text-industrial-orange/60 text-[10px] md:text-xs">Hardship Protocol // System Priority 0</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1.5 mb-6 md:mb-10 bg-industrial-well-bg p-1.5 rounded-2xl md:rounded-[2rem] shadow-well border-t border-l border-black/5 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setMode('TRIAGE')} 
                    className={`flex-1 min-w-[80px] py-3.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl transition-all duration-300 ${mode === 'TRIAGE' ? 'bg-industrial-base shadow-tactile-sm text-industrial-orange' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
                >
                    01. TRIAGE
                </button>
                <button 
                    onClick={() => setMode('LETTER')} 
                    className={`flex-1 min-w-[80px] py-3.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl transition-all duration-300 ${mode === 'LETTER' ? 'bg-industrial-base shadow-tactile-sm text-industrial-orange' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
                >
                    02. GEN
                </button>
                <button 
                    onClick={() => setMode('OMBUDSMAN')} 
                    className={`flex-1 min-w-[80px] py-3.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl transition-all duration-300 ${mode === 'OMBUDSMAN' ? 'bg-industrial-base shadow-tactile-sm text-industrial-orange' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
                >
                    03. ESC
                </button>
            </div>

            {/* TRIAGE MODE */}
            {mode === 'TRIAGE' && (
                <div className="space-y-6">
                    <ChassisWell label="Priority Triage Protocol">
                        <p className="tactile-label text-industrial-subtext/60 mb-6 uppercase tracking-wide">Optimization Logic: Survival First</p>
                        
                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 bg-industrial-base rounded-xl shadow-tactile-sm border border-white/10">
                                <div className="w-12 h-12 bg-industrial-well-bg rounded-xl flex items-center justify-center text-2xl shadow-well">🏠</div>
                                <div>
                                    <h4 className="text-sm font-black text-industrial-text uppercase tracking-tight">1. Roof & Essentials</h4>
                                    <p className="text-xs text-industrial-subtext font-medium mt-1 leading-relaxed">Rent/Mortgage, Electricity, Water, Food. Keep the lights on.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-industrial-base rounded-xl shadow-tactile-sm border border-white/10">
                                <div className="w-12 h-12 bg-industrial-well-bg rounded-xl flex items-center justify-center text-2xl shadow-well">🚗</div>
                                <div>
                                    <h4 className="text-sm font-black text-industrial-text uppercase tracking-tight">2. Critical Assets</h4>
                                    <p className="text-xs text-industrial-subtext font-medium mt-1 leading-relaxed">Car Loan (if needed for work), Phone/Internet (for job hunting).</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-industrial-orange/5 rounded-xl shadow-tactile-sm border border-industrial-orange/20">
                                <div className="w-12 h-12 bg-industrial-orange/10 rounded-xl flex items-center justify-center text-2xl shadow-well border border-industrial-orange/20">💳</div>
                                <div>
                                    <h4 className="text-sm font-black text-industrial-orange uppercase tracking-tight">3. Unsecured Debt (Wait List)</h4>
                                    <p className="text-xs text-industrial-subtext font-medium mt-1 leading-relaxed">Credit Cards, Personal Loans, BNPL. These cannot take your house.</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <LEDIndicator active={true} color="orange" />
                                        <p className="text-[10px] text-industrial-orange font-black uppercase">Strategy: Go to Step 2 to freeze these.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ChassisWell>
                </div>
            )}

            {/* LETTER GENERATOR */}
            {mode === 'LETTER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <ChassisWell label="Parameter Input">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="tactile-label px-1 text-industrial-subtext/60">Select Debt Module</label>
                                    <select 
                                        value={selectedDebtId} 
                                        onChange={(e) => setSelectedDebtId(e.target.value)}
                                        className="w-full bg-industrial-base rounded-xl px-4 py-3 text-sm font-bold text-industrial-text shadow-well outline-none appearance-none cursor-pointer border border-black/5"
                                    >
                                        <option value="">Select identifier...</option>
                                        {debts.map(d => (
                                            <option key={d.id} value={d.id}>{d.name} (${d.balance})</option>
                                        ))}
                                    </select>
                                </div>

                                <RecessedInput 
                                    label="Reason for Hardship"
                                    placeholder="e.g. reduced working hours" 
                                    value={reason} 
                                    onChange={(e) => setReason(e.target.value)}
                                />

                                <div className="space-y-1.5">
                                    <label className="tactile-label px-1 text-industrial-subtext/60">Proposed Solution</label>
                                    <div className="flex gap-2 bg-industrial-well-bg p-1 rounded-xl shadow-well border border-black/5">
                                        <button 
                                            onClick={() => setType('MORATORIUM')} 
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${type === 'MORATORIUM' ? 'bg-industrial-base shadow-tactile-sm text-industrial-blue' : 'text-industrial-subtext'}`}
                                        >
                                            Pause
                                        </button>
                                        <button 
                                            onClick={() => setType('REDUCED_PAYMENT')} 
                                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${type === 'REDUCED_PAYMENT' ? 'bg-industrial-base shadow-tactile-sm text-industrial-blue' : 'text-industrial-subtext'}`}
                                        >
                                            Reduced
                                        </button>
                                    </div>
                                    {type === 'REDUCED_PAYMENT' && (
                                        <div className="pt-2">
                                            <RecessedInput 
                                                type="number"
                                                placeholder="Affordable Amount ($)" 
                                                value={offer} 
                                                onChange={(e) => setOffer(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                                <TactileButton 
                                    onClick={handleGenerate} 
                                    color="orange" 
                                    fullWidth
                                    className="mt-4"
                                >
                                    GENERATE PROTOCOL LETTER
                                </TactileButton>
                            </div>
                        </ChassisWell>
                    </div>

                    <div className="bg-industrial-well-bg text-industrial-text p-8 rounded-[2rem] font-mono text-[11px] whitespace-pre-wrap shadow-well border border-black/5 relative overflow-auto h-[500px]">
                        <div className="absolute top-0 left-0 w-full h-10 bg-gradient-to-b from-industrial-well-bg to-transparent pointer-events-none z-10"></div>
                        <div className="pt-4">
                            {generatedLetter ? generatedLetter : <span className="text-industrial-subtext/40 italic">Configure parameters to initialize preview...</span>}
                        </div>
                        {generatedLetter && (
                             <TactileButton 
                                onClick={copyToClipboard} 
                                color="white" 
                                size="sm"
                                className="absolute top-4 right-4 z-20 shadow-tactile-sm"
                             >
                                 COPY OUTPUT
                             </TactileButton>
                        )}
                        <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-industrial-well-bg to-transparent pointer-events-none z-10"></div>
                    </div>
                </div>
            )}

            {/* OMBUDSMAN */}
            {mode === 'OMBUDSMAN' && (
                <div className="space-y-6">
                     <ChassisWell label="Escalation Protocols">
                        <h3 className="text-sm font-black text-industrial-text mb-4 uppercase tracking-tighter">Request Denied or Ignored?</h3>
                        <p className="text-xs text-industrial-subtext font-medium leading-relaxed mb-8">
                            Creditors legally must consider hardship requests. If they ignore you or unreasonably refuse, you can escalate to an External Dispute Resolution (EDR) scheme. It is free and stops legal action immediately.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a href="https://www.afca.org.au/" target="_blank" rel="noreferrer" className="bg-industrial-base p-6 rounded-xl shadow-tactile-sm border border-white/10 hover:shadow-md transition-all group text-center">
                                <h4 className="text-sm font-black text-industrial-text group-hover:text-industrial-blue uppercase tracking-tight mb-2">AFCA</h4>
                                <p className="tactile-label opacity-50">Banks, Credit, Loans</p>
                            </a>
                            <a href="https://www.ewon.com.au/" target="_blank" rel="noreferrer" className="bg-industrial-base p-6 rounded-xl shadow-tactile-sm border border-white/10 hover:shadow-md transition-all group text-center">
                                <h4 className="text-sm font-black text-industrial-text group-hover:text-industrial-blue uppercase tracking-tight mb-2">EWON / EWOV</h4>
                                <p className="tactile-label opacity-50">Energy & Water</p>
                            </a>
                            <a href="https://www.tio.com.au/" target="_blank" rel="noreferrer" className="bg-industrial-base p-6 rounded-xl shadow-tactile-sm border border-white/10 hover:shadow-md transition-all group text-center">
                                <h4 className="text-sm font-black text-industrial-text group-hover:text-industrial-blue uppercase tracking-tight mb-2">TIO</h4>
                                <p className="tactile-label opacity-50">Phone & Internet</p>
                            </a>
                        </div>
                     </ChassisWell>
                </div>
            )}

        </div>
    );
};
