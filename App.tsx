
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { AppView, FinancialHealth, Transaction, Subscription, AccountItem, ImpulseItem, Goal, AccountType, Bill, BillCategory } from './types';
import { IsometricCity } from './components/IsometricCity';
import { WeeklyBriefing } from './components/WeeklyBriefing';
import { loadFinancialHealth, saveFinancialHealth, loadTransactions, saveTransactions, loadSubscriptions, saveSubscriptions, loadAccounts, saveAccounts, loadImpulseItems, saveImpulseItems, loadGoals, saveGoals, loadBills, saveBills } from './services/storageService';

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-8">
          <div className="bg-red-900/20 border border-red-500 rounded-2xl p-8 max-w-2xl w-full">
              <h1 className="text-3xl font-black text-red-500 mb-4">SYSTEM ERROR</h1>
              <p className="mb-4 text-slate-300">Something went wrong. Let's get you back on track.</p>
              <pre className="bg-slate-950 p-4 rounded-lg text-xs font-mono text-red-300 overflow-auto border border-red-900/50 mb-6">
                {this.state.error?.toString()}
              </pre>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl"
              >
                RESTART
              </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- DUMMY DATA FOR VISUALIZATION ---
const DUMMY_ACCOUNTS: AccountItem[] = [
  { id: '1', name: 'Everyday Account', type: 'CASH', balance: 3450.50 },
  { id: '2', name: 'Savings', type: 'SAVINGS', balance: 18500.00 },
  { id: '3', name: 'Investments', type: 'INVESTMENT', balance: 12200.00 },
  { id: '4', name: 'Super', type: 'SUPER', balance: 52000.00 },
  { id: '5', name: 'Credit Card', type: 'CREDIT_CARD', balance: 1250.00, interestRate: 20.99 },
  { id: '6', name: 'HECS Debt', type: 'HECS', balance: 24000.00 },
];

const DUMMY_SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', name: 'Netflix', amount: 22.99, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], category: 'Entertainment', isOptimizable: false },
  { id: 's2', name: 'Gym Membership', amount: 79.80, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], category: 'Health', isOptimizable: true },
  { id: 's3', name: 'Spotify', amount: 12.99, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0], category: 'Entertainment', isOptimizable: false },
];

const DUMMY_GOALS: Goal[] = [
  { id: 'g1', name: 'Japan Trip', targetAmount: 8000, currentAmount: 3200, deadline: '2026-03-01', category: 'travel', valueTag: 'Adventure', goalType: 'rocket', createdAt: new Date().toISOString(), emoji: '🌏' },
  { id: 'g2', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 10000, deadline: '2025-12-01', category: 'emergency', valueTag: 'Security', goalType: 'rocket', createdAt: new Date().toISOString(), emoji: '🛡️' },
  { id: 'g3', name: 'PS5 Pro', targetAmount: 1200, currentAmount: 850, category: 'gadget', valueTag: 'Treat', goalType: 'impulse', weeklyTarget: 50, createdAt: new Date().toISOString(), emoji: '🎮' },
];

const DUMMY_BILLS: Bill[] = [
  { id: 'b1', name: 'Rent', amount: 2200, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], category: 'RENT', isAutoPay: true },
  { id: 'b2', name: 'AGL Electricity', amount: 180, cycle: 'QUARTERLY', nextDueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], category: 'UTILITIES', isAutoPay: false },
  { id: 'b3', name: 'Telstra Internet', amount: 89, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0], category: 'PHONE_INTERNET', isAutoPay: true },
  { id: 'b4', name: 'NRMA Car Insurance', amount: 1200, cycle: 'YEARLY', nextDueDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0], category: 'INSURANCE', isAutoPay: false },
];

// --- WELCOME OVERLAY ---
const WelcomeOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  
  const steps = [
    { icon: "👋", title: "Welcome to BillBot", text: "Your money, your grid. Let's build something epic." },
    { icon: "🏙️", title: "Your City", text: "Watch your wealth grow as buildings rise. Debt creates smoke — let's clear the air." },
    { icon: "🎯", title: "Lock In Targets", text: "Save for what matters. When you hit your target, unlock it and celebrate guilt-free!" },
    { icon: "🔥", title: "2 Min Quick Sync", text: "A quick sync each week keeps your grid running. That's all it takes." },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="text-6xl mb-6 animate-bounce">{current.icon}</div>
          <h2 className="text-2xl font-black text-white mb-3">{current.title}</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">{current.text}</p>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'}`} />
              ))}
            </div>
            <button 
              onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-cyan-500/25"
            >
              {isLast ? "Let's Go!" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- HEALTH SCORE RING ---
const HealthScoreRing = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 45;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="56" cy="56" r="45" stroke="#1e293b" strokeWidth="8" fill="none" />
        <circle 
          cx="56" cy="56" r="45" 
          stroke={color} 
          strokeWidth="8" 
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white">{score}</span>
        <span className="text-xs text-slate-500 uppercase">Score</span>
      </div>
    </div>
  );
};

// --- CASH LEFT CARD ---
const CashLeftCard = ({ income, expenses }: { income: number, expenses: number }) => {
  const surplus = income - expenses;
  const percentage = Math.round((expenses / income) * 100);
  const isHealthy = surplus > 0;
  
  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-5">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Monthly Surplus</p>
          <p className={`text-3xl font-black ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isHealthy ? '+' : ''}${surplus.toLocaleString()}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isHealthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {isHealthy ? '✓ Healthy' : '⚠ Deficit'}
        </div>
      </div>
      
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full transition-all duration-1000 ${isHealthy ? 'bg-gradient-to-r from-rose-500 to-emerald-500' : 'bg-rose-500'}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-slate-500">
        <span>Expenses: ${expenses.toLocaleString()}</span>
        <span>Income: ${income.toLocaleString()}</span>
      </div>
    </div>
  );
};

// --- NEXT ACTION CARD ---
const NextActionCard = ({ 
  health, 
  subscriptions, 
  goals,
  onAction 
}: { 
  health: FinancialHealth, 
  subscriptions: Subscription[], 
  goals: Goal[],
  onAction: (view: AppView) => void 
}) => {
  // AI-like logic to determine next action
  const getNextAction = () => {
    const surplus = health.monthlyIncome - health.monthlyExpenses;
    
    // Crisis mode
    if (surplus < 0) {
      return {
        icon: "🚨",
        title: "You're spending more than you earn",
        description: `You need to cut $${Math.abs(surplus).toLocaleString()} to break even.`,
        action: "Find Savings",
        view: AppView.MONEY,
        urgent: true
      };
    }
    
    // Optimizable subscriptions
    const killable = subscriptions.filter(s => s.isOptimizable);
    if (killable.length > 0) {
      const total = killable.reduce((sum, s) => sum + s.amount, 0);
      return {
        icon: "✂️",
        title: `Kill ${killable.length} subscription${killable.length > 1 ? 's' : ''}`,
        description: `Save $${(total * 12).toFixed(0)}/year by cutting the fat.`,
        action: "Review Now",
        view: AppView.MONEY,
        urgent: false
      };
    }
    
    // Targets needing more cash
    const underfunded = goals.filter(g => {
      if (g.goalType === 'rocket' && g.deadline) {
        const days = Math.max(1, (new Date(g.deadline).getTime() - Date.now()) / (1000 * 3600 * 24));
        const weekly = (g.targetAmount - g.currentAmount) / (days / 7);
        return weekly > (surplus / 4);
      }
      return false;
    });
    
    if (underfunded.length > 0) {
      return {
        icon: "🎯",
        title: `${underfunded[0].name} needs more ammo`,
        description: "You might miss your deadline at this pace.",
        action: "Adjust Target",
        view: AppView.GOALS,
        urgent: false
      };
    }
    
    // Ready to unlock
    const ready = goals.filter(g => g.currentAmount >= g.targetAmount);
    if (ready.length > 0) {
      return {
        icon: "🎉",
        title: `${ready[0].name} is ready to unlock!`,
        description: "You did it! Time to celebrate.",
        action: "Unlock Now",
        view: AppView.GOALS,
        urgent: false
      };
    }
    
    // All good
    return {
      icon: "✨",
      title: "You're on track!",
      description: `Keep it up - the grid is humming.`,
      action: "View Targets",
      view: AppView.GOALS,
      urgent: false
    };
  };
  
  const action = getNextAction();
  
  return (
    <button 
      onClick={() => onAction(action.view)}
      className={`w-full text-left bg-gradient-to-r ${action.urgent ? 'from-rose-900/50 to-orange-900/50 border-rose-500/40' : 'from-slate-800/80 to-slate-800/40 border-slate-700/50'} border rounded-xl p-4 group hover:scale-[1.01] transition-all duration-200`}
    >
      <div className="flex items-center gap-3">
        <div className={`text-2xl ${action.urgent ? 'animate-pulse' : ''}`}>{action.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm truncate">{action.title}</h3>
          <p className="text-slate-400 text-xs truncate">{action.description}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap ${action.urgent ? 'bg-rose-500 text-white' : 'bg-cyan-500/20 text-cyan-400'}`}>
          {action.action} →
        </div>
      </div>
    </button>
  );
};

