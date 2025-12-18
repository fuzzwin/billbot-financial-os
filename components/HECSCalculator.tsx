
import React, { useState, useEffect } from 'react';
import { analyzeHECSvsMortgage } from '../services/geminiService';
import { TactileButton } from './ui/TactileButton';
import { RecessedInput } from './ui/RecessedInput';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

export const HECSCalculator: React.FC = () => {
  const [hecsBalance, setHecsBalance] = useState<number>(35000);
  const [income, setIncome] = useState<number>(65000);
  const [mortgageRate, setMortgageRate] = useState<number>(6.5);
  const [cashToDeploy, setCashToDeploy] = useState<number>(10000);
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [daysUntilFreeze, setDaysUntilFreeze] = useState(0);

  // 2025 LEGISLATION CONSTANTS
  const HECS_INDEXATION_FORECAST = 4.0; 
  const DEBT_WAIVER_PERCENT = 0.20; 
  const NEW_REPAYMENT_THRESHOLD = 67000; 
  const FREEZE_DATE = new Date('2025-06-01T00:00:00');

  useEffect(() => {
      const now = new Date();
      const diffTime = FREEZE_DATE.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilFreeze(diffDays);
  }, []);

  const runSimulation = async () => {
    setLoading(true);
    
    const waiverAmount = hecsBalance * DEBT_WAIVER_PERCENT;
    const adjustedBalance = hecsBalance - waiverAmount;
    const isBelowThreshold = income < NEW_REPAYMENT_THRESHOLD;

    let deterministicAdvice = "";
    
    if (daysUntilFreeze > 0 && daysUntilFreeze < 60) {
        deterministicAdvice = `🚨 URGENT: DO NOT PAY VOLUNTARILY YET.\n\nThe Government 'Debt Destruction' event happens in ${daysUntilFreeze} days. If you pay now, you lose the 20% waiver on that money. WAIT until June 2nd.`;
    } else if (isBelowThreshold) {
        deterministicAdvice = "STRATEGY: STOP VOLUNTARY PAYMENTS. Your income is below the new $67,000 threshold. You are not required to pay anything. Keep cash in your offset account.";
    } else if (mortgageRate > HECS_INDEXATION_FORECAST) {
        deterministicAdvice = `STRATEGY: OFFSET MORTGAGE. Your Mortgage Rate (${mortgageRate}%) is higher than the forecasted Indexation (${HECS_INDEXATION_FORECAST}%). The 20% waiver applies regardless of whether you pay now. Maximize your tax-free offset return.`;
    } else {
        deterministicAdvice = "STRATEGY: CONSIDER PAYING HECS. Only if indexation spikes above mortgage rates.";
    }

    try {
        const aiAdvice = await analyzeHECSvsMortgage(adjustedBalance, mortgageRate, cashToDeploy);
        setAnalysis(`${deterministicAdvice}\n\nBILLBOT NEURAL ANALYSIS:\n${aiAdvice}`);
    } catch (e) {
        setAnalysis(deterministicAdvice);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-24 px-2">
      
      <div className="mb-8">
          <h2 className="text-3xl font-black text-industrial-text uppercase tracking-tighter">HECS/HELP Optimizer</h2>
          <div className="flex items-center gap-2 mt-1">
            <LEDIndicator active={true} color="blue" />
            <p className="tactile-label text-industrial-subtext/60">System V3.0 // COMPLIANCE_MOD</p>
          </div>
      </div>

      {/* Countdown Banner */}
      {daysUntilFreeze > 0 && (
          <div className="bg-industrial-orange/10 border border-industrial-orange/30 rounded-2xl p-6 mb-8 flex items-center gap-6 shadow-sm">
              <div className="bg-industrial-orange text-white font-black text-3xl p-4 rounded-xl shadow-lg">
                  {daysUntilFreeze}
                  <span className="block text-[10px] font-normal tracking-widest text-center">DAYS</span>
              </div>
              <div>
                  <h3 className="text-industrial-orange font-black uppercase text-lg tracking-tighter">Delay Voluntary Payments</h3>
                  <p className="text-industrial-text text-sm font-medium leading-tight">Debt Destruction Event (20% Waiver) occurs June 1st. Claim your free capital reduction.</p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* INPUTS */}
          <ChassisWell label="Unit Parameters">
              <div className="space-y-6">
                  <RecessedInput 
                    label="Current HECS Balance" 
                    type="number" 
                    value={hecsBalance} 
                    onChange={e => setHecsBalance(Number(e.target.value))} 
                  />
                  <RecessedInput 
                    label="Annual Gross Income" 
                    type="number" 
                    value={income} 
                    onChange={e => setIncome(Number(e.target.value))} 
                  />
                  <RecessedInput 
                    label="Mortgage Offset Rate (%)" 
                    type="number" 
                    value={mortgageRate} 
                    onChange={e => setMortgageRate(Number(e.target.value))} 
                  />
                  <RecessedInput 
                    label="Liquid Capital Available" 
                    type="number" 
                    value={cashToDeploy} 
                    onChange={e => setCashToDeploy(Number(e.target.value))} 
                  />
              </div>
          </ChassisWell>

          {/* PROJECTION CARD */}
          <div className="space-y-6">
              <ChassisWell label="2025 Legislative Impact">
                  <div className="space-y-6">
                      <div className="flex justify-between items-center pb-4 border-b border-black/5">
                          <span className="tactile-label opacity-40">Statutory Waiver (20%)</span>
                          <span className="text-xl font-black text-emerald-500 tracking-tighter">-${(hecsBalance * DEBT_WAIVER_PERCENT).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-black/5">
                          <span className="tactile-label opacity-40">Adjusted Balance</span>
                          <span className="text-xl font-black text-industrial-text tracking-tighter">${(hecsBalance * (1 - DEBT_WAIVER_PERCENT)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="tactile-label opacity-40">Compulsory Payment?</span>
                          <div className="flex items-center gap-2">
                            <LEDIndicator active={income >= NEW_REPAYMENT_THRESHOLD} color={income >= NEW_REPAYMENT_THRESHOLD ? 'orange' : 'green'} />
                            <span className={`text-sm font-black uppercase tracking-tight ${income < NEW_REPAYMENT_THRESHOLD ? 'text-emerald-500' : 'text-industrial-orange'}`}>
                                {income < NEW_REPAYMENT_THRESHOLD ? 'INACTIVE ($0)' : 'ACTIVE (THRESHOLD MET)'}
                            </span>
                          </div>
                      </div>
                  </div>
              </ChassisWell>

              <TactileButton 
                onClick={runSimulation}
                disabled={loading}
                color="blue"
                fullWidth
                size="lg"
              >
                {loading ? 'Processing Model...' : 'Execute Strategic Simulation'}
              </TactileButton>
          </div>
      </div>

      {analysis && (
          <div className="mt-8">
              <ChassisWell label="Operational Intelligence Output">
                <div className="bg-industrial-well-bg p-6 rounded-xl border-l-4 border-industrial-blue shadow-well">
                    <div className="text-industrial-text text-sm font-medium leading-relaxed whitespace-pre-wrap font-sans">
                        {analysis}
                    </div>
                </div>
              </ChassisWell>
          </div>
      )}

      <div className="mt-12 px-2">
          <p className="text-[10px] font-black text-industrial-subtext/30 uppercase tracking-[0.2em] leading-relaxed">
            Reference: ATO HELP/HECS Indices 2025 // Repayment Threshold Regulation V2.1
          </p>
      </div>
    </div>
  );
};
  );
};
