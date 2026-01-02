
import React, { useState } from 'react';
import { FinancialHealth } from '../types';
import { TactileButton } from './ui/TactileButton';
import { RecessedInput } from './ui/RecessedInput';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

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
    window.scrollTo(0, 0);
  };

  const HelpTip = ({ title, text }: { title: string, text: string }) => (
      <div className="bg-industrial-well-bg p-5 rounded-2xl border border-white/5 mt-6 shadow-well transition-all hover:scale-[1.01]">
          <span className="text-[10px] font-black text-industrial-blue uppercase tracking-[0.15em] block mb-2">💡 {title}</span>
          <span className="text-industrial-subtext text-[11px] font-medium leading-relaxed opacity-80">{text}</span>
      </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        
        {/* Progress Header */}
        <div className="text-center mb-10 px-2">
            <h2 className="text-xl md:text-3xl font-black text-industrial-text uppercase tracking-tighter">System Configuration</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
                <LEDIndicator active={true} color="blue" />
                <p className="tactile-label text-industrial-subtext/60">Module Blueprint // Step {step} of {TOTAL_STEPS}</p>
            </div>
            
            <div className="w-full bg-industrial-well-bg h-1.5 rounded-full mt-6 overflow-hidden shadow-well border border-black/5">
                <div 
                    className="bg-industrial-blue h-full transition-all duration-500 ease-out shadow-[0_0_4px_rgba(0,85,255,0.25)]"
                    style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                ></div>
            </div>
        </div>

        <ChassisWell label={`System Parameter Initialization // PART ${step}`} className="relative">
            
            {/* Step 1: Income */}
            {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
                    <h3 className="text-sm font-black text-industrial-text uppercase tracking-tight">Revenue Stream Mapping</h3>
                    
                    <div className="space-y-6">
                        <RecessedInput 
                            label="Annual Gross Salary (Before Tax AUD)"
                            type="number" 
                            value={formData.annualSalary}
                            onChange={(e) => handleChange('annualSalary', e.target.value)}
                            placeholder="0"
                        />

                        <RecessedInput 
                            label="Monthly Net Liquid Inflow (Post-Tax)"
                            type="number" 
                            value={formData.monthlyIncome}
                            onChange={(e) => handleChange('monthlyIncome', e.target.value)}
                            placeholder="0"
                        />
                         <HelpTip 
                            title="Differential Analysis" 
                            text="Annual salary calibrates tax and HECS/HELP strategy (v2025). Monthly inflow determines operational city liquidity." 
                        />
                    </div>
                </div>
            )}

            {/* Step 2: Debts */}
            {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
                    <h3 className="text-sm font-black text-industrial-text uppercase tracking-tight">Liability Registry</h3>
                    
                    <div className="space-y-6">
                        <RecessedInput 
                            label="HECS / HELP Registry Balance"
                            type="number" 
                            value={formData.hecsDebt}
                            onChange={(e) => handleChange('hecsDebt', e.target.value)}
                            placeholder="0"
                        />
                        <HelpTip 
                            title="Indexation Protocol" 
                            text="HECS grows with inflation (CPI). v2025 legislation includes a 20% 'Debt Destruction' event and higher repayment thresholds." 
                        />

                        <RecessedInput 
                            label="Other External Liabilities (Cards/Loans)"
                            type="number" 
                            value={formData.otherDebts}
                            onChange={(e) => handleChange('otherDebts', e.target.value)}
                            placeholder="0"
                        />
                    </div>
                </div>
            )}

            {/* Step 3: Lifestyle */}
            {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8">
                    <h3 className="text-sm font-black text-industrial-text uppercase tracking-tight">Stability Parameters</h3>
                    
                    <div className="space-y-6">
                        <RecessedInput 
                            label="Liquid Reserves (Savings/Cash)"
                            type="number" 
                            value={formData.savings}
                            onChange={(e) => handleChange('savings', e.target.value)}
                            placeholder="0"
                        />

                        <RecessedInput 
                            label="Minimum Survival Burn (Monthly Essentials)"
                            type="number" 
                            value={formData.survivalNumber}
                            onChange={(e) => handleChange('survivalNumber', e.target.value)}
                            placeholder="0"
                        />
                        <p className="text-[10px] text-industrial-subtext/60 font-medium px-1">Must include: Rent/Mortgage, utilities, basic nutrients, connectivity.</p>
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-12 pt-6 border-t border-industrial-border-dark/10">
                {step > 1 ? (
                    <button 
                        onClick={prevStep}
                        className="text-industrial-subtext/60 hover:text-industrial-text font-black text-[10px] uppercase tracking-widest px-4"
                    >
                        ← Previous
                    </button>
                ) : <div></div>}

                {step < TOTAL_STEPS ? (
                    <TactileButton 
                        onClick={nextStep}
                        color="blue"
                        size="md"
                    >
                        Next Module →
                    </TactileButton>
                ) : (
                    <TactileButton 
                        onClick={handleSave}
                        color="orange"
                        size="md"
                    >
                        Initialize Grid ✓
                    </TactileButton>
                )}
            </div>
        </ChassisWell>
    </div>
  );
};