// --- QUICK STATS ---
const QuickStats = ({ health, goals }: { health: FinancialHealth, goals: Goal[] }) => {
  const netWorth = health.savings - (health.hecsDebt + health.otherDebts);
  const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount).length;
  
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
        <p className={`text-xl font-black ${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          ${Math.abs(netWorth).toLocaleString()}
        </p>
        <p className="text-xs text-slate-500 mt-1">Net Worth</p>
      </div>
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
        <p className="text-xl font-black text-purple-400">{activeGoals}</p>
        <p className="text-xs text-slate-500 mt-1">Active Goals</p>
      </div>
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
        <p className="text-xl font-black text-amber-400">{health.willpowerPoints || 0}</p>
        <p className="text-xs text-slate-500 mt-1">Willpower</p>
      </div>
    </div>
  );
};

// --- HOME VIEW (Full-Screen Immersive City) ---
const HomeView = ({ 
  health, 
  accounts, 
  goals, 
  subscriptions,
  onNavigate,
  onShowCheckIn,
  impulseItems
}: { 
  health: FinancialHealth, 
  accounts: AccountItem[], 
  goals: Goal[],
  subscriptions: Subscription[],
  onNavigate: (view: AppView) => void,
  onShowCheckIn: () => void,
  impulseItems: ImpulseItem[]
}) => {
  const surplus = health.monthlyIncome - health.monthlyExpenses;
  const netWorth = health.savings - (health.hecsDebt + health.otherDebts);
  const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount).length;
  
  // Get next action for overlay
  const getNextAction = () => {
    if (surplus < 0) return { icon: "🚨", text: "Spending exceeds income", urgent: true };
    const killable = subscriptions.filter(s => s.isOptimizable);
    if (killable.length > 0) return { icon: "✂️", text: `Kill ${killable.length} subs`, urgent: false };
    const ready = goals.filter(g => g.currentAmount >= g.targetAmount);
    if (ready.length > 0) return { icon: "🎉", text: `${ready[0].name} ready!`, urgent: false };
    return { icon: "✨", text: "On track", urgent: false };
  };
  const action = getNextAction();
  
  // Generate contextual insight based on user data
  const getInsight = (): { icon: string; text: string } => {
    const totalSubs = subscriptions.length;
    
    // Priority-based insights
    if (surplus < -500) {
      return { icon: '⚡', text: `Spending exceeds income by $${Math.abs(surplus).toLocaleString()}. Let's find quick wins!` };
    }
    if (totalSubs > 5) {
      return { icon: '📺', text: `${totalSubs} subscriptions active. Review to find hidden savings.` };
    }
    if (activeGoals === 0) {
      return { icon: '🎯', text: 'No active targets. Add a goal to start building momentum!' };
    }
    if (surplus > 1000) {
      return { icon: '🚀', text: `$${surplus.toLocaleString()} monthly surplus! Accelerate your targets.` };
    }
    if (netWorth > 50000) {
      return { icon: '✨', text: 'Strong position. Consider diversifying into investments.' };
    }
    if (health.checkInStreak && health.checkInStreak >= 3) {
      return { icon: '🔥', text: `${health.checkInStreak} day streak! Consistency builds wealth.` };
    }
    if (surplus > 0 && surplus < 500) {
      return { icon: '💡', text: 'Tip: Review subscriptions to boost your monthly surplus.' };
    }
    return { icon: '💡', text: 'Track spending this week to unlock AI insights.' };
  };
  
  return (
    <div className="animate-in fade-in duration-500 -mx-4 -mt-6" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Full-Screen City Container */}
      <div className="relative w-full h-full">
        {/* The City - Takes Full Space */}
        <div className="absolute inset-0">
          <IsometricCity 
            accounts={accounts}
            health={health}
            goals={goals}
            hasWeeds={subscriptions.some(s => s.isOptimizable)}
            isFuture={false}
            onNavigate={onNavigate}
            minimal={true}
            weeklyBuilds={impulseItems.map(i => ({
              id: i.id,
              name: i.name,
              target: i.price,
              saved: i.savedAmount
            }))}
          />
        </div>
        
        {/* TOP OVERLAY: Header + Insight */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent p-3 pb-16 pointer-events-none">
          {/* Header Row */}
          <div className="flex justify-between items-center pointer-events-auto mb-3">
            <div className="flex items-center gap-3">
              {/* Score Ring */}
              <div className="relative">
                <svg className="w-11 h-11 transform -rotate-90">
                  <circle cx="22" cy="22" r="18" stroke="#334155" strokeWidth="3" fill="none" />
                  <circle 
                    cx="22" cy="22" r="18" 
                    stroke={health.score >= 70 ? '#10b981' : health.score >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="3" 
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={(2 * Math.PI * 18) * (1 - health.score / 100)}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-white">{health.score}</span>
                </div>
              </div>
              <div>
                <h1 className="text-base font-black text-white drop-shadow-lg leading-tight">BillBot</h1>
                <p className="text-slate-400 text-[10px]">{accounts.length} accounts • {goals.length} targets</p>
              </div>
            </div>
            
            {/* Surplus Badge */}
            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-sm border ${surplus >= 0 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/20 border-rose-500/30 text-rose-300'}`}>
              {surplus >= 0 ? '↑' : '↓'} ${Math.abs(surplus).toLocaleString()}/mo
            </div>
          </div>
          
          {/* Insight Card - Floating in the sky */}
          <div className="flex justify-center pointer-events-auto">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl px-4 py-2 max-w-[280px]">
              <div className="flex items-center gap-2">
                <span className="text-base">{getInsight().icon}</span>
                <p className="text-[11px] text-slate-300 leading-tight">{getInsight().text}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* BOTTOM OVERLAY: Stats + Actions */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-16 px-4 pb-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 text-center">
              <p className={`text-sm font-black ${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${Math.abs(netWorth).toLocaleString()}
              </p>
              <p className="text-[8px] text-slate-500 uppercase tracking-wider">Net Worth</p>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 text-center">
              <p className="text-sm font-black text-cyan-400">{activeGoals}</p>
              <p className="text-[8px] text-slate-500 uppercase tracking-wider">Targets</p>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-2 text-center">
              <p className="text-sm font-black text-amber-400">{health.willpowerPoints || 0}</p>
              <p className="text-[8px] text-slate-500 uppercase tracking-wider">Juice</p>
            </div>
          </div>
          
          {/* Action Buttons Row */}
          <div className="flex gap-2">
            {/* Next Action */}
            <button 
              onClick={() => onNavigate(surplus < 0 ? AppView.MONEY : AppView.GOALS)}
              className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl backdrop-blur-sm transition-all ${action.urgent ? 'bg-rose-500/30 border border-rose-500/50' : 'bg-slate-800/80 border border-slate-700/50'}`}
            >
              <span className="text-lg">{action.icon}</span>
              <span className={`text-xs font-bold ${action.urgent ? 'text-rose-300' : 'text-slate-300'}`}>{action.text}</span>
            </button>
            
            {/* Quick Sync */}
            <button 
              onClick={onShowCheckIn}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl"
            >
              <span className="text-lg">⚡</span>
              <span className="text-xs font-bold text-white">Sync</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">{health.checkInStreak || 0}🔥</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ACCOUNT MODAL ---
const AccountModal = ({ 
  account, 
  defaultType,
  onSave, 
  onClose 
}: { 
  account: AccountItem | null, 
  defaultType: AccountType,
  onSave: (acc: AccountItem) => void, 
  onClose: () => void 
}) => {
  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState<AccountType>(account?.type || defaultType);
  const [balance, setBalance] = useState(account?.balance?.toString() || '');
  const [interestRate, setInterestRate] = useState(account?.interestRate?.toString() || '');
  
  const isDebt = ['LOAN', 'CREDIT_CARD', 'HECS'].includes(type);
  
  const handleSave = () => {
    if (!name || !balance) return;
    onSave({
      id: account?.id || '',
      name,
      type,
      balance: parseFloat(balance) || 0,
      interestRate: interestRate ? parseFloat(interestRate) : undefined
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-bold text-white mb-4">{account ? 'Edit Account' : 'Add Account'}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            >
              <option value="SAVINGS">Savings Account</option>
              <option value="CASH">Cash / Everyday</option>
              <option value="INVESTMENT">Investment / Shares</option>
              <option value="SUPER">Superannuation</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="LOAN">Personal/Car Loan</option>
              <option value="HECS">HECS / HELP Debt</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Account Name</label>
            <input 
              type="text" 
              placeholder="e.g. NAB Rewards" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Current Balance ($)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          {isDebt && type !== 'HECS' && (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Interest Rate (% APR)</label>
              <input 
                type="number" 
                placeholder="e.g. 18.5" 
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 text-slate-400 hover:text-white font-bold rounded-xl">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={!name || !balance}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-3 rounded-xl transition-colors"
          >
            {account ? 'Update' : 'Add Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SUBSCRIPTION MODAL ---
const SubscriptionModal = ({ 
  onSave, 
  onClose 
}: { 
  onSave: (sub: Subscription) => void, 
  onClose: () => void 
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState<'MONTHLY' | 'YEARLY' | 'WEEKLY'>('MONTHLY');
  const [category, setCategory] = useState('Entertainment');
  
  const handleSave = () => {
    if (!name || !amount) return;
    const nextDue = new Date();
    if (cycle === 'MONTHLY') nextDue.setMonth(nextDue.getMonth() + 1);
    else if (cycle === 'YEARLY') nextDue.setFullYear(nextDue.getFullYear() + 1);
    else nextDue.setDate(nextDue.getDate() + 7);
    
    onSave({
      id: Math.random().toString(36).substr(2, 9),
      name,
      amount: parseFloat(amount) || 0,
      cycle,
      nextDueDate: nextDue.toISOString().split('T')[0],
      category,
      isOptimizable: false
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-bold text-white mb-4">Add Subscription</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Name</label>
            <input 
              type="text" 
              placeholder="e.g. Netflix" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Amount ($)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Billing Cycle</label>
            <select 
              value={cycle} 
              onChange={(e) => setCycle(e.target.value as 'MONTHLY' | 'YEARLY' | 'WEEKLY')}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            >
              <option value="Entertainment">Entertainment</option>
              <option value="Health">Health & Fitness</option>
              <option value="Software">Software & Apps</option>
              <option value="News">News & Media</option>
              <option value="Utilities">Utilities</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 text-slate-400 hover:text-white font-bold rounded-xl">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={!name || !amount}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-3 rounded-xl transition-colors"
          >
            Add Subscription
          </button>
        </div>
      </div>
    </div>
  );
};

// --- BILL MODAL ---
const BillModal = ({ 
  bill,
  onSave, 
  onClose 
}: { 
  bill: Bill | null,
  onSave: (b: Bill) => void, 
  onClose: () => void 
}) => {
  const [name, setName] = useState(bill?.name || '');
  const [amount, setAmount] = useState(bill?.amount?.toString() || '');
  const [cycle, setCycle] = useState<Bill['cycle']>(bill?.cycle || 'MONTHLY');
  const [category, setCategory] = useState<BillCategory>(bill?.category || 'UTILITIES');
  const [nextDueDate, setNextDueDate] = useState(bill?.nextDueDate || new Date().toISOString().split('T')[0]);
  const [isAutoPay, setIsAutoPay] = useState(bill?.isAutoPay || false);
  const [notes, setNotes] = useState(bill?.notes || '');
  
  const handleSave = () => {
    if (!name || !amount) return;
    onSave({
      id: bill?.id || Math.random().toString(36).substr(2, 9),
      name,
      amount: parseFloat(amount) || 0,
      cycle,
      nextDueDate,
      category,
      isAutoPay,
      notes: notes || undefined
    });
  };
  
  const categoryLabels: Record<BillCategory, string> = {
    'RENT': '🏠 Rent',
    'MORTGAGE': '🏦 Mortgage',
    'UTILITIES': '💡 Utilities',
    'INSURANCE': '🛡️ Insurance',
    'PHONE_INTERNET': '📱 Phone/Internet',
    'TRANSPORT': '🚗 Transport',
    'OTHER': '📋 Other'
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">{bill ? 'Edit Bill' : 'Add Bill'}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value as BillCategory)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Name / Provider</label>
            <input 
              type="text" 
              placeholder="e.g. AGL Electricity" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Amount ($)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Billing Cycle</label>
            <select 
              value={cycle} 
              onChange={(e) => setCycle(e.target.value as Bill['cycle'])}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="FORTNIGHTLY">Fortnightly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Next Due Date</label>
            <input 
              type="date" 
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Notes (optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Account #12345" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl cursor-pointer">
            <input 
              type="checkbox"
              checked={isAutoPay}
              onChange={(e) => setIsAutoPay(e.target.checked)}
              className="w-5 h-5 rounded accent-cyan-500"
            />
            <span className="text-white">Auto-pay enabled</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 text-slate-400 hover:text-white font-bold rounded-xl">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={!name || !amount}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-3 rounded-xl transition-colors"
          >
            {bill ? 'Update Bill' : 'Add Bill'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- IMPORT MODAL ---
const ImportModal = ({ 
  onAddTransaction,
  onClose 
}: { 
  onAddTransaction: (t: Transaction) => void,
  onClose: () => void 
}) => {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Shopping');
  
  const handleSave = () => {
    if (!merchant || !amount) return;
    onAddTransaction({
      id: Math.random().toString(36).substr(2, 9),
      date,
      merchant,
      amount: parseFloat(amount) || 0,
      category,
      isDeductible: false,
      gstIncluded: true
    });
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-bold text-white mb-4">📝 Add Transaction</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Merchant/Description</label>
            <input 
              type="text" 
              placeholder="e.g. Woolworths" 
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Amount ($)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            >
              <option value="Shopping">Shopping</option>
              <option value="Groceries">Groceries</option>
              <option value="Transport">Transport</option>
              <option value="Dining">Dining Out</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Utilities">Utilities</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 text-slate-400 hover:text-white font-bold rounded-xl">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={!merchant || !amount}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-3 rounded-xl transition-colors"
          >
            Add Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MONEY VIEW ---
const MoneyView = ({ 
  health, 
  accounts, 
  subscriptions,
  transactions,
  bills,
  onUpdateHealth,
  onUpdateAccounts,
  onUpdateSubscriptions,
  onUpdateTransactions,
  onUpdateBills
}: { 
  health: FinancialHealth, 
  accounts: AccountItem[], 
  subscriptions: Subscription[],
  transactions: Transaction[],
  bills: Bill[],
  onUpdateHealth: (h: FinancialHealth) => void,
  onUpdateAccounts: (a: AccountItem[]) => void,
  onUpdateSubscriptions: (s: Subscription[]) => void,
  onUpdateTransactions: (t: Transaction[]) => void,
  onUpdateBills: (b: Bill[]) => void
}) => {
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'bills' | 'subscriptions' | 'transactions'>('overview');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [newAccountType, setNewAccountType] = useState<AccountType>('SAVINGS');
  
  const monthlySubTotal = subscriptions.reduce((sum, s) => {
    if (s.cycle === 'WEEKLY') return sum + (s.amount * 4.33);
    if (s.cycle === 'YEARLY') return sum + (s.amount / 12);
    return sum + s.amount;
  }, 0);
  
  const monthlyBillsTotal = bills.reduce((sum, b) => {
    if (b.cycle === 'WEEKLY') return sum + (b.amount * 4.33);
    if (b.cycle === 'FORTNIGHTLY') return sum + (b.amount * 2.17);
    if (b.cycle === 'QUARTERLY') return sum + (b.amount / 3);
    if (b.cycle === 'YEARLY') return sum + (b.amount / 12);
    return sum + b.amount;
  }, 0);
  
  const categoryIcons: Record<BillCategory, string> = {
    'RENT': '🏠',
    'MORTGAGE': '🏦',
    'UTILITIES': '💡',
    'INSURANCE': '🛡️',
    'PHONE_INTERNET': '📱',
    'TRANSPORT': '🚗',
    'OTHER': '📋'
  };
  
  const killSubscription = (id: string) => {
    onUpdateSubscriptions(subscriptions.filter(s => s.id !== id));
    onUpdateHealth({
      ...health,
      subscriptionsKilled: (health.subscriptionsKilled || 0) + 1,
      willpowerPoints: (health.willpowerPoints || 0) + 25
    });
  };
  
  const assets = accounts.filter(a => ['CASH', 'SAVINGS', 'INVESTMENT', 'SUPER'].includes(a.type));
  const liabilities = accounts.filter(a => ['LOAN', 'CREDIT_CARD', 'HECS'].includes(a.type));
  
  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Cash</h1>
          <p className="text-slate-500 text-sm">Track every dollar</p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl overflow-x-auto">
        {(['overview', 'accounts', 'bills', 'subscriptions', 'transactions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
          >
            {tab === 'overview' ? '📊' : tab === 'accounts' ? '🏦' : tab === 'bills' ? '🧾' : tab === 'subscriptions' ? '📺' : '💳'}
          </button>
        ))}
      </div>
      
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Income */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold flex items-center gap-2">💰 Money In</h3>
              <button 
                onClick={() => setShowAddIncome(!showAddIncome)}
                className="text-cyan-400 text-sm font-bold"
              >
                Edit
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Salary (after tax)</span>
                <span className="text-white font-bold">${health.monthlyIncome.toLocaleString()}/mo</span>
              </div>
              {health.gigIncome && health.gigIncome > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Side Income</span>
                  <span className="text-white font-bold">${health.gigIncome.toLocaleString()}/mo</span>
                </div>
              )}
              {health.taxVault > 0 && (
                <div className="flex justify-between items-center py-2 text-amber-400">
                  <span>🔒 Tax Set Aside</span>
                  <span className="font-bold">${health.taxVault.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {showAddIncome && (
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                <div>
                  <label className="text-xs text-slate-500 font-bold">Monthly Take-Home</label>
                  <input 
                    type="number"
                    value={health.monthlyIncome}
                    onChange={(e) => onUpdateHealth({...health, monthlyIncome: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold">Monthly Expenses</label>
                  <input 
                    type="number"
                    value={health.monthlyExpenses}
                    onChange={(e) => onUpdateHealth({...health, monthlyExpenses: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mt-1"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Expenses Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4">💸 Money Out</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">🧾 Bills & Expenses</span>
                <span className="text-white font-bold">${monthlyBillsTotal.toFixed(0)}/mo</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">📺 Subscriptions</span>
                <span className="text-white font-bold">${monthlySubTotal.toFixed(0)}/mo</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">🛒 Other Spending</span>
                <span className="text-white font-bold">${health.monthlyExpenses.toLocaleString()}/mo</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
              <span className="text-slate-300 font-bold">Total Outflow</span>
              <span className="text-rose-400 font-black text-xl">${(health.monthlyExpenses + monthlySubTotal + monthlyBillsTotal).toFixed(0)}</span>
            </div>
          </div>
          
          {/* Surplus */}
          <div className={`p-5 rounded-2xl border ${health.monthlyIncome - health.monthlyExpenses > 0 ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-rose-900/20 border-rose-500/30'}`}>
            <div className="flex justify-between items-center">
              <span className="text-white font-bold">Monthly Surplus</span>
              <span className={`font-black text-2xl ${health.monthlyIncome - health.monthlyExpenses > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${(health.monthlyIncome - health.monthlyExpenses).toLocaleString()}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-2">
              {health.monthlyIncome - health.monthlyExpenses > 0 
                ? "This is your ammo for targets! 🎯" 
                : "You're spending more than you earn. Let's fix this."}
            </p>
          </div>
        </div>
      )}
      
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {/* Assets */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-emerald-400 font-bold">💚 Assets</h3>
              <button 
                onClick={() => { setEditingAccount(null); setShowAccountModal(true); setNewAccountType('SAVINGS'); }}
                className="text-emerald-400 text-sm font-bold hover:text-emerald-300"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {assets.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-3 px-3 bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-white font-medium">{acc.name}</p>
                    <p className="text-xs text-slate-500">{acc.type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold">${acc.balance.toLocaleString()}</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { setEditingAccount(acc); setShowAccountModal(true); }}
                        className="text-slate-500 hover:text-white p-1"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => onUpdateAccounts(accounts.filter(a => a.id !== acc.id))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {assets.length === 0 && (
                <button 
                  onClick={() => { setEditingAccount(null); setShowAccountModal(true); setNewAccountType('SAVINGS'); }}
                  className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  + Add your first asset
                </button>
              )}
            </div>
          </div>
          
          {/* Liabilities */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-rose-400 font-bold">❤️ Liabilities</h3>
              <button 
                onClick={() => { setEditingAccount(null); setShowAccountModal(true); setNewAccountType('CREDIT_CARD'); }}
                className="text-rose-400 text-sm font-bold hover:text-rose-300"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {liabilities.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-3 px-3 bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-white font-medium">{acc.name}</p>
                    <p className="text-xs text-slate-500">{acc.type} {acc.interestRate && `• ${acc.interestRate}% APR`}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-rose-400 font-bold">-${acc.balance.toLocaleString()}</span>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { setEditingAccount(acc); setShowAccountModal(true); }}
                        className="text-slate-500 hover:text-white p-1"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => onUpdateAccounts(accounts.filter(a => a.id !== acc.id))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {liabilities.length === 0 && (
                <p className="text-slate-500 text-center py-4">No debts! 🎉</p>
              )}
            </div>
          </div>
          
          {/* Account Add/Edit Modal */}
          {showAccountModal && (
            <AccountModal 
              account={editingAccount}
              defaultType={newAccountType}
              onSave={(acc) => {
                if (editingAccount) {
                  onUpdateAccounts(accounts.map(a => a.id === acc.id ? acc : a));
                } else {
                  onUpdateAccounts([...accounts, { ...acc, id: Math.random().toString(36).substr(2, 9) }]);
                }
                setShowAccountModal(false);
                setEditingAccount(null);
              }}
              onClose={() => { setShowAccountModal(false); setEditingAccount(null); }}
            />
          )}
        </div>
      )}
      
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 flex-1">
              <p className="text-indigo-300 font-bold">🧾 Bills total ${monthlyBillsTotal.toFixed(0)}/month (${(monthlyBillsTotal * 12).toFixed(0)}/year)</p>
            </div>
            <button 
              onClick={() => { setEditingBill(null); setShowBillModal(true); }}
              className="ml-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-4 py-3 rounded-xl transition-colors"
            >
              + Add
            </button>
          </div>
          
          {/* Group bills by category */}
          {Object.entries(
            bills.reduce((acc, bill) => {
              if (!acc[bill.category]) acc[bill.category] = [];
              acc[bill.category].push(bill);
              return acc;
            }, {} as Record<BillCategory, Bill[]>)
          ).map(([category, categoryBills]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-slate-400 text-sm font-bold flex items-center gap-2">
                {categoryIcons[category as BillCategory]} {category.replace('_', ' ')}
              </h4>
              {categoryBills.map(bill => {
                const dueDate = new Date(bill.nextDueDate);
                const today = new Date();
                const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysUntil < 0;
                const isDueSoon = daysUntil >= 0 && daysUntil <= 7;
                
                return (
                  <div 
                    key={bill.id} 
                    className={`bg-slate-900/80 border rounded-xl p-4 ${isOverdue ? 'border-rose-500/50' : isDueSoon ? 'border-amber-500/50' : 'border-slate-800'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{bill.name}</p>
                          {bill.isAutoPay && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Auto</span>}
                          {isOverdue && <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">Overdue</span>}
                          {isDueSoon && !isOverdue && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Due soon</span>}
                        </div>
                        <p className="text-slate-500 text-sm">${bill.amount} / {bill.cycle.toLowerCase()} • Due {bill.nextDueDate}</p>
                        {bill.notes && <p className="text-slate-600 text-xs mt-1">{bill.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">${bill.amount}</span>
                        <button 
                          onClick={() => { setEditingBill(bill); setShowBillModal(true); }}
                          className="text-slate-500 hover:text-white p-1"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => onUpdateBills(bills.filter(b => b.id !== bill.id))}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {bills.length === 0 && (
            <button 
              onClick={() => { setEditingBill(null); setShowBillModal(true); }}
              className="w-full py-8 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
            >
              <p className="text-4xl mb-2">🧾</p>
              <p className="font-bold">Add your first bill</p>
              <p className="text-sm mt-1">Rent, utilities, insurance, etc.</p>
            </button>
          )}
          
          {/* Bill Modal */}
          {showBillModal && (
            <BillModal 
              bill={editingBill}
              onSave={(b) => {
                if (editingBill) {
                  onUpdateBills(bills.map(bill => bill.id === b.id ? b : bill));
                } else {
                  onUpdateBills([...bills, b]);
                }
                setShowBillModal(false);
                setEditingBill(null);
              }}
              onClose={() => { setShowBillModal(false); setEditingBill(null); }}
            />
          )}
        </div>
      )}
      
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 flex-1">
              <p className="text-amber-400 font-bold">📺 Subscriptions cost you ${(monthlySubTotal * 12).toFixed(0)}/year</p>
            </div>
            <button 
              onClick={() => setShowSubModal(true)}
              className="ml-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-4 py-3 rounded-xl transition-colors"
            >
              + Add
            </button>
          </div>
          
          {subscriptions.map(sub => (
            <div 
              key={sub.id} 
              className={`bg-slate-900/80 border rounded-2xl p-4 flex items-center justify-between ${sub.isOptimizable ? 'border-amber-500/50' : 'border-slate-800'}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold">{sub.name}</p>
                  {sub.isOptimizable && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Cut this?</span>}
                </div>
                <p className="text-slate-500 text-sm">${sub.amount}/{sub.cycle.toLowerCase()} • {sub.category}</p>
              </div>
              <button 
                onClick={() => killSubscription(sub.id)}
                className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
              >
                Axe 🪓
              </button>
            </div>
          ))}
          
          {subscriptions.length === 0 && (
            <button 
              onClick={() => setShowSubModal(true)}
              className="w-full py-8 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
            >
              <p className="text-4xl mb-2">📺</p>
              <p className="font-bold">Add your first subscription</p>
            </button>
          )}
          
          {/* Subscription Add Modal */}
          {showSubModal && (
            <SubscriptionModal 
              onSave={(sub) => {
                onUpdateSubscriptions([...subscriptions, sub]);
                setShowSubModal(false);
              }}
              onClose={() => setShowSubModal(false)}
            />
          )}
        </div>
      )}
      
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-slate-400 text-sm">{transactions.length} transactions</p>
            <button 
              onClick={() => setShowImportModal(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-4 py-2 rounded-xl transition-colors text-sm"
            >
              + Add
            </button>
          </div>
          
          {transactions.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.slice().reverse().map(t => (
                <div key={t.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{t.merchant}</p>
                    <p className="text-slate-500 text-xs">{t.date} • {t.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">-${t.amount.toLocaleString()}</span>
                    <button 
                      onClick={() => onUpdateTransactions(transactions.filter(tx => tx.id !== t.id))}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <button 
              onClick={() => setShowImportModal(true)}
              className="w-full py-8 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
            >
              <p className="text-4xl mb-2">💳</p>
              <p className="font-bold">Add your first transaction</p>
            </button>
          )}
          
          {/* Import Modal */}
          {showImportModal && (
            <ImportModal 
              onAddTransaction={(t) => {
                onUpdateTransactions([...transactions, t]);
              }}
              onClose={() => setShowImportModal(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};

// --- GOAL MODAL ---
const GoalModal = ({ 
  goal, 
  onSave, 
  onClose 
}: { 
  goal: Goal | null, 
  onSave: (g: Goal) => void, 
  onClose: () => void 
}) => {
  const [name, setName] = useState(goal?.name || '');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount?.toString() || '0');
  const [deadline, setDeadline] = useState(goal?.deadline || '');
  const [goalType, setGoalType] = useState<'rocket' | 'impulse'>(goal?.goalType || 'rocket');
  const [emoji, setEmoji] = useState(goal?.emoji || '🚀');
  
  const handleSave = () => {
    if (!name || !targetAmount) return;
    onSave({
      id: goal?.id || Math.random().toString(36).substr(2, 9),
      name,
      targetAmount: parseFloat(targetAmount) || 0,
      currentAmount: parseFloat(currentAmount) || 0,
      deadline: deadline || undefined,
      category: goal?.category || 'other',
      valueTag: goalType === 'impulse' ? 'Treat' : 'Adventure',
      goalType,
      createdAt: goal?.createdAt || new Date().toISOString(),
      emoji
    });
  };
  
  const emojis = ['🚀', '🎯', '🌏', '🎮', '🏠', '🚗', '💎', '🎁', '🛡️', '✈️', '💻', '📱'];
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">{goal ? 'Edit Goal' : 'New Goal'}</h3>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setGoalType('rocket')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${goalType === 'rocket' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}
            >
              🎯 Target
            </button>
            <button 
              onClick={() => setGoalType('impulse')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${goalType === 'impulse' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}
            >
              🅿️ Parked
            </button>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Icon</label>
            <div className="flex flex-wrap gap-2">
              {emojis.map(e => (
                <button 
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-2 rounded-lg transition-all ${emoji === e ? 'bg-cyan-500/30 ring-2 ring-cyan-500' : 'bg-slate-800 hover:bg-slate-700'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Goal Name</label>
            <input 
              type="text" 
              placeholder="e.g. Japan Trip" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Target Amount ($)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
            />
          </div>

          {goal && (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Current Amount ($)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {goalType === 'rocket' && (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Target Date (optional)</label>
              <input 
                type="date" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 text-slate-400 hover:text-white font-bold rounded-xl">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={!name || !targetAmount}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-3 rounded-xl transition-colors"
          >
            {goal ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- GOALS VIEW ---
const GoalsView = ({ 
  health, 
  goals, 
  onUpdateHealth,
  onUpdateGoals 
}: { 
  health: FinancialHealth, 
  goals: Goal[],
  onUpdateHealth: (h: FinancialHealth) => void,
  onUpdateGoals: (g: Goal[]) => void
}) => {
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalAmount, setNewGoalAmount] = useState('');
  const [newGoalType, setNewGoalType] = useState<'rocket' | 'impulse'>('rocket');
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  
  const weeklySurplus = Math.max(0, (health.monthlyIncome - health.monthlyExpenses) / 4);
  
  const addGoal = () => {
    if (!newGoalName || !newGoalAmount) return;
    
    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      name: newGoalName,
      targetAmount: parseFloat(newGoalAmount),
      currentAmount: 0,
      category: 'other',
      valueTag: newGoalType === 'impulse' ? 'Treat' : 'Adventure',
      goalType: newGoalType,
      createdAt: new Date().toISOString(),
      emoji: newGoalType === 'impulse' ? '🎁' : '🚀'
    };
    
    onUpdateGoals([...goals, newGoal]);
    setNewGoalName('');
    setNewGoalAmount('');
    setShowNewGoal(false);
  };
  
  const addCash = (goalId: string, amount: number) => {
    onUpdateGoals(goals.map(g => {
      if (g.id === goalId) {
        return { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) };
      }
      return g;
    }));
  };
  
  const launchGoal = (goal: Goal) => {
    if (launchingId) return;
    setLaunchingId(goal.id);
    
    setTimeout(() => {
      onUpdateGoals(goals.filter(g => g.id !== goal.id));
      onUpdateHealth({
        ...health,
        savings: Math.max(0, health.savings - goal.targetAmount),
        willpowerPoints: (health.willpowerPoints || 0) + 100,
        goalsCompleted: (health.goalsCompleted || 0) + 1
      });
      setLaunchingId(null);
    }, 2000);
  };
  
  const skipImpulse = (goal: Goal) => {
    onUpdateGoals(goals.filter(g => g.id !== goal.id));
    onUpdateHealth({
      ...health,
      savings: health.savings + goal.currentAmount,
      willpowerPoints: (health.willpowerPoints || 0) + 50
    });
  };
  
  const rockets = goals.filter(g => g.goalType === 'rocket');
  const impulses = goals.filter(g => g.goalType === 'impulse');
  
  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Targets</h1>
          <p className="text-slate-500 text-sm">Lock in what matters</p>
        </div>
        <button 
          onClick={() => setShowNewGoal(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-4 py-2 rounded-xl transition-colors"
        >
          + New
        </button>
      </div>
      
      {/* Weekly Budget */}
      <div className="bg-gradient-to-r from-purple-900/40 to-fuchsia-900/40 border border-purple-500/30 rounded-2xl p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-purple-300 text-sm font-bold">Weekly Ammo</p>
            <p className="text-white text-2xl font-black">${weeklySurplus.toFixed(0)}/wk</p>
          </div>
          <div className="text-4xl">💰</div>
        </div>
      </div>
      
      {/* New Goal Form */}
      {showNewGoal && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-4">
          <h3 className="text-white font-bold">Create New Goal</h3>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setNewGoalType('rocket')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${newGoalType === 'rocket' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}
            >
              🎯 Target
            </button>
            <button 
              onClick={() => setNewGoalType('impulse')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${newGoalType === 'impulse' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}
            >
              🅿️ Parked
            </button>
          </div>
          
          <input 
            type="text"
            placeholder="Goal name (e.g., Japan Trip)"
            value={newGoalName}
            onChange={(e) => setNewGoalName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
          />
          
          <input 
            type="number"
            placeholder="Target amount ($)"
            value={newGoalAmount}
            onChange={(e) => setNewGoalAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
          />
          
          <div className="flex gap-2">
            <button onClick={() => setShowNewGoal(false)} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold">
              Cancel
            </button>
            <button onClick={addGoal} className="flex-1 py-3 bg-cyan-500 text-slate-900 rounded-xl font-bold">
              Create
            </button>
          </div>
        </div>
      )}
      
      {/* Targets (Serious Goals) */}
      {rockets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider">🎯 Locked In</h3>
          {rockets.map(goal => {
            const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
            const isReady = goal.currentAmount >= goal.targetAmount;
            const isLaunching = launchingId === goal.id;
            
            return (
              <div 
                key={goal.id} 
                className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-5 transition-all ${isLaunching ? 'animate-pulse scale-105' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-bold flex items-center gap-2">
                      {goal.emoji || '🚀'} {goal.name}
                    </h4>
                    <p className="text-slate-500 text-sm">{goal.valueTag}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      {percent}%
                    </span>
                    <button 
                      onClick={() => setEditingGoal(goal)}
                      className="text-slate-500 hover:text-white p-1"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => onUpdateGoals(goals.filter(g => g.id !== goal.id))}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div 
                    className={`h-full transition-all duration-500 ${isReady ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className="text-slate-400">${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}</span>
                  {goal.deadline && (
                    <span className="text-slate-500">📅 {new Date(goal.deadline).toLocaleDateString()}</span>
                  )}
                </div>
                
                {isReady ? (
                  <button 
                    onClick={() => launchGoal(goal)}
                    disabled={isLaunching}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold py-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {isLaunching ? '🔓 UNLOCKING...' : '🔓 UNLOCK & CELEBRATE!'}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => addCash(goal.id, 50)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-colors">
                      +$50
                    </button>
                    <button onClick={() => addCash(goal.id, 100)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-colors">
                      +$100
                    </button>
                    <button onClick={() => addCash(goal.id, 500)} className="flex-1 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-xl font-bold text-sm transition-colors">
                      +$500
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Parked Items */}
      {impulses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider">🅿️ Parked</h3>
          {impulses.map(goal => {
            const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
            const isReady = goal.currentAmount >= goal.targetAmount;
            
            return (
              <div key={goal.id} className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-bold flex items-center gap-2">
                      {goal.emoji || '🎁'} {goal.name}
                    </h4>
                    <p className="text-amber-400 text-sm">Parked Item</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">{percent}%</span>
                    <button 
                      onClick={() => setEditingGoal(goal)}
                      className="text-slate-500 hover:text-white p-1"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => onUpdateGoals(goals.filter(g => g.id !== goal.id))}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-sm text-slate-400 mb-4">
                  <span>${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}</span>
                </div>
                
                {isReady ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => launchGoal(goal)}
                      className="py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
                    >
                      🛍️ Buy It
                    </button>
                    <button 
                      onClick={() => skipImpulse(goal)}
                      className="py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-bold transition-colors"
                    >
                      💪 Keep Cash (+50 Juice)
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => addCash(goal.id, 25)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm">
                      +$25
                    </button>
                    <button onClick={() => addCash(goal.id, 50)} className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl font-bold text-sm">
                      +$50
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {goals.length === 0 && !showNewGoal && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-white font-bold text-xl mb-2">No Targets Yet</h3>
          <p className="text-slate-500 mb-6">What are you locking in?</p>
          <button 
            onClick={() => setShowNewGoal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-6 py-3 rounded-xl"
          >
            Set Your First Target
          </button>
        </div>
      )}
      
      {/* Goal Edit Modal */}
      {editingGoal && (
        <GoalModal 
          goal={editingGoal}
          onSave={(g) => {
            onUpdateGoals(goals.map(goal => goal.id === g.id ? g : goal));
            setEditingGoal(null);
          }}
          onClose={() => setEditingGoal(null)}
        />
      )}
    </div>
  );
};

// --- HELP VIEW ---
const HelpView = ({ health, accounts }: { health: FinancialHealth, accounts: AccountItem[] }) => {
  const [activeSection, setActiveSection] = useState<'chat' | 'crisis' | 'tools'>('chat');
  const [activeTool, setActiveTool] = useState<'hecs' | 'tax' | 'abn' | null>(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'bot', text: string}>>([
    { role: 'bot', text: "Hey! I'm BillBot. What's on your mind? 💬" }
  ]);
  
  // Tax lookup state
  const [taxQuery, setTaxQuery] = useState('');
  const [taxResults, setTaxResults] = useState<Array<{asset: string, lifeYears: number, rate: number}>>([]);
  
  // ABN state
  const [abnInput, setAbnInput] = useState('');
  const [abnResult, setAbnResult] = useState<{isValid: boolean, message: string} | null>(null);
  
  // HECS state
  const [hecsBalance, setHecsBalance] = useState('35000');
  const [hecsIncome, setHecsIncome] = useState('65000');
  
  const isCrisis = health.monthlyExpenses > health.monthlyIncome;
  
  // Tax lookup function
  const searchTax = (query: string) => {
    setTaxQuery(query);
    const COMMON_ASSETS = [
      { asset: "Laptop (Computer)", lifeYears: 2, rate: 0.50 },
      { asset: "Mobile Phone", lifeYears: 3, rate: 0.3333 },
      { asset: "Tablet", lifeYears: 2, rate: 0.50 },
      { asset: "Office Chair", lifeYears: 10, rate: 0.10 },
      { asset: "Desk", lifeYears: 20, rate: 0.05 },
      { asset: "Monitor", lifeYears: 4, rate: 0.25 },
      { asset: "Keyboard/Mouse", lifeYears: 2, rate: 0.50 },
      { asset: "Camera (Digital)", lifeYears: 3, rate: 0.3333 },
      { asset: "Headphones (Noise Cancelling)", lifeYears: 2, rate: 0.50 },
      { asset: "Standing Desk", lifeYears: 20, rate: 0.05 },
    ];
    if (!query) {
      setTaxResults(COMMON_ASSETS);
    } else {
      const q = query.toLowerCase();
      setTaxResults(COMMON_ASSETS.filter(item => item.asset.toLowerCase().includes(q)));
    }
  };
  
  // ABN validation function
  const validateABN = (abn: string) => {
    const cleanAbn = abn.replace(/[^0-9]/g, '');
    if (cleanAbn.length !== 11) {
      setAbnResult({ isValid: false, message: "ABN must be 11 digits." });
      return;
    }
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const firstDigit = parseInt(cleanAbn[0]) - 1;
    let sum = firstDigit * weights[0];
    for (let i = 1; i < 11; i++) {
      sum += parseInt(cleanAbn[i]) * weights[i];
    }
    const isValid = sum % 89 === 0;
    setAbnResult({ 
      isValid, 
      message: isValid ? "✅ Valid ABN (Checksum Passed)" : "❌ Invalid ABN (Checksum Failed - Potential Fraud)" 
    });
  };
  
  const sendMessage = () => {
    if (!message.trim()) return;
    
    setChatHistory(prev => [...prev, { role: 'user', text: message }]);
    
    // Simple response logic (would be AI in real implementation)
    setTimeout(() => {
      let response = "I'm thinking about that...";
      
      if (message.toLowerCase().includes('save')) {
        response = "Great question! Based on your numbers, you could save around $" + Math.round(health.monthlyIncome - health.monthlyExpenses) + " per month. Want me to help you set up a goal?";
      } else if (message.toLowerCase().includes('debt')) {
        response = "Debt can feel overwhelming, but you've got this! Your current debt is $" + (health.hecsDebt + health.otherDebts).toLocaleString() + ". Would you like me to help create a payoff strategy?";
      } else if (message.toLowerCase().includes('budget')) {
        response = "Your income is $" + health.monthlyIncome.toLocaleString() + "/mo and expenses are $" + health.monthlyExpenses.toLocaleString() + "/mo. That gives you $" + (health.monthlyIncome - health.monthlyExpenses).toLocaleString() + " to work with!";
      } else {
        response = "I hear you! Tell me more about what's on your mind financially, and I'll do my best to help. 💪";
      }
      
      setChatHistory(prev => [...prev, { role: 'bot', text: response }]);
    }, 500);
    
    setMessage('');
  };
  
  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-white">Support</h1>
        <p className="text-slate-500 text-sm">We've got your back</p>
      </div>
      
      {/* Crisis Banner */}
      {isCrisis && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
          <div className="text-3xl">🚨</div>
          <div>
            <h3 className="text-red-400 font-bold">SOS Mode</h3>
            <p className="text-red-300 text-sm">You're spending more than you earn. Let's fix this together.</p>
          </div>
        </div>
      )}
      
      {/* Section Tabs */}
      <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl">
        <button onClick={() => setActiveSection('chat')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${activeSection === 'chat' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>
          💬 Chat
        </button>
        <button onClick={() => setActiveSection('crisis')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${activeSection === 'crisis' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>
          🚨 SOS
        </button>
        <button onClick={() => setActiveSection('tools')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${activeSection === 'tools' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>
          🧰 Tools
        </button>
      </div>
      
      {activeSection === 'chat' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col" style={{ height: '400px' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-white'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-slate-800 flex gap-2">
            <input 
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask BillBot anything..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
            />
            <button 
              onClick={sendMessage}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold px-4 rounded-xl transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
      
      {activeSection === 'crisis' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-4">📋 Priority Order (When You Can't Pay Everything)</h3>
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
                <span className="text-xl">1️⃣</span>
                <div>
                  <p className="text-emerald-400 font-bold">Roof & Essentials</p>
                  <p className="text-slate-400 text-sm">Rent, electricity, water, food</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                <span className="text-xl">2️⃣</span>
                <div>
                  <p className="text-amber-400 font-bold">Critical Assets</p>
                  <p className="text-slate-400 text-sm">Car (if needed for work), phone, internet</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-red-900/20 border border-red-500/30 rounded-xl">
                <span className="text-xl">3️⃣</span>
                <div>
                  <p className="text-red-400 font-bold">Unsecured Debt (Can Wait)</p>
                  <p className="text-slate-400 text-sm">Credit cards, personal loans, BNPL</p>
                </div>
              </div>
            </div>
          </div>
          
          <button className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-bold py-4 rounded-2xl transition-colors">
            📄 Draft Hardship Letter
          </button>
          
          <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-colors">
            📞 Get Free Help
          </button>
        </div>
      )}
      
      {activeSection === 'tools' && (
        <div className="space-y-4">
          {/* Tool Buttons (when no tool active) */}
          {!activeTool && (
            <>
              <button 
                onClick={() => setActiveTool('hecs')}
                className="w-full bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 text-left transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🎓</div>
                  <div>
                    <h3 className="text-white font-bold">HECS/HELP Strategy</h3>
                    <p className="text-slate-500 text-sm">Should you pay it off early?</p>
                  </div>
                  <span className="ml-auto text-slate-500">→</span>
                </div>
              </button>
              
              <button 
                onClick={() => { setActiveTool('tax'); searchTax(''); }}
                className="w-full bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 text-left transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🔍</div>
                  <div>
                    <h3 className="text-white font-bold">Tax Deduction Lookup</h3>
                    <p className="text-slate-500 text-sm">Check depreciation rates for work assets</p>
                  </div>
                  <span className="ml-auto text-slate-500">→</span>
                </div>
              </button>
              
              <button 
                onClick={() => setActiveTool('abn')}
                className="w-full bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 text-left transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">✅</div>
                  <div>
                    <h3 className="text-white font-bold">ABN Validator</h3>
                    <p className="text-slate-500 text-sm">Check if a business ABN is legit</p>
                  </div>
                  <span className="ml-auto text-slate-500">→</span>
                </div>
              </button>
            </>
          )}
          
          {/* HECS Tool */}
          {activeTool === 'hecs' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 animate-in slide-in-from-right">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">🎓 HECS/HELP Strategy</h3>
                <button onClick={() => setActiveTool(null)} className="text-slate-500 hover:text-white">← Back</button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-3">
                  <p className="text-indigo-300 text-sm">⚡ 2025 Update: 20% debt waiver applied June 1st. New repayment threshold: $67,000</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Current HECS Balance ($)</label>
                  <input 
                    type="number" 
                    value={hecsBalance}
                    onChange={(e) => setHecsBalance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Your Annual Income ($)</label>
                  <input 
                    type="number" 
                    value={hecsIncome}
                    onChange={(e) => setHecsIncome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
                  />
                </div>
                
                <div className="bg-slate-950 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">20% Waiver Savings</span>
                    <span className="text-emerald-400 font-bold">-${(parseFloat(hecsBalance || '0') * 0.2).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">New Balance (Est)</span>
                    <span className="text-white font-bold">${(parseFloat(hecsBalance || '0') * 0.8).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Required to Pay?</span>
                    <span className={`font-bold ${parseFloat(hecsIncome || '0') < 67000 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {parseFloat(hecsIncome || '0') < 67000 ? 'NO' : 'YES'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-4">
                  <p className="text-cyan-300 text-sm font-bold mb-2">💡 BillBot Says:</p>
                  <p className="text-slate-300 text-sm">
                    {parseFloat(hecsIncome || '0') < 67000 
                      ? "You're below the threshold! No compulsory repayments needed. Keep that cash in savings instead."
                      : parseFloat(hecsBalance || '0') > 50000
                        ? "Big debt but don't rush to pay it off voluntarily. HECS indexation (4%) is cheaper than mortgage rates (6%+). Put extra cash in your offset instead."
                        : "Moderate debt. Focus on high-interest debt first (credit cards, car loans). HECS can wait."}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Tax Lookup Tool */}
          {activeTool === 'tax' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 animate-in slide-in-from-right">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">🔍 Tax Deduction Lookup</h3>
                <button onClick={() => setActiveTool(null)} className="text-slate-500 hover:text-white">← Back</button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Search work-related assets</label>
                  <input 
                    type="text" 
                    value={taxQuery}
                    onChange={(e) => searchTax(e.target.value)}
                    placeholder="e.g. laptop, phone, desk..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
                  />
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {taxResults.map((item, i) => (
                    <div key={i} className="bg-slate-950 rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{item.asset}</p>
                        <p className="text-slate-500 text-xs">Effective Life: {item.lifeYears} years</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">{(item.rate * 100).toFixed(0)}%</p>
                        <p className="text-slate-500 text-xs">per year</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3">
                  <p className="text-amber-300 text-xs">💡 If it costs under $300 and is work-related, you can claim the full amount immediately. Over $300? Depreciate over time using these rates.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* ABN Validator Tool */}
          {activeTool === 'abn' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 animate-in slide-in-from-right">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">✅ ABN Validator</h3>
                <button onClick={() => setActiveTool(null)} className="text-slate-500 hover:text-white">← Back</button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Enter ABN (11 digits)</label>
                  <input 
                    type="text" 
                    value={abnInput}
                    onChange={(e) => setAbnInput(e.target.value)}
                    placeholder="e.g. 51 824 753 556"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
                    maxLength={14}
                  />
                </div>
                
                <button 
                  onClick={() => validateABN(abnInput)}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-xl transition-colors"
                >
                  Validate ABN
                </button>
                
                {abnResult && (
                  <div className={`rounded-xl p-4 ${abnResult.isValid ? 'bg-emerald-900/30 border border-emerald-500/30' : 'bg-rose-900/30 border border-rose-500/30'}`}>
                    <p className={`font-bold ${abnResult.isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {abnResult.message}
                    </p>
                    {!abnResult.isValid && (
                      <p className="text-slate-400 text-sm mt-2">⚠️ Be careful! This ABN doesn't pass the official checksum. The business may be fraudulent or the number was typed incorrectly.</p>
                    )}
                  </div>
                )}
                
                <div className="bg-slate-950 rounded-xl p-3">
                  <p className="text-slate-400 text-xs">ABN validation uses the official ATO algorithm to check if an ABN is mathematically valid. A valid checksum doesn't guarantee the business is legitimate - always verify on the ABN Lookup website for business details.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [impulseItems, setImpulseItems] = useState<ImpulseItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  
  // UI State
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWeeklyBriefing, setShowWeeklyBriefing] = useState(false);
  
  // Health
  const [health, setHealth] = useState<FinancialHealth>({
    annualSalary: 85000,
    monthlyIncome: 5200,
    salarySacrifice: 0,
    savings: 0, 
    hecsDebt: 0,
    mortgageBalance: 0,
    otherDebts: 0,
    monthlyExpenses: 3200,
    survivalNumber: 2800,
    score: 50,
    willpowerPoints: 0,
    taxVault: 0,
    isStudent: false,
    checkInStreak: 0
  });

  // Load Data on Mount
  useEffect(() => {
    const savedHealth = loadFinancialHealth();
    const savedSubs = loadSubscriptions();
    const savedAcc = loadAccounts();
    const savedGoals = loadGoals();
    
    if (savedHealth) setHealth({...health, ...savedHealth});
    
    if (savedSubs.length > 0) setSubscriptions(savedSubs);
    else setSubscriptions(DUMMY_SUBSCRIPTIONS);

    if (savedAcc.length > 0) setAccounts(savedAcc);
    else setAccounts(DUMMY_ACCOUNTS);
    
    if (savedGoals.length > 0) setGoals(savedGoals);
    else setGoals(DUMMY_GOALS);
    
    const savedBills = loadBills();
    if (savedBills.length > 0) setBills(savedBills);
    else setBills(DUMMY_BILLS);

    // Check Welcome Status
    const hasSeenWelcome = localStorage.getItem('BILLBOT_HAS_SEEN_TUTORIAL');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  // Persistence Effects
  useEffect(() => { saveFinancialHealth(health); }, [health]);
  useEffect(() => { saveSubscriptions(subscriptions); }, [subscriptions]);
  useEffect(() => { saveGoals(goals); }, [goals]);
  useEffect(() => { saveBills(bills); }, [bills]);
  
  // Account Change Logic
  useEffect(() => { 
    saveAccounts(accounts);
    const savings = accounts.filter(a => ['CASH', 'SAVINGS', 'INVESTMENT', 'SUPER'].includes(a.type)).reduce((sum, a) => sum + a.balance, 0);
    const hecs = accounts.filter(a => a.type === 'HECS').reduce((sum, a) => sum + a.balance, 0);
    const otherDebts = accounts.filter(a => ['LOAN', 'CREDIT_CARD'].includes(a.type)).reduce((sum, a) => sum + a.balance, 0);
    
    const netWorth = savings - (hecs + otherDebts);
    let newScore = 50;
    if (netWorth > 10000) newScore += 10;
    if (netWorth > 50000) newScore += 10;
    if (otherDebts === 0) newScore += 20;
    if (otherDebts > 5000) newScore -= 10;
    
    setHealth(prev => ({
      ...prev,
      savings,
      hecsDebt: hecs,
      otherDebts,
      score: Math.min(100, Math.max(0, newScore))
    }));
  }, [accounts]);

  const handleWelcomeComplete = () => {
    localStorage.setItem('BILLBOT_HAS_SEEN_TUTORIAL', 'true');
    setShowWelcome(false);
  };

  const navItems = [
    { view: AppView.HOME, icon: '🏠', label: 'Home' },
    { view: AppView.MONEY, icon: '💸', label: 'Cash' },
    { view: AppView.GOALS, icon: '🎯', label: 'Targets' },
    { view: AppView.HELP, icon: '🛟', label: 'Support' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      
      {showWelcome && <WelcomeOverlay onComplete={handleWelcomeComplete} />}
      
      {showWeeklyBriefing && (
        <WeeklyBriefing 
          accounts={accounts}
          onUpdateAccounts={setAccounts}
          onComplete={() => {
            setShowWeeklyBriefing(false);
            setHealth(prev => ({
              ...prev,
              checkInStreak: (prev.checkInStreak || 0) + 1,
              lastCheckIn: new Date().toISOString()
            }));
          }}
        />
      )}

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 pt-6">
        {view === AppView.HOME && (
          <HomeView 
            health={health}
            accounts={accounts}
            goals={goals}
            subscriptions={subscriptions}
            impulseItems={impulseItems}
            onNavigate={setView}
            onShowCheckIn={() => setShowWeeklyBriefing(true)}
          />
        )}
        
        {view === AppView.MONEY && (
          <MoneyView 
            health={health}
            accounts={accounts}
            subscriptions={subscriptions}
            transactions={transactions}
            bills={bills}
            onUpdateHealth={setHealth}
            onUpdateAccounts={setAccounts}
            onUpdateSubscriptions={setSubscriptions}
            onUpdateTransactions={setTransactions}
            onUpdateBills={setBills}
          />
        )}
        
        {view === AppView.GOALS && (
          <GoalsView 
            health={health}
            goals={goals}
            onUpdateHealth={setHealth}
            onUpdateGoals={setGoals}
          />
        )}
        
        {view === AppView.HELP && (
          <HelpView health={health} accounts={accounts} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 pb-safe">
        <div className="max-w-lg mx-auto flex">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all relative ${view === item.view ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <span className={`text-2xl transition-transform ${view === item.view ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className="text-xs font-bold">{item.label}</span>
              {view === item.view && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
