
import React, { useState, useEffect } from 'react';
import { analyzeHECSvsMortgage } from '../services/geminiService';

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
      // If we are past the date, this will be negative, logic still holds (feature expires)
      const diffTime = FREEZE_DATE.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilFreeze(diffDays);
  }, []);

  const runSimulation = async () => {
    setLoading(true);
    
    const waiverAmount = hecsBalance * DEBT_WAIVER_PERCENT;
    const adjustedBalance = hecsBalance - waiverAmount;
    const isBelowThreshold = income < NEW_REPAYMENT_THRESHOLD;

    // STRATEGIC LOGIC
    let deterministicAdvice = "";
    
    // FEATURE 2: HECS FREEZE LOGIC
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
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6">
      
      {/* FEATURE 2: COUNTDOWN BANNER */}
      {daysUntilFreeze > 0 && (
          <div className="bg-gradient-to-r from-red-900 to-slate-900 border border-red-500 rounded-xl p-4 flex items-center gap-4 animate-pulse">
              <div className="bg-red-500 text-white font-black text-2xl p-3 rounded-lg">
                  {daysUntilFreeze}
                  <span className="block text-[10px] font-normal">DAYS</span>
              </div>
              <div>
                  <h3 className="text-red-400 font-black uppercase text-lg">DO NOT PAY YET</h3>
                  <p className="text-white text-sm">Debt Destruction Event (20% Waiver) occurs June 1st. Wait to claim your free money.</p>
              </div>
          </div>
      )}

      <div className="space-y-2 border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            HECS/HELP Optimizer 
            <span className="bg-neon-purple/20 text-neon-purple text-xs px-2 py-1 rounded border border-neon-purple/50">2025 LEGISLATION ACTIVE</span>
        </h2>
        <p className="text-slate-400 text-sm">
            Optimized for the "20% Debt Cut" and the new $67,000 repayment threshold.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INPUTS */}
        <div className="space-y-4">
             <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">CURRENT HECS BALANCE</label>
                <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                    <input 
                        type="number" 
                        value={hecsBalance} 
                        onChange={(e) => setHecsBalance(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 pl-8 text-white focus:border-neon-blue outline-none"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">ANNUAL INCOME (For Threshold)</label>
                <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                    <input 
                        type="number" 
                        value={income} 
                        onChange={(e) => setIncome(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 pl-8 text-white focus:border-neon-blue outline-none"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">MORTGAGE OFFSET RATE (%)</label>
                <input 
                    type="number" 
                    value={mortgageRate} 
                    onChange={(e) => setMortgageRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-neon-blue outline-none"
                />
            </div>
             <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">CASH AVAILABLE TO DEPLOY</label>
                <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">$</span>
                    <input 
                        type="number" 
                        value={cashToDeploy} 
                        onChange={(e) => setCashToDeploy(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 pl-8 text-white focus:border-neon-blue outline-none"
                    />
                </div>
            </div>
        </div>

        {/* INFO CARD */}
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex flex-col justify-center">
            <h4 className="text-slate-300 font-bold mb-4">Projected 2025 Adjustments</h4>
            
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-sm text-slate-400">Govt 20% Waiver</span>
                    <span className="text-emerald-400 font-mono font-bold">-${(hecsBalance * DEBT_WAIVER_PERCENT).toLocaleString()}</span>
                </div>
                 <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-sm text-slate-400">New Balance (Est)</span>
                    <span className="text-white font-mono font-bold">${(hecsBalance * (1 - DEBT_WAIVER_PERCENT)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Mandatory Repayment?</span>
                    <span className={`font-bold ${income < NEW_REPAYMENT_THRESHOLD ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {income < NEW_REPAYMENT_THRESHOLD ? 'NO ($0)' : 'YES (Marginal Rate)'}
                    </span>
                </div>
            </div>
        </div>
      </div>

      <button 
        onClick={runSimulation}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-lg transition-all flex justify-center items-center shadow-lg shadow-indigo-900/20"
      >
        {loading ? (
            <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                RUNNING SIMULATION...
            </span>
        ) : "RUN OPTIMIZATION STRATEGY"}
      </button>

      {analysis && (
          <div className="bg-slate-900 p-6 rounded-lg border border-neon-blue/30 animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-blue"></div>
              <h3 className="text-neon-blue font-mono mb-4 text-sm uppercase tracking-wider font-bold">Strategic Recommendation</h3>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {analysis}
              </div>
          </div>
      )}
    </div>
  );
};
