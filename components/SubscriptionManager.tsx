
import React, { useState } from 'react';
import { Subscription, Transaction } from '../types';
import { detectSubscriptions } from '../services/geminiService';

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
        if (uniqueNew.length === 0) {
            alert("No new subscriptions detected.");
        } else {
            alert(`Found ${uniqueNew.length} new recurring payments!`);
        }
    } catch (e) {
        console.error(e);
        alert("Analysis failed.");
    }
    setAnalyzing(false);
  };

  const removeSubscription = (id: string) => {
    // 1. Trigger Animation
    setCrushedId(id);
    
    // 2. Delay actual removal to let animation play
    setTimeout(() => {
        onUpdateSubscriptions(subscriptions.filter(s => s.id !== id));
        setCrushedId(null);
        // Haptic-like feedback visual
        alert("🎉 BILL CRUSHED! Monthly burn reduced.");
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
      
      if (diffDays < 0) return { label: 'OVERDUE', color: 'text-rose-500' };
      if (diffDays <= 3) return { label: `Due in ${diffDays} days`, color: 'text-orange-400' };
      return { label: `Due ${dateStr}`, color: 'text-slate-400' };
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                Subscription Command
                {subscriptions.some(s => s.isOptimizable) && (
                    <span className="w-3 h-3 bg-rose-500 rounded-full animate-ping"></span>
                )}
            </h2>
            <p className="text-slate-400 mt-1">Manage fixed costs and identify leakage.</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center gap-4">
            <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Monthly Burn</p>
                <p className="text-2xl font-mono text-white font-bold">${totalMonthly.toFixed(2)}</p>
            </div>
            <div className="h-8 w-[1px] bg-slate-700"></div>
            <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Yearly Cost</p>
                <p className="text-lg font-mono text-slate-300">${(totalMonthly * 12).toFixed(0)}</p>
            </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            All Active
          </button>
          <button 
            onClick={() => setFilter('OPTIMIZABLE')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${filter === 'OPTIMIZABLE' ? 'bg-rose-900/30 text-rose-400 border border-rose-900' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            Optimization Opportunities
            {subscriptions.filter(s => s.isOptimizable).length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full">
                    {subscriptions.filter(s => s.isOptimizable).length}
                </span>
            )}
          </button>
          
          <div className="flex-1"></div>

          <button 
            onClick={runAnalysis}
            disabled={analyzing}
            className="bg-neon-blue text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-cyan-400 transition-colors flex items-center gap-2"
          >
            {analyzing ? 'Scanning...' : 'Auto-Detect from Transactions'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </button>
      </div>

      {/* List */}
      <div className="space-y-3">
          {displayedSubs.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl">
                  <p className="text-slate-500">No subscriptions found.</p>
                  <button onClick={runAnalysis} className="text-neon-blue hover:underline mt-2">Run auto-detection</button>
              </div>
          ) : (
              displayedSubs.map((sub) => {
                  const status = getDueDateStatus(sub.nextDueDate);
                  const isCrushing = crushedId === sub.id;
                  const category = sub.category || 'General'; // Safety fallback
                  
                  return (
                    <div 
                        key={sub.id} 
                        className={`bg-slate-800 border border-slate-700 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4 hover:border-slate-600 transition-all duration-500 group overflow-hidden relative
                        ${isCrushing ? 'scale-0 opacity-0 rotate-12 bg-red-500 border-red-500' : ''}`}
                    >
                        
                        {/* Icon/Category */}
                        <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-xl shrink-0 z-10">
                            {category.includes('Entertainment') ? '🎬' : 
                             category.includes('Gym') ? '💪' : 
                             category.includes('Insurance') ? '🛡️' : '💳'}
                        </div>

                        {/* Details */}
                        <div className="flex-1 text-center md:text-left z-10">
                            <h4 className="text-white font-bold text-lg">{sub.name}</h4>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-xs">
                                <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-300">{category}</span>
                                <span className={`font-mono ${status.color}`}>{status.label}</span>
                            </div>
                        </div>

                        {/* Cost */}
                        <div className="text-right z-10">
                            <p className="text-white font-mono font-bold text-xl">${sub.amount}</p>
                            <p className="text-slate-500 text-xs uppercase">{sub.cycle}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 z-10">
                            {sub.isOptimizable && (
                                <div className="bg-rose-900/50 text-rose-300 text-xs px-2 py-1 rounded border border-rose-800 flex items-center">
                                    Low Value?
                                </div>
                            )}
                            <button 
                                onClick={() => removeSubscription(sub.id)}
                                className="p-2 text-slate-500 hover:text-white hover:bg-rose-600 rounded-lg transition-colors"
                                title="Crush Bill"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                  );
              })
          )}
      </div>
      
      {/* Education Footer */}
      <div className="mt-8 bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-xl flex gap-4 items-start">
        <div className="text-2xl">🧠</div>
        <div>
            <h4 className="text-indigo-300 font-bold text-sm">Optimization Tip</h4>
            <p className="text-indigo-100/70 text-sm mt-1">
                BillBot flags subscriptions as "Optimizable" if they are recurring entertainment costs that exceed 5% of your discretionary income. 
                Consider rotating streaming services (subscribe for 1 month, watch everything, cancel) rather than holding all 5 simultaneously.
            </p>
        </div>
      </div>

    </div>
  );
};
