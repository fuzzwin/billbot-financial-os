
import React, { useState } from 'react';
import { AccountItem, FinancialHealth } from '../types';

interface WeeklyBriefingProps {
    accounts: AccountItem[];
    onUpdateAccounts: (accounts: AccountItem[]) => void;
    onComplete: () => void;
}

export const WeeklyBriefing: React.FC<WeeklyBriefingProps> = ({ accounts, onUpdateAccounts, onComplete }) => {
    const [step, setStep] = useState(0);
    const [updatedAccounts, setUpdatedAccounts] = useState<AccountItem[]>(JSON.parse(JSON.stringify(accounts)));
    const [currentBalanceInput, setCurrentBalanceInput] = useState('');
    
    // Calculate total net worth at start vs end
    const initialNetWorth = accounts.reduce((sum, a) => sum + (['LOAN','CREDIT_CARD','HECS'].includes(a.type) ? -a.balance : a.balance), 0);
    
    const currentAccount = updatedAccounts[step];
    const isFinished = step >= updatedAccounts.length;

    const handleNext = () => {
        if (!currentBalanceInput) {
            // Keep existing if skipped
            setCurrentBalanceInput('');
            setStep(s => s + 1);
            return;
        }

        const newVal = parseFloat(currentBalanceInput);
        const newAccs = [...updatedAccounts];
        newAccs[step].balance = newVal;
        setUpdatedAccounts(newAccs);
        
        setCurrentBalanceInput('');
        setStep(s => s + 1);
    };

    const handleFinish = () => {
        onUpdateAccounts(updatedAccounts);
        onComplete();
    };

    if (isFinished) {
        const finalNetWorth = updatedAccounts.reduce((sum, a) => sum + (['LOAN','CREDIT_CARD','HECS'].includes(a.type) ? -a.balance : a.balance), 0);
        const diff = finalNetWorth - initialNetWorth;
        const isProfit = diff >= 0;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-in fade-in">
                <div className="max-w-md w-full text-center p-8">
                    <div className="text-6xl mb-4 animate-bounce">{isProfit ? '📈' : '📉'}</div>
                    <h2 className="text-3xl font-black text-white italic mb-2">WEEKLY REPORT</h2>
                    <p className="text-slate-400 mb-8">Briefing Complete.</p>
                    
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Net Worth Change</p>
                        <p className={`text-4xl font-mono font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isProfit ? '+' : ''}{diff.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                    </div>

                    <button 
                        onClick={handleFinish}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg"
                    >
                        Apply Updates to City
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-in fade-in">
            <div className="max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-white italic">MONDAY BRIEFING</h2>
                    <span className="text-slate-500 text-sm">{step + 1} of {accounts.length}</span>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl mb-8 text-center">
                    <p className="text-slate-400 text-sm mb-2 uppercase tracking-wide">{currentAccount.type}</p>
                    <h3 className="text-2xl font-bold text-white mb-6">{currentAccount.name}</h3>
                    
                    <div className="mb-6">
                        <p className="text-xs text-slate-500 mb-1">Last Balance</p>
                        <p className="text-xl font-mono text-slate-300">${currentAccount.balance.toLocaleString()}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-emerald-400 mb-2">WHAT IS THE BALANCE TODAY?</label>
                        <input 
                            autoFocus
                            type="number"
                            value={currentBalanceInput}
                            onChange={(e) => setCurrentBalanceInput(e.target.value)}
                            placeholder="Enter current balance..."
                            className="w-full bg-slate-950 border-b-2 border-slate-600 text-center text-3xl text-white p-4 outline-none focus:border-emerald-500"
                        />
                    </div>
                </div>

                <button 
                    onClick={handleNext}
                    className="w-full bg-neon-blue text-slate-900 font-bold py-4 rounded-xl hover:bg-cyan-400 transition-colors"
                >
                    {currentBalanceInput ? 'Update & Next →' : 'No Change / Skip →'}
                </button>
            </div>
        </div>
    );
};
