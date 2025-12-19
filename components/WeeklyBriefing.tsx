
import React, { useState } from 'react';
import { AccountItem } from '../types';
import { TactileButton } from './ui/TactileButton';
import { RecessedInput } from './ui/RecessedInput';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

interface WeeklyBriefingProps {
    accounts: AccountItem[];
    onUpdateAccounts: (accounts: AccountItem[]) => void;
    onComplete: () => void;
}

export const WeeklyBriefing: React.FC<WeeklyBriefingProps> = ({ accounts, onUpdateAccounts, onComplete }) => {
    const [step, setStep] = useState(0);
    const [updatedAccounts, setUpdatedAccounts] = useState<AccountItem[]>(JSON.parse(JSON.stringify(accounts)));
    const [currentBalanceInput, setCurrentBalanceInput] = useState('');
    
    const initialNetWorth = accounts.reduce((sum, a) => sum + (['LOAN','CREDIT_CARD','HECS'].includes(a.type) ? -a.balance : a.balance), 0);
    
    const currentAccount = updatedAccounts[step];
    const isFinished = step >= updatedAccounts.length;

    const handleNext = () => {
        if (currentBalanceInput) {
            const newVal = parseFloat(currentBalanceInput);
            const newAccs = [...updatedAccounts];
            newAccs[step].balance = newVal;
            setUpdatedAccounts(newAccs);
        }
        
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-industrial-base/95 backdrop-blur-md animate-in fade-in">
                <ChassisWell className="max-w-md w-full" label="Weekly check-in">
                    <div className="text-center">
                        <div className="text-6xl mb-6 animate-bounce filter drop-shadow-sm">{isProfit ? '📈' : '📉'}</div>
                        <h2 className="text-2xl font-black text-industrial-text tracking-tight mb-2">All set</h2>
                        <p className="tactile-label text-industrial-subtext/60 mb-8">Balances updated.</p>
                        
                        <div className="bg-industrial-well-bg p-8 rounded-2xl shadow-well border-t border-l border-black/5 mb-8">
                            <p className="tactile-label text-industrial-subtext/40 mb-2">Net Value Delta</p>
                            <p className={`text-4xl font-black tracking-tighter ${isProfit ? 'text-emerald-500' : 'text-industrial-orange'}`}>
                                {isProfit ? '+' : ''}${Math.abs(diff).toLocaleString()}
                            </p>
                        </div>

                        <TactileButton 
                            onClick={handleFinish}
                            color="blue"
                            fullWidth
                            size="lg"
                        >
                            Done
                        </TactileButton>
                    </div>
                </ChassisWell>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-industrial-base/95 backdrop-blur-md animate-in fade-in">
            <ChassisWell className="max-w-md w-full" label="Update balances">
                <div className="space-y-8">
                    <div className="flex justify-between items-center bg-industrial-well-bg p-3 rounded-xl shadow-well border-t border-l border-black/5">
                        <div className="flex items-center gap-2">
                            <LEDIndicator active={true} color="blue" />
                            <h2 className="text-[10px] font-black text-industrial-text uppercase tracking-widest">Step</h2>
                        </div>
                        <span className="text-[10px] font-black text-industrial-subtext/60 uppercase tracking-widest">Account {step + 1}/{accounts.length}</span>
                    </div>

                    <div className="text-center">
                        <p className="tactile-label text-industrial-subtext/40 mb-1">{currentAccount.type}</p>
                        <h3 className="text-xl font-black text-industrial-text uppercase tracking-tight mb-6">{currentAccount.name}</h3>
                        
                        <div className="bg-industrial-well-bg p-4 rounded-xl shadow-well border-t border-l border-black/5 inline-block mb-8">
                            <p className="text-[10px] font-black text-industrial-subtext/40 uppercase mb-1">Previous balance</p>
                            <p className="text-lg font-black text-industrial-text tracking-tighter">${currentAccount.balance.toLocaleString()}</p>
                        </div>

                        <div className="space-y-4">
                            <RecessedInput 
                                autoFocus
                                type="number"
                                label="Current balance ($)"
                                value={currentBalanceInput}
                                onChange={(e) => setCurrentBalanceInput(e.target.value)}
                                placeholder="Enter updated value..."
                                className="text-center text-2xl"
                            />
                        </div>
                    </div>

                    <TactileButton 
                        onClick={handleNext}
                        color="blue"
                        fullWidth
                        size="lg"
                    >
                        {currentBalanceInput ? 'Save & next →' : 'Skip →'}
                    </TactileButton>
                </div>
            </ChassisWell>
        </div>
    );
};
