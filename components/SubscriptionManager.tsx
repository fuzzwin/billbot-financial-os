
import React, { useState } from 'react';
import { Subscription, Transaction } from '../types';
import { detectSubscriptions } from '../services/geminiService';
import { TactileButton } from './ui/TactileButton';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

interface SubscriptionManagerProps {
    transactions: Transaction[];
    subscriptions: Subscription[];
    onUpdateSubscriptions: (subs: Subscription[]) => void;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ 
    transactions, 
    subscriptions, 
    onUpdateSubscriptions 
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'OPTIMIZABLE'>('ALL');
  const [crushedId, setCrushedId] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (transactions.length === 0) {
        alert("Please import transactions via the 'Scan Bills' tab first.");
        return;
    }
    setAnalyzing(true);
    try {
        const detected = await detectSubscriptions(transactions);
        const existingNames = new Set(subscriptions.map(s => s.name.toLowerCase()));
        const uniqueNew = detected.filter(s => !existingNames.has(s.name.toLowerCase()));
        
        const combined = [...subscriptions, ...uniqueNew];
        onUpdateSubscriptions(combined);
    } catch (e) {
        console.error(e);
    }
    setAnalyzing(false);
  };

  const removeSubscription = (id: string) => {
    setCrushedId(id);
    setTimeout(() => {
        onUpdateSubscriptions(subscriptions.filter(s => s.id !== id));
        setCrushedId(null);
    }, 600);
  };

  const totalMonthly = subscriptions.reduce((acc, s) => {
      if (s.cycle === 'WEEKLY') return acc + (s.amount * 4);
      if (s.cycle === 'YEARLY') return acc + (s.amount / 12);
      return acc + s.amount;
  }, 0);

  const displayedSubs = filter === 'ALL' 
    ? subscriptions 
    : subscriptions.filter(s => s.isOptimizable);

  const getDueDateStatus = (dateStr: string) => {
      const due = new Date(dateStr);
      const today = new Date();
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return { label: 'OVERDUE', color: 'text-rose-600' };
      if (diffDays <= 3) return { label: `T-${diffDays}d`, color: 'text-industrial-orange' };
      return { label: `DUE: ${dateStr}`, color: 'text-industrial-subtext/60' };
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-24">
      
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-6 px-2">
        <div>
            <h2 className="text-3xl font-black text-industrial-text uppercase tracking-tighter">Recurring Cost Command</h2>
            <div className="flex items-center gap-2 mt-1">
              <LEDIndicator active={subscriptions.some(s => s.isOptimizable)} color="red" label="Leakage Detected" />
              <p className="tactile-label text-industrial-subtext/60">V2.5 // SUBSCRIPTION_MOD</p>
            </div>
        </div>
        
        <ChassisWell className="!p-4" label="Discretionary Burn">
            <div className="flex items-center gap-6">
                <div>
                    <p className="tactile-label text-industrial-subtext/60 mb-0.5">Monthly</p>
                    <p className="text-2xl font-black text-industrial-text tracking-tighter">${totalMonthly.toFixed(0)}</p>
                </div>
                <div className="h-10 w-[1px] bg-industrial-well-shadow-light/50 shadow-well"></div>
                <div>
                    <p className="tactile-label text-industrial-subtext/60 mb-0.5">Projected Annual</p>
                    <p className="text-lg font-black text-industrial-subtext/60 tracking-tighter">${(totalMonthly * 12).toFixed(0)}</p>
                </div>
            </div>
        </ChassisWell>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap gap-4 mb-8 bg-industrial-well-bg p-2 rounded-2xl shadow-well border-t border-l border-black/5">
          <TactileButton 
            onClick={() => setFilter('ALL')}
            size="sm"
            color={filter === 'ALL' ? 'blue' : 'white'}
          >
            All Registers
          </TactileButton>
          <TactileButton 
            onClick={() => setFilter('OPTIMIZABLE')}
            size="sm"
            color={filter === 'OPTIMIZABLE' ? 'orange' : 'white'}
            className="flex items-center gap-2"
          >
            Efficiency Mode
            {subscriptions.filter(s => s.isOptimizable).length > 0 && (
                <span className="bg-white/20 px-1.5 rounded text-[10px]">
                    {subscriptions.filter(s => s.isOptimizable).length}
                </span>
            )}
          </TactileButton>
          
          <div className="flex-1 min-w-[20px]"></div>

          <TactileButton 
            onClick={runAnalysis}
            disabled={analyzing}
            color="white"
            size="sm"
            className="border border-industrial-blue/20"
          >
            {analyzing ? 'Scanning...' : 'AI Auto-Detect'}
          </TactileButton>
      </div>

      {/* List */}
      <div className="space-y-4">
          {displayedSubs.length === 0 ? (
              <div className="text-center py-20 bg-industrial-well-bg rounded-[2rem] shadow-well border-2 border-dashed border-industrial-border-dark/50">
                  <p className="tactile-label text-industrial-subtext/60 mb-4">No active subscriptions detected</p>
                  <TactileButton onClick={runAnalysis} color="blue">Initialize Scanner</TactileButton>
              </div>
          ) : (
              displayedSubs.map((sub) => {
                  const status = getDueDateStatus(sub.nextDueDate);
                  const isCrushing = crushedId === sub.id;
                  const category = sub.category || 'General';
                  
                  return (
                    <div 
                        key={sub.id} 
                        className={`bg-industrial-base p-4 rounded-xl flex flex-col md:flex-row items-center gap-6 shadow-tactile-sm border-t border-l border-white/10 transition-all duration-500 relative overflow-hidden
                        ${isCrushing ? 'scale-0 opacity-0 rotate-12 bg-industrial-orange' : ''}`}
                    >
                        {/* Icon Container */}
                        <div className="w-14 h-14 bg-industrial-well-bg rounded-xl flex items-center justify-center text-2xl shadow-well shrink-0">
                            {category.includes('Entertainment') ? '🎬' : 
                             category.includes('Gym') ? '💪' : 
                             category.includes('Insurance') ? '🛡️' : '💳'}
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center md:text-left">
                            <h4 className="text-sm font-black text-industrial-text uppercase tracking-tighter mb-1">{sub.name}</h4>
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                <span className="tactile-label text-industrial-blue">{category}</span>
                                <span className={`tactile-label ${status.color}`}>{status.label}</span>
                            </div>
                        </div>

                        {/* Cost */}
                        <div className="text-right flex flex-col items-center md:items-end">
                            <p className="text-xl font-black text-industrial-text tracking-tighter">${sub.amount.toFixed(2)}</p>
                            <p className="tactile-label text-industrial-subtext/60">{sub.cycle}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            {sub.isOptimizable && (
                                <div className="bg-industrial-orange/10 border border-industrial-orange/20 p-2 rounded-lg">
                                    <LEDIndicator active={true} color="red" label="LOW VALUE" />
                                </div>
                            )}
                            <TactileButton 
                                onClick={() => removeSubscription(sub.id)}
                                color="white"
                                className="!p-2.5 group hover:bg-industrial-orange hover:text-white transition-colors"
                                title="Terminate Subscription"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </TactileButton>
                        </div>
                    </div>
                  );
              })
          )}
      </div>
      
      {/* Education Footer */}
      <div className="mt-12">
        <ChassisWell label="Operational Protocol">
            <div className="flex gap-6 items-start">
                <div className="text-3xl filter drop-shadow-sm">🧠</div>
                <div className="flex-1">
                    <h4 className="text-sm font-black text-industrial-text uppercase tracking-tighter mb-2">Cost Optimization Strategy</h4>
                    <p className="text-industrial-subtext text-xs leading-relaxed font-medium">
                        Subscriptions exceeding 5% of discretionary income are flagged as "Optimizable". 
                        Recommend rotating high-burn digital services on a per-use basis rather than maintaining simultaneous concurrent contracts. 
                        Target: <span className="text-industrial-orange font-bold">Minimum viable burn.</span>
                    </p>
                </div>
            </div>
        </ChassisWell>
      </div>

    </div>
  );
};
