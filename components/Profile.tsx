import React, { useState } from 'react';
import { FinancialHealth } from '../types';

interface ProfileProps {
  health: FinancialHealth;
  onUpdate: (newHealth: FinancialHealth) => void;
}

export const Profile: React.FC<ProfileProps> = ({ health, onUpdate }) => {
  const [formData, setFormData] = useState<FinancialHealth>(health);
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;

  const handleChange = (field: keyof FinancialHealth, value: string) => {
    setFormData(prev => ({
        ...prev,
        [field]: Number(value)
    }));
  };

  const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSave = () => {
    const newScore = Math.min(100, Math.max(0, 
        (formData.savings / 2000) + 
        (formData.salarySacrifice > 0 ? 10 : 0) - 
        (formData.monthlyExpenses > formData.monthlyIncome ? 20 : 0)
    ));
    
    onUpdate({
        ...formData,
        score: Math.floor(newScore)
    });
    // Scroll to top
    window.scrollTo(0, 0);
  };

  const HelpTip = ({ title, text }: { title: string, text: string }) => (
      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 mt-2 text-xs">
          <span className="font-bold text-neon-blue block mb-1">💡 {title}</span>
          <span className="text-slate-400">{text}</span>
      </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Progress Header */}
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Let's Build Your Blueprint</h2>
            <p className="text-slate-400">Step {step} of {TOTAL_STEPS}</p>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-neon-blue to-neon-purple h-full transition-all duration-500 ease-out"
                    style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                ></div>
            </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-10 shadow-2xl relative">
            
            {/* Step 1: Income */}
            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                    <h3 className="text-xl font-bold text-white">First, tell us about money coming in.</h3>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-200 mb-2">What is your annual salary? (Before Tax)</label>
                        <input 
                            type="number" 
                            value={formData.annualSalary}
                            onChange={(e) => handleChange('annualSalary', e.target.value)}
                            className="w-full bg-slate-800 border-b-2 border-slate-600 focus:border-neon-blue text-white text-2xl py-2 outline-none transition-colors"
                            placeholder="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-200 mb-2">How much hits your bank account each month?</label>
                        <input 
                            type="number" 
                            value={formData.monthlyIncome}
                            onChange={(e) => handleChange('monthlyIncome', e.target.value)}
                            className="w-full bg-slate-800 border-b-2 border-slate-600 focus:border-neon-blue text-white text-2xl py-2 outline-none transition-colors"
                            placeholder="0"
                        />
                         <HelpTip 
                            title="Why ask both?" 
                            text="We use annual salary to estimate taxes and HECS repayments, and monthly income to help you budget day-to-day." 
                        />
                    </div>
                </div>
            )}

            {/* Step 2: Debts */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                    <h3 className="text-xl font-bold text-white">Now, let's look at what you owe.</h3>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-200 mb-2">Do you have a HECS / HELP Loan?</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-lg">$</span>
                            <input 
                                type="number" 
                                value={formData.hecsDebt}
                                onChange={(e) => handleChange('hecsDebt', e.target.value)}
                                className="flex-1 bg-slate-800 border-b-2 border-slate-600 focus:border-rose-500 text-white text-2xl py-2 outline-none transition-colors"
                            />
                        </div>
                        <HelpTip 
                            title="HECS isn't like other loans" 
                            text="It doesn't have interest, but it grows with inflation (Indexation). Knowing this helps us decide if you should pay it off early." 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-200 mb-2">Any Credit Card or Personal Loans?</label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-lg">$</span>
                            <input 
                                type="number" 
                                value={formData.otherDebts}
                                onChange={(e) => handleChange('otherDebts', e.target.value)}
                                className="flex-1 bg-slate-800 border-b-2 border-slate-600 focus:border-rose-500 text-white text-2xl py-2 outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Lifestyle */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                    <h3 className="text-xl font-bold text-white">Finally, your lifestyle.</h3>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-200 mb-2">How much cash do you have saved?</label>
                        <input 
                            type="number" 
                            value={formData.savings}
                            onChange={(e) => handleChange('savings', e.target.value)}
                            className="w-full bg-slate-800 border-b-2 border-slate-600 focus:border-emerald-500 text-white text-2xl py-2 outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-200 mb-2">What are your "Must-Have" monthly costs?</label>
                        <input 
                            type="number" 
                            value={formData.survivalNumber}
                            onChange={(e) => handleChange('survivalNumber', e.target.value)}
                            className="w-full bg-slate-800 border-b-2 border-slate-600 focus:border-orange-400 text-white text-2xl py-2 outline-none transition-colors"
                        />
                        <p className="text-slate-500 text-sm mt-1">Rent, groceries, power, internet. The bare minimum to survive.</p>
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-10">
                {step > 1 ? (
                    <button 
                        onClick={prevStep}
                        className="text-slate-400 hover:text-white font-bold px-4 py-2"
                    >
                        ← Back
                    </button>
                ) : <div></div>}

                {step < TOTAL_STEPS ? (
                    <button 
                        onClick={nextStep}
                        className="bg-neon-blue text-slate-900 font-bold px-8 py-3 rounded-full hover:bg-cyan-400 transition-transform transform hover:scale-105"
                    >
                        Next Step →
                    </button>
                ) : (
                    <button 
                        onClick={handleSave}
                        className="bg-emerald-500 text-white font-bold px-8 py-3 rounded-full hover:bg-emerald-400 transition-transform transform hover:scale-105 shadow-lg shadow-emerald-500/20"
                    >
                        Finish & Build City ✓
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};
