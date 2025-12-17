
import React, { useState } from 'react';
import { AccountItem, HardshipRequest, HardshipType } from '../types';
import { generateHardshipLetter } from '../services/complianceService';

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
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="bg-red-950/30 border border-red-500/50 p-6 rounded-2xl mb-8 flex items-center gap-6 relative overflow-hidden">
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-red-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="text-6xl z-10">☎️</div>
                <div className="z-10">
                    <h2 className="text-3xl font-black text-red-500 italic tracking-tighter">CRISIS COMMAND</h2>
                    <p className="text-red-200">Financial Emergency Protocol Active.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6">
                <button onClick={() => setMode('TRIAGE')} className={`flex-1 py-3 font-bold rounded-lg transition-colors ${mode === 'TRIAGE' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    1. TRIAGE
                </button>
                <button onClick={() => setMode('LETTER')} className={`flex-1 py-3 font-bold rounded-lg transition-colors ${mode === 'LETTER' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    2. HARDSHIP GENERATOR
                </button>
                <button onClick={() => setMode('OMBUDSMAN')} className={`flex-1 py-3 font-bold rounded-lg transition-colors ${mode === 'OMBUDSMAN' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                    3. ESCALATE
                </button>
            </div>

            {/* TRIAGE MODE */}
            {mode === 'TRIAGE' && (
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-white mb-4">The Priority Hierarchy</h3>
                        <p className="text-slate-400 mb-6">When you can't pay everyone, you must pay the "Survival Bills" first. Ignore the noise.</p>
                        
                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                                <span className="text-2xl">🏠</span>
                                <div>
                                    <h4 className="font-bold text-emerald-400">1. Roof & Essentials</h4>
                                    <p className="text-sm text-slate-300">Rent/Mortgage, Electricity, Water, Food. Keep the lights on.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                                <span className="text-2xl">🚗</span>
                                <div>
                                    <h4 className="font-bold text-amber-400">2. Critical Assets</h4>
                                    <p className="text-sm text-slate-300">Car Loan (if needed for work), Phone/Internet (for job hunting).</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg opacity-80">
                                <span className="text-2xl">💳</span>
                                <div>
                                    <h4 className="font-bold text-red-400">3. Unsecured Debt (Wait List)</h4>
                                    <p className="text-sm text-slate-300">Credit Cards, Personal Loans, BNPL. These cannot take your house.</p>
                                    <p className="text-xs text-red-300 mt-1 font-bold">👉 Go to Step 2 to freeze these.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LETTER GENERATOR */}
            {mode === 'LETTER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                            <label className="block text-xs font-bold text-slate-400 mb-1">Select Debt to Freeze</label>
                            <select 
                                value={selectedDebtId} 
                                onChange={(e) => setSelectedDebtId(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none"
                            >
                                <option value="">Select a creditor...</option>
                                {debts.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} (${d.balance})</option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                            <label className="block text-xs font-bold text-slate-400 mb-1">Reason for Hardship</label>
                            <input 
                                type="text"
                                placeholder="e.g. reduced working hours, medical emergency" 
                                value={reason} 
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none"
                            />
                        </div>

                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                            <label className="block text-xs font-bold text-slate-400 mb-1">Proposed Solution</label>
                            <div className="flex gap-2 mb-2">
                                <button onClick={() => setType('MORATORIUM')} className={`flex-1 py-2 text-xs font-bold rounded ${type === 'MORATORIUM' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    Pause Payments (Moratorium)
                                </button>
                                <button onClick={() => setType('REDUCED_PAYMENT')} className={`flex-1 py-2 text-xs font-bold rounded ${type === 'REDUCED_PAYMENT' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    Reduced Payments
                                </button>
                            </div>
                            {type === 'REDUCED_PAYMENT' && (
                                <input 
                                    type="number"
                                    placeholder="Amount you can afford ($)" 
                                    value={offer} 
                                    onChange={(e) => setOffer(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none"
                                />
                            )}
                        </div>

                        <button onClick={handleGenerate} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl">
                            GENERATE LEGAL LETTER
                        </button>
                    </div>

                    <div className="bg-slate-100 text-slate-900 p-6 rounded-xl font-mono text-xs whitespace-pre-wrap shadow-xl relative overflow-auto h-[500px]">
                        {generatedLetter ? generatedLetter : <span className="text-slate-400 italic">Select options to preview letter...</span>}
                        {generatedLetter && (
                             <button onClick={copyToClipboard} className="absolute top-4 right-4 bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold hover:bg-slate-700">
                                 COPY TEXT
                             </button>
                        )}
                    </div>
                </div>
            )}

            {/* OMBUDSMAN */}
            {mode === 'OMBUDSMAN' && (
                <div className="space-y-6">
                     <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-white mb-4">Did they refuse your request?</h3>
                        <p className="text-slate-400 mb-6">
                            Creditors legally must consider hardship requests. If they ignore you or unreasonably refuse, you can escalate to an External Dispute Resolution (EDR) scheme. It is free and stops legal action immediately.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a href="https://www.afca.org.au/" target="_blank" rel="noreferrer" className="block p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors group">
                                <h4 className="font-bold text-white group-hover:text-neon-blue">AFCA</h4>
                                <p className="text-xs text-slate-400 mt-1">Banks, Credit Cards, Loans.</p>
                            </a>
                            <a href="https://www.ewon.com.au/" target="_blank" rel="noreferrer" className="block p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors group">
                                <h4 className="font-bold text-white group-hover:text-neon-blue">EWON / EWOV</h4>
                                <p className="text-xs text-slate-400 mt-1">Energy & Water Bills.</p>
                            </a>
                            <a href="https://www.tio.com.au/" target="_blank" rel="noreferrer" className="block p-4 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors group">
                                <h4 className="font-bold text-white group-hover:text-neon-blue">TIO</h4>
                                <p className="text-xs text-slate-400 mt-1">Phone & Internet Bills.</p>
                            </a>
                        </div>
                     </div>
                </div>
            )}

        </div>
    );
};
