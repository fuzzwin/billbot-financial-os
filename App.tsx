
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { AppView, FinancialHealth, Transaction, Subscription, AccountItem, ImpulseItem, Goal } from './types';
import { IsometricCity } from './components/IsometricCity';
import { WeeklyBriefing } from './components/WeeklyBriefing';
import { loadFinancialHealth, saveFinancialHealth, loadTransactions, saveTransactions, loadSubscriptions, saveSubscriptions, loadAccounts, saveAccounts, loadImpulseItems, saveImpulseItems, loadGoals, saveGoals } from './services/storageService';

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

// --- MONEY VIEW ---
const MoneyView = ({ 
  health, 
  accounts, 
  subscriptions,
  onUpdateHealth,
  onUpdateAccounts,
  onUpdateSubscriptions
}: { 
  health: FinancialHealth, 
  accounts: AccountItem[], 
  subscriptions: Subscription[],
  onUpdateHealth: (h: FinancialHealth) => void,
  onUpdateAccounts: (a: AccountItem[]) => void,
  onUpdateSubscriptions: (s: Subscription[]) => void
}) => {
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'subscriptions'>('overview');
  
  const monthlySubTotal = subscriptions.reduce((sum, s) => {
    if (s.cycle === 'WEEKLY') return sum + (s.amount * 4.33);
    if (s.cycle === 'YEARLY') return sum + (s.amount / 12);
    return sum + s.amount;
  }, 0);
  
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
      <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl">
        {(['overview', 'accounts', 'subscriptions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === tab ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
          >
            {tab === 'overview' ? '📊 Overview' : tab === 'accounts' ? '🏦 Accounts' : '📅 Subs'}
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
                <span className="text-slate-400">Fixed Expenses</span>
                <span className="text-white font-bold">${health.monthlyExpenses.toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Subscriptions</span>
                <span className="text-white font-bold">${monthlySubTotal.toFixed(0)}/mo</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
              <span className="text-slate-300 font-bold">Total Outflow</span>
              <span className="text-rose-400 font-black text-xl">${(health.monthlyExpenses + monthlySubTotal).toLocaleString()}</span>
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
            <h3 className="text-emerald-400 font-bold mb-4">💚 Assets</h3>
            <div className="space-y-3">
              {assets.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                  <div>
                    <p className="text-white font-medium">{acc.name}</p>
                    <p className="text-xs text-slate-500">{acc.type}</p>
                  </div>
                  <span className="text-emerald-400 font-bold">${acc.balance.toLocaleString()}</span>
                </div>
              ))}
              {assets.length === 0 && (
                <p className="text-slate-500 text-center py-4">No assets yet</p>
              )}
            </div>
          </div>
          
          {/* Liabilities */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-rose-400 font-bold mb-4">❤️ Liabilities</h3>
            <div className="space-y-3">
              {liabilities.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                  <div>
                    <p className="text-white font-medium">{acc.name}</p>
                    <p className="text-xs text-slate-500">{acc.type} {acc.interestRate && `• ${acc.interestRate}% APR`}</p>
                  </div>
                  <span className="text-rose-400 font-bold">-${acc.balance.toLocaleString()}</span>
                </div>
              ))}
              {liabilities.length === 0 && (
                <p className="text-slate-500 text-center py-4">No debts! 🎉</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-400 font-bold">💡 Subscriptions cost you ${(monthlySubTotal * 12).toFixed(0)}/year</p>
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
                <p className="text-slate-500 text-sm">${sub.amount}/{sub.cycle.toLowerCase()}</p>
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
            <div className="text-center py-8 text-slate-500">
              <p className="text-4xl mb-2">🎉</p>
              <p>No subscriptions! You're subscription-free.</p>
            </div>
          )}
        </div>
      )}
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
                  <span className={`px-2 py-1 rounded text-xs font-bold ${isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                    {percent}%
                  </span>
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
                  <span className="text-amber-400 font-bold">{percent}%</span>
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
    </div>
  );
};

// --- HELP VIEW ---
const HelpView = ({ health, accounts }: { health: FinancialHealth, accounts: AccountItem[] }) => {
  const [activeSection, setActiveSection] = useState<'chat' | 'crisis' | 'tools'>('chat');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'bot', text: string}>>([
    { role: 'bot', text: "Hey! I'm BillBot. What's on your mind? 💬" }
  ]);
  
  const isCrisis = health.monthlyExpenses > health.monthlyIncome;
  
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
          <button className="w-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 text-left transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-3xl">🎓</div>
              <div>
                <h3 className="text-white font-bold">HECS/HELP Strategy</h3>
                <p className="text-slate-500 text-sm">Should you pay it off early?</p>
              </div>
            </div>
          </button>
          
          <button className="w-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 text-left transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-3xl">🔍</div>
              <div>
                <h3 className="text-white font-bold">Tax Deduction Lookup</h3>
                <p className="text-slate-500 text-sm">Check if something is deductible</p>
              </div>
            </div>
          </button>
          
          <button className="w-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 text-left transition-colors">
            <div className="flex items-center gap-4">
              <div className="text-3xl">✅</div>
              <div>
                <h3 className="text-white font-bold">ABN Validator</h3>
                <p className="text-slate-500 text-sm">Check if a business is legit</p>
              </div>
            </div>
          </button>
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
            onUpdateHealth={setHealth}
            onUpdateAccounts={setAccounts}
            onUpdateSubscriptions={setSubscriptions}
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
