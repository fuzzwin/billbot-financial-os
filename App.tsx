
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { AppView, FinancialHealth, Transaction, Subscription, AccountItem, ImpulseItem, Goal, AccountType, Bill, BillCategory } from './types';
import { IsometricCity } from './components/IsometricCity';
import { WeeklyBriefing } from './components/WeeklyBriefing';
import { Advisor } from './components/Advisor';
import { loadFinancialHealth, saveFinancialHealth, loadTransactions, saveTransactions, loadSubscriptions, saveSubscriptions, loadAccounts, saveAccounts, loadImpulseItems, saveImpulseItems, loadGoals, saveGoals, loadBills, saveBills } from './services/storageService';
import { TactileButton } from './components/ui/TactileButton';
import { RecessedInput } from './components/ui/RecessedInput';
import { ChassisWell } from './components/ui/ChassisWell';
import { LEDIndicator } from './components/ui/LEDIndicator';

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-industrial-base text-industrial-text p-8">
          <ChassisWell className="max-w-2xl w-full" label="Critical System Fault">
              <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-industrial-orange rounded-2xl flex items-center justify-center text-4xl shadow-lg mb-8 text-white">
                      ⚠️
                  </div>
                  <h1 className="text-2xl font-black mb-4 uppercase tracking-tighter">System Kernel Panic</h1>
                  <p className="mb-8 text-industrial-subtext text-sm font-medium leading-relaxed">
                    A critical error has occurred in the financial grid. Emergency restart protocol is required.
                  </p>
                  
                  <div className="w-full bg-industrial-well-bg p-6 rounded-2xl shadow-well border-t border-l border-black/5 mb-8 overflow-auto">
                    <pre className="text-left text-[10px] font-mono text-industrial-orange/80 leading-tight">
                      {this.state.error?.toString()}
                    </pre>
                  </div>
                  
                  <TactileButton 
                    onClick={() => window.location.reload()}
                    color="orange"
                    fullWidth
                    size="lg"
                  >
                    Initiate Cold Reboot
                  </TactileButton>
              </div>
          </ChassisWell>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-industrial-base/95 p-6 backdrop-blur-sm">
      <ChassisWell className="max-w-md w-full !p-8" label="System Initialization">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-industrial-base/50 rounded-3xl flex items-center justify-center text-6xl shadow-well mb-10 border-t border-l border-white/10">
            {current.icon}
          </div>
          <h2 className="text-2xl font-black text-industrial-text mb-3 uppercase tracking-tighter">{current.title}</h2>
          <p className="text-industrial-subtext mb-12 leading-relaxed text-sm font-medium px-4">{current.text}</p>
          
          <div className="w-full flex justify-between items-center bg-industrial-base/30 p-5 rounded-2xl shadow-well mb-10 border-t border-l border-black/5">
            <div className="flex gap-4">
              {steps.map((_, i) => (
                <LEDIndicator key={i} active={i === step} color="orange" />
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-industrial-subtext/60">Boot: {step + 1}/{steps.length}</span>
          </div>

          <TactileButton 
            onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            color={isLast ? "orange" : "white"}
            fullWidth
            size="lg"
            className="!rounded-2xl"
          >
            {isLast ? "INITIALIZE OS" : "LOAD NEXT MODULE"}
          </TactileButton>
        </div>
      </ChassisWell>
    </div>
  );
};

// --- THEME TOGGLE ---
type ThemeMode = 'light' | 'mid' | 'dark';
const getThemeIcon = (theme: ThemeMode) => {
  switch (theme) {
    case 'light': return '☀️';
    case 'mid': return '🌤️';
    case 'dark': return '🌙';
  }
};
const ThemeToggle = ({ theme, onToggle }: { theme: ThemeMode, onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className="w-9 h-9 flex items-center justify-center bg-industrial-base rounded-xl shadow-tactile-raised border-t border-l border-industrial-highlight/50 active:shadow-well active:scale-95 transition-all"
    title={`Theme: ${theme}`}
  >
    <span className="text-base">{getThemeIcon(theme)}</span>
  </button>
);

// --- HEALTH SCORE RING ---
const HealthScoreRing = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 45;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#F3CF44' : '#FF4F00';
  
  return (
    <div className="relative w-28 h-28 flex items-center justify-center bg-industrial-base rounded-full shadow-well">
      <svg className="w-[90%] h-[90%] transform -rotate-90 drop-shadow-sm">
        <circle cx="50%" cy="50%" r="40%" stroke="var(--color-well-bg)" strokeWidth="8" fill="none" />
        <circle 
          cx="50%" cy="50%" r="40%" 
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
        <span className="text-3xl font-black text-industrial-text tracking-tighter">{score}</span>
        <span className="text-[9px] font-black uppercase tracking-tighter text-industrial-subtext/60">Rating</span>
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
    <div className="bg-industrial-base border border-white/10 rounded-2xl p-5 shadow-tactile-raised">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="tactile-label text-industrial-subtext/60 mb-1">Monthly Surplus</p>
          <p className={`text-3xl font-black tracking-tighter ${isHealthy ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isHealthy ? '+' : ''}${surplus.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <LEDIndicator active={isHealthy} color={isHealthy ? 'green' : 'red'} label={isHealthy ? 'Status: OK' : 'Status: DEFICIT'} />
        </div>
      </div>
      
      <div className="h-6 bg-industrial-well-bg rounded-lg shadow-well overflow-hidden mb-3 p-1">
        <div 
          className={`h-full rounded-md transition-all duration-1000 ${isHealthy ? 'bg-industrial-blue' : 'bg-industrial-orange'}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      
      <div className="flex justify-between">
        <div className="flex flex-col">
          <span className="tactile-label text-industrial-subtext/60">Expenses</span>
          <span className="text-xs font-bold text-industrial-text">${expenses.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="tactile-label text-industrial-subtext/60">Income</span>
          <span className="text-xs font-bold text-industrial-text">${income.toLocaleString()}</span>
        </div>
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
        title: "Deficit Detected",
        description: `Gap: $${Math.abs(surplus).toLocaleString()}. Action required.`,
        action: "Fix Flow",
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
        title: `${killable.length} Redundant Subscriptions`,
        description: `Potentially $${(total * 12).toFixed(0)}/yr in savings.`,
        action: "Review",
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
        title: `Target Lag: ${underfunded[0].name}`,
        description: "Velocity below threshold for deadline.",
        action: "Boost",
        view: AppView.GOALS,
        urgent: false
      };
    }
    
    // Ready to unlock
    const ready = goals.filter(g => g.currentAmount >= g.targetAmount);
    if (ready.length > 0) {
      return {
        icon: "🎉",
        title: `${ready[0].name} Complete`,
        description: "Funds allocated. Ready for deployment.",
        action: "Deploy",
        view: AppView.GOALS,
        urgent: false
      };
    }
    
    // All good
    return {
      icon: "✨",
      title: "System Nominal",
      description: `All financial vectors on track.`,
      action: "Status",
      view: AppView.GOALS,
      urgent: false
    };
  };
  
  const action = getNextAction();
  
  return (
    <button 
      onClick={() => onAction(action.view)}
      className={`w-full text-left bg-industrial-base border-t border-l border-white/10 rounded-xl p-4 shadow-tactile-raised group transition-all duration-75 active:shadow-tactile-pressed active:translate-y-[1px]`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center bg-industrial-well-bg rounded-lg shadow-well">
          <span className={`text-2xl ${action.urgent ? 'animate-pulse' : ''}`}>{action.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <LEDIndicator active={action.urgent} color="red" />
            <h3 className="text-industrial-text font-black text-sm uppercase tracking-tighter truncate">{action.title}</h3>
          </div>
          <p className="text-industrial-subtext text-[11px] font-medium truncate">{action.description}</p>
        </div>
        <div className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-tighter whitespace-nowrap shadow-tactile-sm ${action.urgent ? 'bg-industrial-orange text-white' : 'bg-industrial-blue text-white'}`}>
          {action.action}
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
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Net Worth', value: `$${Math.abs(netWorth).toLocaleString()}`, color: netWorth >= 0 ? 'text-emerald-600' : 'text-rose-600' },
        { label: 'Targets', value: activeGoals, color: 'text-industrial-blue' },
        { label: 'Willpower', value: health.willpowerPoints || 0, color: 'text-industrial-yellow' }
      ].map((stat, i) => (
        <div key={i} className="bg-industrial-base border-t border-l border-white/10 rounded-xl p-3 text-center shadow-tactile-sm">
          <p className={`text-lg font-black tracking-tighter ${stat.color}`}>
            {stat.value}
          </p>
          <p className="tactile-label text-industrial-subtext/60 mt-1">{stat.label}</p>
        </div>
      ))}
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
  impulseItems,
  theme,
  onToggleTheme
}: { 
  health: FinancialHealth, 
  accounts: AccountItem[], 
  goals: Goal[],
  subscriptions: Subscription[],
  onNavigate: (view: AppView) => void,
  onShowCheckIn: () => void,
  impulseItems: ImpulseItem[],
  theme: ThemeMode,
  onToggleTheme: () => void
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
  
  // Theme-aware UI colors
  return (
    <div className="animate-in fade-in duration-500 -mx-4 -mt-6 flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
      {/* City Container - Takes available space */}
      <div className="relative flex-1 min-h-0 bg-industrial-well-bg">
        {/* The City */}
        <div className="absolute inset-0">
          <IsometricCity 
            accounts={accounts}
            health={health}
            goals={goals}
            theme={theme}
            subscriptions={subscriptions}
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
        <div className="absolute top-0 left-0 right-0 z-30 p-3 pointer-events-none">
          <div className="flex flex-col gap-2">
            {/* Header Row */}
            <div className="flex justify-between items-center pointer-events-auto">
              <div className="bg-industrial-base/95 backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-3 shadow-tactile-raised border-t border-l border-industrial-highlight/50">
                <div className="relative w-10 h-10 flex items-center justify-center bg-industrial-well-bg rounded-lg shadow-well">
                  <span className="text-lg font-black text-industrial-text tracking-tighter">{health.score}</span>
                  <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-industrial-base ${health.score >= 70 ? 'bg-emerald-500' : health.score >= 40 ? 'bg-amber-500' : 'bg-orange-500'}`} />
                </div>
                <div>
                  <h1 className="text-xs font-black text-industrial-text uppercase tracking-tighter">BillBot OS</h1>
                  <p className="text-[9px] font-bold text-industrial-subtext uppercase">V2.5 // INDUSTRIAL</p>
                </div>
              </div>
              
              <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>
            
            {/* Insight Card */}
            <div className="flex justify-center pointer-events-auto">
              <div className="bg-neutral-700 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg border border-white/10">
                <span className="text-base">{getInsight().icon}</span>
                <p className="text-[9px] font-bold text-white/90 uppercase tracking-wider leading-tight max-w-[200px]">{getInsight().text}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* BOTTOM SECTION: Stats + Actions - Fixed at bottom, above nav */}
      <div className="bg-industrial-base px-4 py-3 space-y-2">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Asset Value', value: `$${Math.abs(netWorth).toLocaleString()}`, color: netWorth >= 0 ? 'text-emerald-600' : 'text-orange-500' },
            { label: 'Active Mods', value: activeGoals, color: 'text-blue-600' },
            { label: 'Power Level', value: health.willpowerPoints || 0, color: 'text-amber-600' }
          ].map((stat, i) => (
            <div key={i} className="bg-industrial-well-bg rounded-xl p-2 text-center shadow-well">
              <p className={`text-sm font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
              <p className="text-[8px] font-bold text-industrial-subtext uppercase mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
        
        {/* Action Buttons Row */}
        <div className="flex gap-2">
          <TactileButton 
            onClick={() => onNavigate(surplus < 0 ? AppView.MONEY : AppView.GOALS)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5"
            color={action.urgent ? "orange" : "white"}
          >
            <span className="text-base">{action.icon}</span>
            <span className="text-sm">{action.text}</span>
          </TactileButton>
          
          <TactileButton 
            onClick={onShowCheckIn}
            color="blue"
            className="flex items-center gap-2 px-6 py-2.5"
          >
            <span className="text-base">⚡</span>
            <span className="text-sm">Sync</span>
            <div className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-black">{health.checkInStreak || 0}🔥</div>
          </TactileButton>
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
    <div className="fixed inset-0 bg-industrial-base/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <ChassisWell className="max-w-md w-full" label={account ? 'Edit Asset Module' : 'Initialize New Asset'}>
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="tactile-label px-1">Unit Classification</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full bg-industrial-base rounded-xl px-4 py-3 text-sm font-bold text-industrial-text shadow-well outline-none appearance-none border-t border-l border-white/5"
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

          <RecessedInput 
            label="Module Identifier"
            placeholder="e.g. NAB High Interest" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <RecessedInput 
            label="Current Value ($)"
            type="number" 
            placeholder="0.00" 
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />

          {isDebt && type !== 'HECS' && (
            <RecessedInput 
              label="Operational Rate (% APR)"
              type="number" 
              placeholder="e.g. 18.5" 
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
            />
          )}

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 tactile-label text-industrial-subtext/40 hover:text-industrial-text transition-colors">
              Abort
            </button>
            <TactileButton 
              onClick={handleSave} 
              disabled={!name || !balance}
              color="orange"
              className="flex-1"
            >
              {account ? 'Sync' : 'Confirm'}
            </TactileButton>
          </div>
        </div>
      </ChassisWell>
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
    <div className="fixed inset-0 bg-industrial-base/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <ChassisWell className="max-w-md w-full" label="Register Service Agreement">
        <div className="space-y-6">
          <RecessedInput 
            label="Service Provider"
            placeholder="e.g. Netflix" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <RecessedInput 
            label="Recurring Cost ($)"
            type="number" 
            placeholder="0.00" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="tactile-label px-1">Billing Interval</label>
            <select 
              value={cycle} 
              onChange={(e) => setCycle(e.target.value as 'MONTHLY' | 'YEARLY' | 'WEEKLY')}
              className="w-full bg-industrial-base rounded-xl px-4 py-3 text-sm font-bold text-industrial-text shadow-well outline-none appearance-none border-t border-l border-white/5"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="tactile-label px-1">Classification</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-industrial-base rounded-xl px-4 py-3 text-sm font-bold text-industrial-text shadow-well outline-none appearance-none border-t border-l border-white/5"
            >
              <option value="Entertainment">Entertainment</option>
              <option value="Health">Health & Fitness</option>
              <option value="Software">Software & Apps</option>
              <option value="News">News & Media</option>
              <option value="Utilities">Utilities</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 tactile-label text-industrial-subtext/40 hover:text-industrial-text transition-colors">
              Abort
            </button>
            <TactileButton 
              onClick={handleSave} 
              disabled={!name || !amount}
              color="blue"
              className="flex-1"
            >
              Confirm
            </TactileButton>
          </div>
        </div>
      </ChassisWell>
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
    <div className="fixed inset-0 bg-industrial-base/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <ChassisWell className="max-w-md w-full max-h-[90vh] overflow-y-auto" label={bill ? 'Update Obligation' : 'Register New Bill'}>
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="tactile-label px-1">Classification</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value as BillCategory)}
              className="w-full bg-industrial-base rounded-xl px-4 py-3 text-sm font-bold text-industrial-text shadow-well outline-none appearance-none border-t border-l border-white/5"
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <RecessedInput 
            label="Creditor / Provider"
            placeholder="e.g. AGL Electricity" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <RecessedInput 
            label="Invoiced Amount ($)"
            type="number" 
            placeholder="0.00" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="tactile-label px-1">Invoicing Cycle</label>
            <select 
              value={cycle} 
              onChange={(e) => setCycle(e.target.value as Bill['cycle'])}
              className="w-full bg-industrial-base rounded-xl px-4 py-3 text-sm font-bold text-industrial-text shadow-well outline-none appearance-none border-t border-l border-white/5"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="FORTNIGHTLY">Fortnightly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          <RecessedInput 
            label="Execution Date"
            type="date" 
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
          />

          <RecessedInput 
            label="Parameters / Notes"
            placeholder="e.g. Account #12345" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="bg-industrial-well-bg p-4 rounded-xl shadow-well border-t border-l border-black/5 flex items-center gap-3 cursor-pointer" onClick={() => setIsAutoPay(!isAutoPay)}>
            <div className={`w-5 h-5 rounded border border-black/20 flex items-center justify-center transition-all ${isAutoPay ? 'bg-emerald-500 border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-industrial-base shadow-inner'}`}>
              {isAutoPay && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-xs font-black text-industrial-text uppercase tracking-tighter">Automated Execution Active</span>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 tactile-label text-industrial-subtext/40 hover:text-industrial-text transition-colors">
              Abort
            </button>
            <TactileButton 
              onClick={handleSave} 
              disabled={!name || !amount}
              color="orange"
              className="flex-1"
            >
              Confirm
            </TactileButton>
          </div>
        </div>
      </ChassisWell>
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
    <div className="fixed inset-0 bg-industrial-base/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <ChassisWell className="max-w-md w-full" label="Manual Transaction Entry">
        <div className="space-y-6">
          <RecessedInput 
            label="Merchant Identifier"
            placeholder="e.g. Woolworths" 
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />

          <RecessedInput 
            label="Transaction Value ($)"
            type="number" 
            placeholder="0.00" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <RecessedInput 
            label="Execution Date"
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="tactile-label px-1">Classification</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-industrial-base rounded-xl px-4 py-3 text-sm font-bold text-industrial-text shadow-well outline-none appearance-none border-t border-l border-white/5"
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

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 tactile-label text-industrial-subtext/40 hover:text-industrial-text transition-colors">
              Abort
            </button>
            <TactileButton 
              onClick={handleSave} 
              disabled={!merchant || !amount}
              color="blue"
              className="flex-1"
            >
              Confirm
            </TactileButton>
          </div>
        </div>
      </ChassisWell>
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
  onUpdateBills,
  theme = 'mid'
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
  theme?: ThemeMode,
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
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="px-2">
        <h1 className="text-3xl font-black text-industrial-text uppercase tracking-tighter">Cashflow Control</h1>
        <div className="flex items-center gap-2 mt-1">
          <LEDIndicator active={true} color="blue" />
          <p className="tactile-label text-industrial-subtext/60">Registry // Liquidity Status</p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 bg-industrial-well-bg p-2 rounded-2xl shadow-well overflow-x-auto">
        {(['overview', 'accounts', 'bills', 'subscriptions', 'transactions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[60px] py-3 px-2 rounded-xl transition-all duration-75 relative ${activeTab === tab ? 'bg-industrial-base shadow-tactile-sm text-industrial-text' : 'text-industrial-subtext hover:text-industrial-text'}`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">{tab === 'overview' ? '📊' : tab === 'accounts' ? '🏦' : tab === 'bills' ? '🧾' : tab === 'subscriptions' ? '📺' : '💳'}</span>
              <span className="text-[9px] font-black uppercase tracking-tighter">{tab}</span>
            </div>
            {activeTab === tab && <div className="absolute top-1 right-1"><LEDIndicator active color="blue" /></div>}
          </button>
        ))}
      </div>
      
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Income */}
          <ChassisWell label="Revenue Inputs">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-industrial-well-bg rounded-lg shadow-well flex items-center justify-center">💰</div>
                <h3 className="text-sm font-black text-industrial-text uppercase tracking-tighter">Monthly Intake</h3>
              </div>
              <TactileButton 
                onClick={() => setShowAddIncome(!showAddIncome)}
                size="sm"
              >
                Config
              </TactileButton>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 bg-industrial-base px-5 rounded-2xl shadow-tactile-sm border-t border-l border-white/10">
                <span className="tactile-label">Primary Salary</span>
                <span className="text-lg font-black text-emerald-500 tracking-tighter">${health.monthlyIncome.toLocaleString()}</span>
              </div>
              {health.gigIncome && health.gigIncome > 0 && (
                <div className="flex justify-between items-center py-4 bg-industrial-base px-5 rounded-2xl shadow-tactile-sm border-t border-l border-white/10">
                  <span className="tactile-label">Gig / Side Income</span>
                  <span className="text-lg font-black text-emerald-500 tracking-tighter">${health.gigIncome.toLocaleString()}</span>
                </div>
              )}
              {health.taxVault > 0 && (
                <div className="flex justify-between items-center py-4 bg-industrial-dark-base px-5 rounded-2xl border border-white/5 shadow-lg">
                  <div className="flex items-center gap-2">
                    <LEDIndicator active color="orange" />
                    <span className="tactile-label text-white/40">Quarantined Tax</span>
                  </div>
                  <span className="text-lg font-black text-industrial-yellow tracking-tighter">-${health.taxVault.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {showAddIncome && (
              <div className="mt-8 pt-6 border-t border-industrial-well-shadow-light/50 space-y-6">
                <RecessedInput 
                  label="Monthly Net Intake" 
                  type="number"
                  value={health.monthlyIncome}
                  onChange={(e) => onUpdateHealth({...health, monthlyIncome: parseFloat(e.target.value) || 0})}
                />
                <RecessedInput 
                  label="Baseline Operational Expenses" 
                  type="number"
                  value={health.monthlyExpenses}
                  onChange={(e) => onUpdateHealth({...health, monthlyExpenses: parseFloat(e.target.value) || 0})}
                />
              </div>
            )}
          </ChassisWell>
          
          {/* Expenses Summary */}
          <ChassisWell label="Resource Outflow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-industrial-well-bg rounded-lg shadow-well flex items-center justify-center">💸</div>
              <h3 className="text-sm font-black text-industrial-text uppercase tracking-tighter">Allocation Summary</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 bg-industrial-base px-5 rounded-2xl shadow-tactile-sm border-t border-l border-white/10">
                <span className="tactile-label">Fixed Obligations</span>
                <span className="text-lg font-black text-industrial-text tracking-tighter">-${monthlyBillsTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-industrial-base px-5 rounded-2xl shadow-tactile-sm border-t border-l border-white/10">
                <span className="tactile-label">Service Subscriptions</span>
                <span className="text-lg font-black text-industrial-text tracking-tighter">-${monthlySubTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-industrial-base px-5 rounded-2xl shadow-tactile-sm border-t border-l border-white/10">
                <span className="tactile-label">Other Discretionary</span>
                <span className="text-lg font-black text-industrial-text tracking-tighter">-${health.monthlyExpenses.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-industrial-well-shadow-light/50 flex justify-between items-center">
              <span className="tactile-label text-industrial-subtext/60">Total Monthly Burn</span>
              <span className="text-2xl font-black text-industrial-orange tracking-tighter">-${(health.monthlyExpenses + monthlySubTotal + monthlyBillsTotal).toFixed(0)}</span>
            </div>
          </ChassisWell>
          
          {/* Surplus */}
          <div className={`p-6 rounded-[2rem] shadow-tactile-raised border-t border-l border-white/10 ${health.monthlyIncome - (health.monthlyExpenses + monthlySubTotal + monthlyBillsTotal) > 0 ? 'bg-emerald-500/5' : 'bg-industrial-orange/5'}`}>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <LEDIndicator active={true} color={health.monthlyIncome - (health.monthlyExpenses + monthlySubTotal + monthlyBillsTotal) > 0 ? 'green' : 'red'} />
                  <span className="tactile-label text-industrial-subtext">Operational Surplus</span>
                </div>
                <p className="text-industrial-subtext/40 text-[10px] font-bold uppercase tracking-tight">Net flow after all allocations</p>
              </div>
              <span className={`font-black text-3xl tracking-tighter ${health.monthlyIncome - (health.monthlyExpenses + monthlySubTotal + monthlyBillsTotal) > 0 ? 'text-emerald-500' : 'text-industrial-orange'}`}>
                ${(health.monthlyIncome - (health.monthlyExpenses + monthlySubTotal + monthlyBillsTotal)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Assets */}
          <ChassisWell label="Liquidity Assets">
            <div className="space-y-3">
              {assets.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-4 px-5 bg-industrial-base rounded-2xl shadow-tactile-sm border-t border-l border-white/10">
                  <div>
                    <p className="text-industrial-text font-black uppercase text-xs tracking-tighter">{acc.name}</p>
                    <p className="tactile-label mt-0.5">{acc.type}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-emerald-500 font-black tracking-tighter text-lg">${acc.balance.toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingAccount(acc); setShowAccountModal(true); }}
                        className="text-industrial-subtext hover:text-industrial-text transition-colors p-1"
                      >
                        [E]
                      </button>
                      <button 
                        onClick={() => onUpdateAccounts(accounts.filter(a => a.id !== acc.id))}
                        className="text-industrial-subtext hover:text-industrial-orange transition-colors p-1"
                      >
                        [X]
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <TactileButton 
                onClick={() => { setEditingAccount(null); setShowAccountModal(true); setNewAccountType('SAVINGS'); }}
                fullWidth
                color="blue"
                size="sm"
                className="mt-4"
              >
                + Initialize Asset
              </TactileButton>
            </div>
          </ChassisWell>
          
          {/* Liabilities */}
          <ChassisWell label="Debt Obligations">
            <div className="space-y-3">
              {liabilities.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-4 px-5 bg-industrial-base rounded-2xl shadow-tactile-sm border-t border-l border-white/10">
                  <div>
                    <p className="text-industrial-text font-black uppercase text-xs tracking-tighter">{acc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="tactile-label">{acc.type}</p>
                      {acc.interestRate && <span className="text-[8px] bg-industrial-orange/10 text-industrial-orange px-1 rounded font-black">{acc.interestRate}% APR</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-industrial-orange font-black tracking-tighter text-lg">-${acc.balance.toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingAccount(acc); setShowAccountModal(true); }}
                        className="text-industrial-subtext hover:text-industrial-text transition-colors p-1"
                      >
                        [E]
                      </button>
                      <button 
                        onClick={() => onUpdateAccounts(accounts.filter(a => a.id !== acc.id))}
                        className="text-industrial-subtext hover:text-industrial-orange transition-colors p-1"
                      >
                        [X]
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <TactileButton 
                onClick={() => { setEditingAccount(null); setShowAccountModal(true); setNewAccountType('CREDIT_CARD'); }}
                fullWidth
                color="orange"
                size="sm"
                className="mt-4"
              >
                + Initialize Debt
              </TactileButton>
            </div>
          </ChassisWell>

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
        <div className="space-y-6">
          <ChassisWell label="Operational Obligations">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="tactile-label">Monthly Burn</p>
                <p className="text-2xl font-black text-industrial-orange tracking-tighter">-${monthlyBillsTotal.toFixed(0)}</p>
              </div>
              <TactileButton 
                onClick={() => { setEditingBill(null); setShowBillModal(true); }}
                color="orange"
                size="sm"
              >
                + Initialize Bill
              </TactileButton>
            </div>
            
            <div className="space-y-6">
              {Object.entries(
                bills.reduce((acc, bill) => {
                  if (!acc[bill.category]) acc[bill.category] = [];
                  acc[bill.category].push(bill);
                  return acc;
                }, {} as Record<BillCategory, Bill[]>)
              ).map(([category, categoryBills]) => (
                <div key={category} className="space-y-3">
                  <h4 className="tactile-label px-2 opacity-50 flex items-center gap-2">
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
                        className={`bg-industrial-base rounded-2xl p-4 shadow-tactile-sm border-t border-l border-white/10 ${isOverdue ? 'ring-1 ring-industrial-orange/30' : isDueSoon ? 'ring-1 ring-industrial-yellow/30' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-industrial-text font-black uppercase text-xs tracking-tighter">{bill.name}</p>
                              {bill.isAutoPay && <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-1 rounded font-black">AUTO</span>}
                              {isOverdue && <span className="text-[8px] bg-industrial-orange/10 text-industrial-orange px-1 rounded font-black">OVERDUE</span>}
                              {isDueSoon && !isOverdue && <span className="text-[8px] bg-industrial-yellow/10 text-industrial-yellow px-1 rounded font-black">SOON</span>}
                            </div>
                            <p className="tactile-label mt-1 opacity-60">Due {bill.nextDueDate} // {bill.cycle.toLowerCase()}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-industrial-text font-black tracking-tighter">${bill.amount}</span>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingBill(bill); setShowBillModal(true); }} className="text-industrial-subtext hover:text-industrial-text p-1">[E]</button>
                              <button onClick={() => onUpdateBills(bills.filter(b => b.id !== bill.id))} className="text-industrial-subtext hover:text-industrial-orange p-1">[X]</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </ChassisWell>

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
        <div className="space-y-6">
          <ChassisWell label="Service Registry">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="tactile-label">Annual Burn</p>
                <p className="text-2xl font-black text-industrial-blue tracking-tighter">-${(monthlySubTotal * 12).toFixed(0)}</p>
              </div>
              <TactileButton 
                onClick={() => setShowSubModal(true)}
                color="blue"
                size="sm"
              >
                + Initialize Sub
              </TactileButton>
            </div>
            
            <div className="space-y-3">
              {subscriptions.map(sub => (
                <div 
                  key={sub.id} 
                  className={`bg-industrial-base rounded-2xl p-4 shadow-tactile-sm border-t border-l border-white/10 flex items-center justify-between ${sub.isOptimizable ? 'ring-1 ring-industrial-orange/30' : ''}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-industrial-text font-black uppercase text-xs tracking-tighter">{sub.name}</p>
                      {sub.isOptimizable && <span className="text-[8px] bg-industrial-orange/10 text-industrial-orange px-1 rounded font-black">AXE?</span>}
                    </div>
                    <p className="tactile-label mt-1 opacity-60">${sub.amount} // {sub.cycle.toLowerCase()} // {sub.category}</p>
                  </div>
                  <button 
                    onClick={() => killSubscription(sub.id)}
                    className="bg-industrial-orange text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm active:translate-y-[1px]"
                  >
                    Axe 🪓
                  </button>
                </div>
              ))}
              {subscriptions.length === 0 && (
                <p className="tactile-label text-center py-8 opacity-50">No active subscriptions.</p>
              )}
            </div>
          </ChassisWell>
        </div>
      )}
      
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <ChassisWell label="Ledger History">
            <div className="flex justify-between items-center mb-6">
              <p className="tactile-label opacity-50">{transactions.length} entries recorded</p>
              <TactileButton 
                onClick={() => setShowImportModal(true)}
                color="white"
                size="sm"
              >
                + Data Ingest
              </TactileButton>
            </div>
            
            {transactions.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {transactions.slice().reverse().map(t => (
                  <div key={t.id} className="bg-industrial-base/50 rounded-xl p-3 flex justify-between items-center border-b border-black/5 last:border-0 shadow-tactile-inset">
                    <div>
                      <p className="text-industrial-text font-black uppercase text-[10px] tracking-tighter">{t.merchant}</p>
                      <p className="text-[9px] font-bold text-industrial-subtext/60">{t.date} // {t.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-industrial-orange font-black tracking-tighter text-sm">-${t.amount.toLocaleString()}</span>
                      <button 
                        onClick={() => onUpdateTransactions(transactions.filter(tx => tx.id !== t.id))}
                        className="text-industrial-subtext hover:text-industrial-orange transition-colors"
                      >
                        [X]
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-black/5 rounded-2xl">
                <p className="tactile-label opacity-40 mb-4">Registry empty.</p>
                <TactileButton onClick={() => setShowImportModal(true)} size="sm">Ingest File</TactileButton>
              </div>
            )}
          </ChassisWell>

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
    <div className="fixed inset-0 bg-industrial-base/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <ChassisWell className="max-w-md w-full max-h-[90vh] overflow-y-auto" label={goal ? 'Modify Objective' : 'Initialize Objective'}>
        <div className="space-y-6">
          <div className="flex gap-4 bg-industrial-well-bg p-1.5 rounded-xl shadow-well">
            <button 
              onClick={() => setGoalType('rocket')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${goalType === 'rocket' ? 'bg-industrial-base shadow-tactile-sm text-industrial-blue' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
            >
              🎯 Primary Target
            </button>
            <button 
              onClick={() => setGoalType('impulse')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${goalType === 'impulse' ? 'bg-industrial-base shadow-tactile-sm text-industrial-orange' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
            >
              🅿️ Parked Request
            </button>
          </div>
          
          <div className="space-y-1.5">
            <label className="tactile-label px-1">Visual Identifier</label>
            <div className="grid grid-cols-6 gap-2 bg-industrial-well-bg p-3 rounded-xl shadow-well">
              {emojis.map(e => (
                <button 
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-xl p-2 rounded-lg transition-all ${emoji === e ? 'bg-industrial-base shadow-tactile-sm ring-1 ring-industrial-blue/30' : 'hover:bg-industrial-base/50'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <RecessedInput 
            label="Module Identifier"
            placeholder="e.g. Japan Trip" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <RecessedInput 
            label="Allocation Target ($)"
            type="number" 
            placeholder="0.00" 
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />

          {goal && (
            <RecessedInput 
              label="Currently Quarantined ($)"
              type="number" 
              placeholder="0.00" 
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
            />
          )}

          {goalType === 'rocket' && (
            <RecessedInput 
              label="Deadline (Optional)"
              type="date" 
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          )}

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 tactile-label text-industrial-subtext/40 hover:text-industrial-text transition-colors">
              Abort
            </button>
            <TactileButton 
              onClick={handleSave} 
              disabled={!name || !targetAmount}
              color="orange"
              className="flex-1"
            >
              {goal ? 'Sync' : 'Confirm'}
            </TactileButton>
          </div>
        </div>
      </ChassisWell>
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
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-3xl font-black text-industrial-text uppercase tracking-tighter">Strategic Targets</h1>
          <div className="flex items-center gap-2 mt-1">
            <LEDIndicator active={true} color="blue" />
            <p className="tactile-label text-industrial-subtext/60">Registry // Asset Allocation</p>
          </div>
        </div>
        <TactileButton 
          onClick={() => setShowNewGoal(true)}
          color="orange"
          size="sm"
        >
          + New Mod
        </TactileButton>
      </div>
      
      {/* Weekly Budget */}
      <ChassisWell label="Velocity Multiplier">
        <div className="flex justify-between items-center">
          <div>
            <p className="tactile-label text-industrial-subtext/60 mb-1">Available Weekly Ammo</p>
            <p className="text-3xl font-black text-industrial-text tracking-tighter">${weeklySurplus.toFixed(0)}</p>
          </div>
          <div className="w-14 h-14 bg-industrial-well-bg rounded-xl flex items-center justify-center text-3xl shadow-well">💰</div>
        </div>
      </ChassisWell>
      
      {/* New Goal Form */}
      {showNewGoal && (
        <ChassisWell label="Module Initialization" className="animate-in slide-in-from-top-4">
          <div className="space-y-6">
            <div className="flex gap-4 bg-industrial-well-bg p-1.5 rounded-xl shadow-well">
              <button 
                onClick={() => setNewGoalType('rocket')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${newGoalType === 'rocket' ? 'bg-industrial-base shadow-tactile-sm text-industrial-blue' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
              >
                🎯 Primary Target
              </button>
              <button 
                onClick={() => setNewGoalType('impulse')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${newGoalType === 'impulse' ? 'bg-industrial-base shadow-tactile-sm text-industrial-orange' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
              >
                🅿️ Parked Request
              </button>
            </div>
            
            <RecessedInput 
              label="Target Identifier"
              placeholder="e.g., Japan Sector Trip"
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
            />
            
            <RecessedInput 
              label="Required Allocation ($)"
              type="number"
              placeholder="0.00"
              value={newGoalAmount}
              onChange={(e) => setNewGoalAmount(e.target.value)}
            />
            
            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowNewGoal(false)} className="flex-1 tactile-label text-industrial-subtext/60 hover:text-industrial-text transition-colors">Cancel</button>
              <TactileButton onClick={addGoal} color="orange" className="flex-1">Initialize</TactileButton>
            </div>
          </div>
        </ChassisWell>
      )}
      
      {/* Targets (Serious Goals) */}
      {rockets.length > 0 && (
        <div className="space-y-4">
          <h3 className="tactile-label text-industrial-subtext/60 px-2">Primary Modules</h3>
            {rockets.map(goal => {
              const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
              const isReady = goal.currentAmount >= goal.targetAmount;
              const isLaunching = launchingId === goal.id;
              
              return (
                <div 
                  key={goal.id} 
                  className={`bg-industrial-base rounded-2xl p-5 shadow-tactile-sm border-t border-l border-white/10 transition-all ${isLaunching ? 'animate-pulse scale-105' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-industrial-base rounded-xl flex items-center justify-center text-2xl shadow-well border-t border-l border-black/5">
                        {goal.emoji || '🚀'}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-industrial-text uppercase tracking-tighter">{goal.name}</h4>
                        <p className="tactile-label opacity-60 mt-0.5">{goal.valueTag}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-1">
                        <LEDIndicator active={isReady} color="green" />
                        <span className="text-[10px] font-black text-industrial-subtext">{percent}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-4 bg-industrial-base rounded-lg shadow-well overflow-hidden mb-4 p-1 border-t border-l border-black/5">
                    <div 
                      className={`h-full rounded-md transition-all duration-1000 ${isReady ? 'bg-emerald-500' : 'bg-industrial-blue'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                      <span className="tactile-label opacity-50">Saved</span>
                      <span className="text-sm font-black text-industrial-text tracking-tighter">${goal.currentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="tactile-label opacity-50">Target</span>
                      <span className="text-sm font-black text-industrial-text tracking-tighter">${goal.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <TactileButton 
                      onClick={() => addCash(goal.id, 50)}
                      size="sm"
                      className="flex-1"
                      disabled={isReady}
                    >
                      +50 Unit
                    </TactileButton>
                    <TactileButton 
                      onClick={() => addCash(goal.id, weeklySurplus)}
                      size="sm"
                      className="flex-1"
                      disabled={isReady}
                    >
                      Max
                    </TactileButton>
                    {isReady && (
                      <TactileButton 
                        onClick={() => launchGoal(goal)}
                        color="orange"
                        size="sm"
                        className="flex-1"
                      >
                        Launch
                      </TactileButton>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Impulse/Parked (Delayed Gratification) */}
      {impulses.length > 0 && (
        <div className="space-y-4">
          <h3 className="tactile-label text-industrial-subtext/60 px-2">Parked Acquisitions</h3>
            {impulses.map(goal => {
              const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
              const isReady = goal.currentAmount >= goal.targetAmount;
              
              return (
                <div 
                  key={goal.id} 
                  className="bg-industrial-base rounded-2xl p-5 shadow-tactile-sm border-t border-l border-white/10"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-industrial-base rounded-xl flex items-center justify-center text-2xl shadow-well border-t border-l border-black/5">
                        {goal.emoji || '🎁'}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-industrial-text uppercase tracking-tighter">{goal.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <LEDIndicator active={true} color="yellow" />
                          <p className="tactile-label opacity-60">Status: Holding</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onUpdateGoals(goals.filter(g => g.id !== goal.id))}
                        className="tactile-label text-industrial-subtext hover:text-industrial-orange transition-colors"
                      >
                        [Delete]
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-4 bg-industrial-base rounded-lg shadow-well overflow-hidden mb-4 p-1 border-t border-l border-black/5">
                    <div 
                      className={`h-full rounded-md transition-all duration-1000 ${isReady ? 'bg-emerald-500' : 'bg-industrial-orange'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                      <span className="tactile-label opacity-50">Saved</span>
                      <span className="text-sm font-black text-industrial-text tracking-tighter">${goal.currentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="tactile-label opacity-50">Target</span>
                      <span className="text-sm font-black text-industrial-text tracking-tighter">${goal.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <TactileButton 
                      onClick={() => addCash(goal.id, 20)}
                      size="sm"
                      className="flex-1"
                      disabled={isReady}
                    >
                      +20 Feed
                    </TactileButton>
                    <TactileButton 
                      onClick={() => skipImpulse(goal)}
                      color="white"
                      size="sm"
                      className="flex-1"
                    >
                      Recycle
                    </TactileButton>
                    {isReady && (
                      <TactileButton 
                        onClick={() => skipImpulse(goal)}
                        color="orange"
                        size="sm"
                        className="flex-1"
                      >
                        Claim
                      </TactileButton>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
      
      {goals.length === 0 && (
        <div className="text-center py-20 bg-industrial-base rounded-[2rem] shadow-tactile-sm border-2 border-dashed border-black/5">
          <p className="tactile-label opacity-40 mb-4">No active missions registry.</p>
          <TactileButton onClick={() => setShowNewGoal(true)} color="blue" size="sm">Initialize Target</TactileButton>
        </div>
      )}
    </div>
  );
};

// --- HELP VIEW ---
const HelpView = ({ health, accounts }: { health: FinancialHealth, accounts: AccountItem[] }) => {
  const [activeSection, setActiveSection] = useState<'chat' | 'crisis' | 'tools'>('chat');
  const [activeTool, setActiveTool] = useState<'hecs' | 'tax' | 'abn' | null>(null);
  
  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="px-2">
        <h1 className="text-3xl font-black text-industrial-text uppercase tracking-tighter">Support & Ops</h1>
        <div className="flex items-center gap-2 mt-1">
          <LEDIndicator active={true} color="blue" />
          <p className="tactile-label text-industrial-subtext/60">System // Diagnostic Support</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 bg-industrial-well-bg p-2 rounded-2xl shadow-well">
        {(['chat', 'crisis', 'tools'] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`flex-1 py-3 px-2 rounded-xl transition-all duration-75 relative ${activeSection === section ? 'bg-industrial-base shadow-tactile-sm text-industrial-blue' : 'text-industrial-subtext hover:text-industrial-text'}`}
          >
            <span className="text-[10px] font-black uppercase tracking-tighter">{section}</span>
            {activeSection === section && <div className="absolute top-1 right-1"><LEDIndicator active color="blue" /></div>}
          </button>
        ))}
      </div>

      {activeSection === 'chat' && <Advisor health={health} />}

      {activeSection === 'tools' && (
        <div className="space-y-6">
          <ChassisWell label="Utility Modules">
            <div className="grid grid-cols-1 gap-4">
              <TactileButton onClick={() => setActiveTool('tax')} color="white" fullWidth className="flex justify-between items-center px-6">
                <span>ATO Asset Lookup</span>
                <LEDIndicator active={activeTool === 'tax'} color="green" />
              </TactileButton>
              <TactileButton onClick={() => setActiveTool('abn')} color="white" fullWidth className="flex justify-between items-center px-6">
                <span>ABN Validator</span>
                <LEDIndicator active={activeTool === 'abn'} color="green" />
              </TactileButton>
            </div>
          </ChassisWell>

          {activeTool === 'tax' && (
            <div className="animate-in slide-in-from-top-4">
              <ChassisWell label="ATO EFFECTIVE LIFE">
                <Advisor health={health} /> {/* Advisor component has the tools integrated */}
              </ChassisWell>
            </div>
          )}
        </div>
      )}

      {activeSection === 'crisis' && (
        <ChassisWell label="Critical Protocol" className="bg-industrial-orange/5 border-industrial-orange/10">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-20 h-20 bg-industrial-orange rounded-3xl flex items-center justify-center text-4xl shadow-lg mb-6 text-white animate-pulse">
              🚨
            </div>
            <h3 className="text-xl font-black text-industrial-text uppercase tracking-tighter mb-2">Hardship Protocol Active</h3>
            <p className="text-industrial-subtext text-sm font-medium mb-8 leading-relaxed">
              System indicates resource outflow exceeds capacity. Initialize emergency containment sequence:
            </p>
            
            <div className="w-full space-y-4 mb-10 text-left">
              {[
                { title: "Tier 1: Vital Stats", desc: "Rent, electricity, water, food", color: "blue" },
                { title: "Tier 2: Operational Mobility", desc: "Transport, phone, internet", color: "yellow" },
                { title: "Tier 3: Debt Moratorium", desc: "Credit cards, personal loans, BNPL", color: "orange" }
              ].map((tier, i) => (
                <div key={i} className="bg-industrial-base p-5 rounded-2xl shadow-well border-t border-l border-white/10 flex items-start gap-4">
                  <div className="mt-1"><LEDIndicator active color={tier.color as any} /></div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-industrial-text">{tier.title}</h4>
                    <p className="text-industrial-subtext/60 text-xs mt-1">{tier.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <TactileButton 
              onClick={() => window.open('https://www.moneysmart.gov.au/managing-your-money/managing-debts/financial-hardship', '_blank')}
              color="orange"
              fullWidth
              size="lg"
            >
              Access External Support ↗
            </TactileButton>
          </div>
        </ChassisWell>
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
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('BILLBOT_THEME') as ThemeMode) || 'mid');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('BILLBOT_THEME', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => {
    if (t === 'light') return 'mid';
    if (t === 'mid') return 'dark';
    return 'light';
  });
  
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
    { view: AppView.HOME, icon: '🏠', label: 'GRID' },
    { view: AppView.MONEY, icon: '💸', label: 'CASH' },
    { view: AppView.GOALS, icon: '🎯', label: 'MODS' },
    { view: AppView.HELP, icon: '🛟', label: 'OPS' },
  ];

  return (
    <div className="min-h-screen bg-industrial-base text-industrial-text font-sans transition-colors duration-300" data-theme={theme}>
      
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-[110]">
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-industrial-base shadow-tactile-raised border-t border-l border-industrial-highlight/50 flex items-center justify-center text-lg active:scale-95 active:shadow-well transition-all"
          title={`Theme: ${theme}`}
        >
          {getThemeIcon(theme)}
        </button>
      </div>

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
      <main className="max-w-lg mx-auto px-4 pt-6 pb-32">
        {view === AppView.HOME && (
          <HomeView 
            health={health}
            accounts={accounts}
            goals={goals}
            subscriptions={subscriptions}
            impulseItems={impulseItems}
            onNavigate={setView}
            onShowCheckIn={() => setShowWeeklyBriefing(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
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
            theme={theme}
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
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-industrial-base/95 backdrop-blur-xl border-t border-l border-industrial-highlight/50 rounded-[2.5rem] shadow-tactile-raised z-[100] p-1.5">
        <div className="flex justify-between items-center bg-industrial-well-bg/50 rounded-[2rem] shadow-well p-1">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex-1 py-3 px-0.5 flex flex-col items-center justify-center gap-1 transition-all rounded-2xl ${view === item.view ? 'bg-industrial-base shadow-tactile-sm text-industrial-blue' : 'text-industrial-subtext hover:text-industrial-text'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-widest leading-none">{item.label}</span>
              {view === item.view && (
                <div className="mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-industrial-orange shadow-[0_0_4px_#FF4F00]" />
                </div>
              )}
            </button>
          ))}
        </div>
      </nav>
      
      {/* Goal Edit Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-industrial-base/95 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <ChassisWell className="w-full max-w-md" label="Module Parameters">
            <div className="space-y-6">
              <RecessedInput 
                label="Module Identifier"
                value={editingGoal.name}
                onChange={(e) => setEditingGoal({...editingGoal, name: e.target.value})}
              />
              <RecessedInput 
                label="Target Allocation ($)"
                type="number"
                value={editingGoal.targetAmount}
                onChange={(e) => setEditingGoal({...editingGoal, targetAmount: parseFloat(e.target.value) || 0})}
              />
              <div className="flex gap-4 pt-4">
                <button onClick={() => setEditingGoal(null)} className="flex-1 text-[10px] font-black uppercase tracking-tighter text-industrial-subtext/60 hover:text-industrial-subtext transition-colors">Cancel</button>
                <TactileButton 
                  onClick={() => {
                    setGoals(goals.map(g => g.id === editingGoal.id ? editingGoal : g));
                    setEditingGoal(null);
                  }}
                  color="blue"
                  className="flex-1"
                >
                  Sync Mod
                </TactileButton>
              </div>
            </div>
          </ChassisWell>
        </div>
      )}
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
