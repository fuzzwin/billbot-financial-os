
import React, { useState, useEffect, useMemo } from 'react';
import { AppView, FinancialHealth, Transaction, Subscription, AccountItem, ImpulseItem, Goal, AccountType, Bill, BillCategory, ThemeMode } from '../types';
import { IsometricCity } from './IsometricCity';
import { WeeklyBriefing } from './WeeklyBriefing';
import { Advisor } from './Advisor';
import { TactileButton } from './ui/TactileButton';
import { RecessedInput } from './ui/RecessedInput';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

// --- DUMMY DATA ---
export const DUMMY_ACCOUNTS: AccountItem[] = [
  { id: '1', name: 'Everyday Account', type: 'CASH', balance: 3450.50 },
  { id: '2', name: 'Savings', type: 'SAVINGS', balance: 18500.00 },
  { id: '3', name: 'Investments', type: 'INVESTMENT', balance: 12200.00 },
  { id: '4', name: 'Super', type: 'SUPER', balance: 52000.00 },
  { id: '5', name: 'Credit Card', type: 'CREDIT_CARD', balance: 1250.00, interestRate: 20.99 },
  { id: '6', name: 'HECS Debt', type: 'HECS', balance: 24000.00 },
];

export const DUMMY_SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', name: 'Netflix', amount: 22.99, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], category: 'Entertainment', isOptimizable: false },
  { id: 's2', name: 'Gym Membership', amount: 79.80, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], category: 'Health', isOptimizable: true },
  { id: 's3', name: 'Spotify', amount: 12.99, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0], category: 'Entertainment', isOptimizable: false },
];

export const DUMMY_GOALS: Goal[] = [
  { id: 'g1', name: 'Japan Trip', targetAmount: 8000, currentAmount: 3200, deadline: '2026-03-01', category: 'travel', valueTag: 'Adventure', goalType: 'rocket', createdAt: new Date().toISOString(), emoji: '🌏' },
  { id: 'g2', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 10000, deadline: '2025-12-01', category: 'emergency', valueTag: 'Security', goalType: 'rocket', createdAt: new Date().toISOString(), emoji: '🛡️' },
  { id: 'g3', name: 'PS5 Pro', targetAmount: 1200, currentAmount: 850, category: 'gadget', valueTag: 'Treat', goalType: 'impulse', weeklyTarget: 50, createdAt: new Date().toISOString(), emoji: '🎮' },
];

export const DUMMY_BILLS: Bill[] = [
  { id: 'b1', name: 'Rent', amount: 2200, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], category: 'RENT', isAutoPay: true },
  { id: 'b2', name: 'AGL Electricity', amount: 180, cycle: 'QUARTERLY', nextDueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], category: 'UTILITIES', isAutoPay: false },
  { id: 'b3', name: 'Telstra Internet', amount: 89, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0], category: 'PHONE_INTERNET', isAutoPay: true },
  { id: 'b4', name: 'NRMA Car Insurance', amount: 1200, cycle: 'YEARLY', nextDueDate: new Date(Date.now() + 86400000 * 90).toISOString().split('T')[0], category: 'INSURANCE', isAutoPay: false },
];

// --- DELIGHT: CONFETTI ---
export const ConfettiBurst = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const durationMs = 1900;
    const timeout = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(timeout);
  }, [onDone]);

  const pieces = useMemo(() => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#A855F7'];
    return Array.from({ length: 26 }).map((_, i) => {
      const left = Math.random() * 100;
      const x = (Math.random() * 120 - 60).toFixed(0);
      const delay = (Math.random() * 150).toFixed(0);
      const size = 8 + Math.round(Math.random() * 8);
      const bg = colors[i % colors.length];
      return { id: i, left, x, delay, size, bg };
    });
  }, []);

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="bb-confetti"
          style={{
            left: `${p.left}vw`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.bg,
            animationDelay: `${p.delay}ms`,
            // @ts-ignore - CSS custom property
            ['--x' as any]: `${p.x}px`,
          }}
        />
      ))}
    </>
  );
};

// --- ERROR BOUNDARY ---
export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
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
        <div className="flex flex-col items-center justify-center min-h-full bg-industrial-base text-industrial-text p-8">
          <ChassisWell className="max-w-2xl w-full" label="App Error">
              <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-industrial-orange rounded-2xl flex items-center justify-center text-4xl shadow-lg mb-8 text-white">
                      ⚠️
                  </div>
                  <h1 className="text-2xl font-black mb-4 tracking-tight">Something went wrong</h1>
                  <p className="mb-8 text-industrial-subtext text-sm font-medium leading-relaxed">
                    BillBot hit an unexpected error. Reloading usually fixes it.
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
                    Reload app
                  </TactileButton>
              </div>
          </ChassisWell>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- WELCOME OVERLAY ---
export const WelcomeOverlay = ({ onComplete }: { onComplete: () => void }) => {
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
      <ChassisWell className="max-w-md w-full !p-8" label="Welcome">
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
            color={isLast ? "blue" : "white"}
            fullWidth
            size="lg"
            className="!rounded-2xl"
          >
            {isLast ? "Get started" : "Next"}
          </TactileButton>
        </div>
      </ChassisWell>
    </div>
  );
};

// --- THEME TOGGLE ---
export const getThemeIcon = (theme: ThemeMode) => {
  switch (theme) {
    case 'light': return '☀️';
    case 'mid': return '🌤️';
    case 'dark': return '🌙';
  }
};

export const ThemeToggle = ({ theme, onToggle }: { theme: ThemeMode, onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className="w-12 h-12 flex items-center justify-center bg-industrial-base rounded-xl shadow-tactile-raised border border-white/20 active:translate-y-[1px] transition-all"
    title={`Theme: ${theme}`}
  >
    <span className="text-lg">{getThemeIcon(theme)}</span>
  </button>
);

// --- HEALTH SCORE RING ---
export const HealthScoreRing = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 45;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? 'var(--industrial-green)' : score >= 40 ? 'var(--industrial-yellow)' : 'var(--industrial-orange)';
  
  return (
    <div className="relative w-24 h-24 flex items-center justify-center bg-industrial-base rounded-full shadow-pressed border border-black/5">
      <svg className="w-[85%] h-[85%] transform -rotate-90">
        <circle cx="50%" cy="50%" r="40%" stroke="rgba(0,0,0,0.05)" strokeWidth="6" fill="none" />
        <circle 
          cx="50%" cy="50%" r="40%" 
          stroke={color} 
          strokeWidth="6" 
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-industrial-text tracking-tighter leading-none">{score}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-industrial-subtext/60 mt-1">Score</span>
      </div>
    </div>
  );
};

// --- CASH LEFT CARD ---
export const CashLeftCard = ({ income, expenses }: { income: number, expenses: number }) => {
  const surplus = income - expenses;
  const percentage = Math.round((expenses / income) * 100);
  const isHealthy = surplus > 0;
  
  return (
    <div className="bg-industrial-base border-t border-l border-white/20 rounded-2xl p-5 shadow-tactile-raised">
      <div className="flex justify-between items-start mb-5">
        <div>
          <p className="tactile-label mb-1 opacity-60 text-[8px]">Monthly Liquidity</p>
          <p className={`text-2xl font-black tracking-tighter ${isHealthy ? 'text-industrial-green' : 'text-industrial-orange'}`}>
            {isHealthy ? '+' : ''}${surplus.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <LEDIndicator active={isHealthy} color={isHealthy ? 'green' : 'orange'} />
      </div>
      
      <div className="h-6 bg-industrial-well-bg rounded-lg shadow-well overflow-hidden mb-4 p-1 border-t border-l border-black/5">
        <div 
          className={`h-full rounded-md transition-all duration-1000 ${isHealthy ? 'bg-industrial-blue' : 'bg-[#EF4444]'}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      
      <div className="flex justify-between">
        <div className="flex flex-col">
          <span className="tactile-label !text-[7px] mb-0.5 opacity-40">Burn</span>
          <span className="text-[10px] font-black text-industrial-text">${expenses.toLocaleString()}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="tactile-label !text-[7px] mb-0.5 opacity-40">Inflow</span>
          <span className="text-[10px] font-black text-industrial-text">${income.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

// --- NEXT ACTION CARD ---
export const NextActionCard = ({ 
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
  const getNextAction = () => {
    const surplus = health.monthlyIncome - health.monthlyExpenses;
    if (surplus < 0) return { icon: "🚨", title: "Deficit detected", description: `-$${Math.abs(surplus).toLocaleString()} gap`, action: "Fix", view: AppView.MONEY, urgent: true };
    const killable = subscriptions.filter(s => s.isOptimizable);
    if (killable.length > 0) return { icon: "✂️", title: "Unused module", description: `${killable.length} redundant subs`, action: "Axe", view: AppView.MONEY, urgent: false };
    const ready = goals.filter(g => g.currentAmount >= g.targetAmount);
    if (ready.length > 0) return { icon: "🏁", title: "Target locked", description: `${ready[0].name} achieved`, action: "Launch", view: AppView.GOALS, urgent: false };
    return { icon: "⚙️", title: "System nominal", description: `All vectors stable`, action: "Status", view: AppView.GOALS, urgent: false };
  };
  
  const action = getNextAction();
  
  return (
    <button 
      onClick={() => onAction(action.view)}
      className="w-full text-left bg-industrial-base border-t border-l border-white/20 rounded-2xl p-4 shadow-tactile-raised active:shadow-tactile-pressed active:translate-y-[1px] transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center bg-industrial-well-bg rounded-xl shadow-well border-t border-l border-black/5">
          <span className="text-2xl">{action.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <LEDIndicator active={action.urgent} color="orange" />
            <h3 className="text-industrial-text font-black text-xs uppercase tracking-tight truncate">{action.title}</h3>
          </div>
          <p className="text-industrial-subtext text-[10px] font-medium truncate opacity-60">{action.description}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm transition-colors ${action.urgent ? 'bg-industrial-orange text-white' : 'bg-industrial-well-bg text-industrial-subtext'}`}>
          {action.action}
        </div>
      </div>
    </button>
  );
};

// --- QUICK STATS ---
export const QuickStats = ({ health, goals }: { health: FinancialHealth, goals: Goal[] }) => {
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

// --- HOME VIEW ---
export const HomeView = ({ 
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
    if (surplus < 0) return { icon: "🚨", text: "Spending too much", urgent: true };
    const killable = subscriptions.filter(s => s.isOptimizable);
    if (killable.length > 0) return { icon: "✂️", text: `Cancel ${killable.length} subs`, urgent: false };
    const ready = goals.filter(g => g.currentAmount >= g.targetAmount);
    if (ready.length > 0) return { icon: "🎉", text: `${ready[0].name} ready!`, urgent: false };
    return { icon: "✨", text: "Looking good", urgent: false };
  };
  const action = getNextAction();
  
  return (
    <div className="animate-in fade-in duration-500 relative w-full h-full overflow-hidden">
      {/* Full-Screen City Map */}
      <div className="absolute inset-0 z-0">
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
      
      {/* TOP OVERLAY: Key Info */}
      <div
        className="absolute left-4 right-4 z-30 pointer-events-none"
        style={{ top: 'calc(var(--bb-safe-top) + 0.75rem)' }}
      >
        <div className="flex justify-between items-center bg-industrial-base/90 backdrop-blur-md rounded-2xl p-1.5 shadow-tactile-raised border border-white/40 pointer-events-auto max-w-lg mx-auto">
          {/* Left: Net Worth */}
          <div className="flex-1 flex flex-col items-center border-r border-black/5 px-3 py-1">
            <p className={`text-sm md:text-base font-black tracking-tight ${netWorth >= 0 ? 'text-industrial-green' : 'text-industrial-orange'}`}>
              ${Math.abs(netWorth).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[7px] font-black uppercase tracking-widest text-industrial-subtext/50 -mt-0.5">Net Worth</p>
          </div>
          
          {/* Center: Stability Score */}
          <div className="flex-1 flex flex-col items-center px-3 py-1">
            <p className={`text-sm md:text-base font-black tracking-tight ${health.score >= 70 ? 'text-industrial-green' : health.score >= 40 ? 'text-industrial-yellow' : 'text-industrial-orange'}`}>{health.score}</p>
            <p className="text-[7px] font-black uppercase tracking-widest text-industrial-subtext/50 -mt-0.5">Stability</p>
          </div>

          {/* Right: Theme Toggle */}
          <div className="flex-1 flex justify-center border-l border-black/5 px-2">
            <button 
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-xl bg-industrial-well-bg shadow-well flex items-center justify-center text-base active:translate-y-[1px] transition-all"
              title={`Theme: ${theme}`}
            >
              {theme === 'light' ? '☀️' : theme === 'mid' ? '🌤️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
      
      {/* BOTTOM OVERLAY: Quick Stats + Actions */}
      <div
        className="absolute left-4 right-4 z-30 pointer-events-none max-w-lg mx-auto"
        style={{ bottom: 'calc(var(--bb-safe-bottom) + 6.75rem)' }}
      >
        <div className="pointer-events-auto bg-industrial-base/95 backdrop-blur-md rounded-[2rem] p-3 shadow-tactile-raised border border-white/30">
          <div className="flex flex-col gap-3">
            {/* Row 1: Stats & Progress */}
            <div className="flex gap-2">
              <div className="flex-1 bg-industrial-well-bg shadow-well rounded-2xl py-2 flex items-center justify-center gap-2 border border-white/10">
                <span className="text-industrial-blue text-sm">🎯</span>
                <span className="text-industrial-text font-black text-[9px] uppercase tracking-widest">{activeGoals} Goals</span>
              </div>
              <div className="flex-1 bg-industrial-well-bg shadow-well rounded-2xl py-2 flex items-center justify-center gap-2 border border-white/10">
                <span className="text-industrial-yellow text-sm">🔥</span>
                <span className="text-industrial-text font-black text-[9px] uppercase tracking-widest">{health.checkInStreak || 0} Streak</span>
              </div>
            </div>
            
            {/* Row 2: Actions */}
            <div className="flex gap-2">
              <button 
                onClick={() => onNavigate(surplus < 0 ? AppView.MONEY : AppView.GOALS)}
                className={`flex-[1.5] flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-tactile-raised border transition-all active:scale-[0.98] min-h-[48px] ${
                  action.urgent 
                    ? 'bg-industrial-orange text-white border-white/20' 
                    : 'bg-industrial-base text-industrial-text border-white/30'
                }`}
              >
                <span className="text-lg">{action.icon}</span>
                <span className="truncate">{action.text}</span>
              </button>
              
              <button 
                onClick={onShowCheckIn}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3.5 rounded-2xl bg-industrial-blue text-white font-black text-[10px] uppercase tracking-widest border border-white/20 shadow-tactile-raised active:scale-[0.98] transition-all min-h-[48px]"
              >
                <span className="text-lg">⚡</span>
                <span>Update</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ACCOUNT MODAL ---
export const AccountModal = ({ 
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
    <div className="fixed inset-0 bg-industrial-base/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4 pt-safe pb-safe">
      <ChassisWell className="w-full sm:max-w-md sm:w-full rounded-3xl" label={account ? 'Edit account' : 'Add account'}>
        <div className="space-y-6">
          <div className="flex gap-4 bg-industrial-well-bg p-1.5 rounded-xl shadow-well">
            <button 
              onClick={() => setType('SAVINGS')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${!isDebt ? 'bg-industrial-base shadow-tactile-sm text-industrial-blue' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
            >
              🏦 Asset
            </button>
            <button 
              onClick={() => setType('CREDIT_CARD')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${isDebt ? 'bg-industrial-base shadow-tactile-sm text-industrial-orange' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
            >
              📉 Debt
            </button>
          </div>

          <RecessedInput 
            label="Account Name"
            placeholder="e.g. CommBank Saver" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="tactile-label px-1">Account Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full bg-industrial-base rounded-xl px-4 py-3 text-sm font-bold text-industrial-text shadow-well outline-none appearance-none border-t border-l border-white/5"
            >
              {!isDebt ? (
                <>
                  <option value="CASH">Cash / Everyday</option>
                  <option value="SAVINGS">High Interest Savings</option>
                  <option value="INVESTMENT">Investments / ETF</option>
                  <option value="SUPER">Superannuation</option>
                </>
              ) : (
                <>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="LOAN">Personal Loan</option>
                  <option value="HECS">HECS / HELP Debt</option>
                </>
              )}
            </select>
          </div>

          <RecessedInput 
            label="Current Balance ($)"
            type="number" 
            placeholder="0.00" 
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />

          {isDebt && (
            <RecessedInput 
              label="Interest Rate (% APR)"
              type="number" 
              placeholder="0.00" 
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
            />
          )}

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 tactile-label text-industrial-subtext/40 hover:text-industrial-text transition-colors">
              Cancel
            </button>
            <TactileButton 
              onClick={handleSave} 
              disabled={!name || !balance}
              color={isDebt ? "red" : "blue"}
              className="flex-1"
            >
              Save
            </TactileButton>
          </div>
        </div>
      </ChassisWell>
    </div>
  );
};

// --- SUBSCRIPTION MODAL ---
export const SubscriptionModal = ({ 
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
    <div className="fixed inset-0 bg-industrial-base/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4 pt-safe pb-safe">
      <ChassisWell className="w-full sm:max-w-md sm:w-full rounded-3xl" label="Add subscription">
        <div className="space-y-6">
          <RecessedInput 
            label="Service"
            placeholder="e.g. Netflix" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <RecessedInput 
            label="Cost ($)"
            type="number" 
            placeholder="0.00" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="tactile-label px-1">Billing cycle</label>
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
            <label className="tactile-label px-1">Category</label>
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
              Cancel
            </button>
            <TactileButton 
              onClick={handleSave} 
              disabled={!name || !amount}
              color="blue"
              className="flex-1"
            >
              Save
            </TactileButton>
          </div>
        </div>
      </ChassisWell>
    </div>
  );
};

// --- BILL MODAL ---
export const BillModal = ({ 
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
  
  const handleSave = () => {
    if (!name || !amount) return;
    onSave({
      id: bill?.id || Math.random().toString(36).substr(2, 9),
      name,
      amount: parseFloat(amount) || 0,
      cycle,
      category,
      nextDueDate,
      isAutoPay
    });
  };
  
  return (
    <div className="fixed inset-0 bg-industrial-base/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4 pt-safe pb-safe">
      <ChassisWell className="w-full sm:max-w-md sm:w-full max-h-[92vh] overflow-y-auto rounded-3xl" label={bill ? 'Edit bill' : 'Add bill'}>
        <div className="space-y-6">
          <RecessedInput 
            label="Biller / Name"
            placeholder="e.g. Origin Energy" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <RecessedInput 
            label="Amount ($)"
            type="number" 
            placeholder="0.00" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="tactile-label px-1">Billing cycle</label>
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

            <div className="space-y-1.5">
              <label className="tactile-label px-1">Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value as BillCategory)}
                className="w-full bg-industrial-base rounded-xl px-4 py-3 text-sm font-bold text-industrial-text shadow-well outline-none appearance-none border-t border-l border-white/5"
              >
                <option value="RENT">Rent</option>
                <option value="MORTGAGE">Mortgage</option>
                <option value="UTILITIES">Utilities</option>
                <option value="INSURANCE">Insurance</option>
                <option value="PHONE_INTERNET">Phone & Internet</option>
                <option value="TRANSPORT">Transport</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <RecessedInput 
            label="Next Due Date"
            type="date" 
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
          />

          <label className="flex items-center gap-3 p-4 bg-industrial-well-bg rounded-xl shadow-well cursor-pointer">
            <input 
              type="checkbox" 
              checked={isAutoPay} 
              onChange={(e) => setIsAutoPay(e.target.checked)}
              className="w-5 h-5 rounded-md border-none bg-industrial-base shadow-tactile-sm text-industrial-blue focus:ring-0"
            />
            <span className="text-xs font-black text-industrial-text uppercase tracking-widest">Automatic Payment</span>
          </label>

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 tactile-label text-industrial-subtext/40 hover:text-industrial-text transition-colors">
              Cancel
            </button>
            <TactileButton 
              onClick={handleSave} 
              disabled={!name || !amount}
              color="blue"
              className="flex-1"
            >
              Save
            </TactileButton>
          </div>
        </div>
      </ChassisWell>
    </div>
  );
};

// --- IMPORT MODAL ---
export const ImportModal = ({ 
  onAddTransaction, 
  onClose 
}: { 
  onAddTransaction: (t: Transaction) => void, 
  onClose: () => void 
}) => {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  
  const handleSave = () => {
    if (!merchant || !amount) return;
    onAddTransaction({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      merchant,
      amount: parseFloat(amount) || 0,
      category,
      isDeductible: false,
      gstIncluded: true
    });
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-industrial-base/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4 pt-safe pb-safe">
      <ChassisWell className="w-full sm:max-w-md sm:w-full rounded-3xl" label="Import spending">
        <div className="space-y-6">
          <RecessedInput 
            label="Merchant / Place"
            placeholder="e.g. Woolworths" 
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />

          <RecessedInput 
            label="Amount ($)"
            type="number" 
            placeholder="0.00" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="tactile-label px-1">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-industrial-base rounded-xl px-4 py-3 text-sm font-bold text-industrial-text shadow-well outline-none appearance-none border-t border-l border-white/5"
            >
              <option value="Groceries">Groceries</option>
              <option value="Dining Out">Dining Out</option>
              <option value="Transport">Transport</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Shopping">Shopping</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 tactile-label text-industrial-subtext/40 hover:text-industrial-text transition-colors">
              Cancel
            </button>
            <TactileButton 
              onClick={handleSave} 
              disabled={!merchant || !amount}
              color="blue"
              className="flex-1"
            >
              Save
            </TactileButton>
          </div>
        </div>
      </ChassisWell>
    </div>
  );
};

// --- MONEY VIEW ---
export const MoneyView = ({ 
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
        <h1 className="text-3xl font-black text-industrial-text uppercase tracking-tighter">My Money</h1>
        <div className="flex items-center gap-2 mt-1">
          <LEDIndicator active={true} color="blue" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext/60">Income & Spending Status</p>
        </div>
      </div>
      
      <div className="bg-industrial-well-bg p-1.5 rounded-2xl shadow-well overflow-hidden">
        <div className="tabs-row w-full">
          {(['overview', 'accounts', 'bills', 'subscriptions', 'transactions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                shrink-0 min-w-[92px] py-3.5 px-2 rounded-xl transition-all duration-300 relative
                ${activeTab === tab 
                  ? 'bg-industrial-base shadow-tactile-sm text-industrial-blue' 
                  : 'text-industrial-subtext/50 hover:text-industrial-text'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <span className={`text-lg transition-transform ${activeTab === tab ? 'scale-110' : ''}`}>
                  {tab === 'overview' ? '📊' : tab === 'accounts' ? '🏦' : tab === 'bills' ? '🧾' : tab === 'subscriptions' ? '📺' : '💳'}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                  {tab === 'overview' ? 'Stats' : tab}
                </span>
              </div>
              {activeTab === tab && (
                <div className="absolute top-1.5 right-1.5">
                  <div className="w-1 h-1 rounded-full bg-industrial-blue" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <ChassisWell label="MONTHLY INCOME">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-industrial-well-bg rounded-xl shadow-well flex items-center justify-center text-lg">💰</div>
                <h3 className="text-xs font-black text-industrial-text uppercase tracking-widest">Money In</h3>
              </div>
              <TactileButton 
                onClick={() => setShowAddIncome(!showAddIncome)}
                size="sm"
              >
                Edit
              </TactileButton>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3.5 bg-industrial-base px-5 rounded-xl shadow-tactile-sm border-t border-l border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext">Salary</span>
                <span className="text-base font-black text-industrial-green tracking-tight">${health.monthlyIncome.toLocaleString()}</span>
              </div>
              {health.gigIncome && health.gigIncome > 0 && (
                <div className="flex justify-between items-center py-3.5 bg-industrial-base px-5 rounded-xl shadow-tactile-sm border-t border-l border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext">Gig / Side</span>
                  <span className="text-base font-black text-industrial-green tracking-tight">${health.gigIncome.toLocaleString()}</span>
                </div>
              )}
              {health.taxVault > 0 && (
                <div className="flex justify-between items-center py-3.5 bg-industrial-well-bg px-5 rounded-xl shadow-inner opacity-80">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-industrial-orange" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-industrial-text/40">Tax Saved</span>
                  </div>
                  <span className="text-base font-black text-industrial-orange tracking-tight">-${health.taxVault.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {showAddIncome && (
              <div className="mt-8 pt-6 border-t border-industrial-well-shadow-light/50 space-y-6">
                <RecessedInput 
                  label="Monthly Income" 
                  type="number"
                  value={health.monthlyIncome}
                  onChange={(e) => onUpdateHealth({...health, monthlyIncome: parseFloat(e.target.value) || 0})}
                />
                <RecessedInput 
                  label="Baseline Monthly Spending" 
                  type="number"
                  value={health.monthlyExpenses}
                  onChange={(e) => onUpdateHealth({...health, monthlyExpenses: parseFloat(e.target.value) || 0})}
                />
              </div>
            )}
          </ChassisWell>
          
          <ChassisWell label="MONTHLY SPENDING">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-industrial-well-bg rounded-lg shadow-well flex items-center justify-center">💸</div>
              <h3 className="text-sm font-black text-industrial-text uppercase tracking-tighter">Summary</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 bg-industrial-base px-5 rounded-2xl shadow-tactile-sm border-t border-l border-white/10 transition-all active:translate-y-[1px]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext">Regular Bills</span>
                <span className="text-lg font-black text-industrial-text tracking-tighter">-${monthlyBillsTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-industrial-base px-5 rounded-2xl shadow-tactile-sm border-t border-l border-white/10 transition-all active:translate-y-[1px]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext">Subscriptions</span>
                <span className="text-lg font-black text-industrial-text tracking-tighter">-${monthlySubTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-industrial-base px-5 rounded-2xl shadow-tactile-sm border-t border-l border-white/10 transition-all active:translate-y-[1px]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext">Other Spending</span>
                <span className="text-lg font-black text-industrial-text tracking-tighter">-${health.monthlyExpenses.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-industrial-shadow/30 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext/60">Total Monthly Out</span>
              <span className="text-2xl font-black text-industrial-orange tracking-tighter">-${(health.monthlyExpenses + monthlySubTotal + monthlyBillsTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </ChassisWell>
          
          <div className={`p-6 rounded-[2rem] shadow-tactile-sm border-t border-l border-white/10 ${health.monthlyIncome - (health.monthlyExpenses + monthlySubTotal + monthlyBillsTotal) > 0 ? 'bg-industrial-green/5' : 'bg-industrial-orange/5'}`}>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <LEDIndicator active={true} color={health.monthlyIncome - (health.monthlyExpenses + monthlySubTotal + monthlyBillsTotal) > 0 ? 'green' : 'red'} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext">Money Left Over</span>
                </div>
                <p className="text-industrial-subtext/40 text-[9px] font-bold uppercase tracking-tight">After all bills & spending</p>
              </div>
              <span className={`font-black text-3xl tracking-tighter ${health.monthlyIncome - (health.monthlyExpenses + monthlySubTotal + monthlyBillsTotal) > 0 ? 'text-industrial-green' : 'text-industrial-orange'}`}>
                ${(health.monthlyIncome - (health.monthlyExpenses + monthlySubTotal + monthlyBillsTotal)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <ChassisWell label="BANK ACCOUNTS">
            <div className="space-y-3">
              {assets.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-4 px-5 bg-industrial-base rounded-2xl shadow-tactile-sm border-t border-l border-white/10 transition-all active:translate-y-[1px]">
                  <div>
                    <p className="text-industrial-text font-black uppercase text-xs tracking-tighter">{acc.name}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-industrial-subtext mt-0.5">{acc.type}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-industrial-green font-black tracking-tighter text-lg">${acc.balance.toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingAccount(acc); setShowAccountModal(true); }}
                        aria-label="Edit account"
                        className="w-11 h-11 rounded-xl bg-industrial-well-bg/60 shadow-pressed border border-black/5 flex items-center justify-center text-industrial-subtext hover:text-industrial-text hover:bg-industrial-well-bg transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => onUpdateAccounts(accounts.filter(a => a.id !== acc.id))}
                        aria-label="Delete account"
                        className="w-11 h-11 rounded-xl bg-industrial-well-bg/60 shadow-pressed border border-black/5 flex items-center justify-center text-industrial-subtext hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                          <path d="M7 6l1 14h8l1-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
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
                + Add Account
              </TactileButton>
            </div>
          </ChassisWell>
          
          <ChassisWell label="DEBT & LOANS">
            <div className="space-y-3">
              {liabilities.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-4 px-5 bg-industrial-base rounded-2xl shadow-tactile-sm border-t border-l border-white/10 transition-all active:translate-y-[1px]">
                  <div>
                    <p className="text-industrial-text font-black uppercase text-xs tracking-tighter">{acc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-industrial-subtext">{acc.type}</p>
                      {acc.interestRate && <span className="text-[8px] bg-industrial-orange/10 text-industrial-orange px-1 rounded font-black">{acc.interestRate}% APR</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-industrial-orange font-black tracking-tighter text-lg">-${acc.balance.toLocaleString()}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingAccount(acc); setShowAccountModal(true); }}
                        aria-label="Edit debt"
                        className="w-11 h-11 rounded-xl bg-industrial-well-bg/60 shadow-pressed border border-black/5 flex items-center justify-center text-industrial-subtext hover:text-industrial-text hover:bg-industrial-well-bg transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => onUpdateAccounts(accounts.filter(a => a.id !== acc.id))}
                        aria-label="Delete debt"
                        className="w-11 h-11 rounded-xl bg-industrial-well-bg/60 shadow-pressed border border-black/5 flex items-center justify-center text-industrial-subtext hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                          <path d="M7 6l1 14h8l1-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <TactileButton 
                onClick={() => { setEditingAccount(null); setShowAccountModal(true); setNewAccountType('CREDIT_CARD'); }}
                fullWidth
                color="red"
                size="sm"
                className="mt-4"
              >
                + Add Debt
              </TactileButton>
            </div>
          </ChassisWell>

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
          <ChassisWell label="MONTHLY BILLS">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext">Monthly Bill Total</p>
                <p className="text-2xl font-black text-industrial-orange tracking-tighter">-${monthlyBillsTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <TactileButton 
                onClick={() => { setEditingBill(null); setShowBillModal(true); }}
                color="blue"
                size="sm"
              >
                + Add Bill
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
                  <h4 className="text-[10px] font-black uppercase tracking-[0.15em] px-2 text-industrial-subtext/60 flex items-center gap-2">
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
                        className={`bg-industrial-base rounded-2xl p-4 shadow-tactile-sm border-t border-l border-white/10 transition-all active:translate-y-[1px] ${isOverdue ? 'ring-1 ring-industrial-orange/30' : isDueSoon ? 'ring-1 ring-industrial-yellow/30' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-industrial-text font-black uppercase text-xs tracking-tighter">{bill.name}</p>
                              {bill.isAutoPay && <span className="text-[8px] bg-industrial-green/10 text-industrial-green px-1 rounded font-black">AUTO</span>}
                              {isOverdue && <span className="text-[8px] bg-industrial-orange/10 text-industrial-orange px-1 rounded font-black">OVERDUE</span>}
                              {isDueSoon && !isOverdue && <span className="text-[8px] bg-industrial-yellow/10 text-industrial-yellow px-1 rounded font-black">SOON</span>}
                            </div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-industrial-subtext mt-1 opacity-60">Due {bill.nextDueDate} // {bill.cycle.toLowerCase()}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-industrial-text font-black tracking-tighter text-base">${bill.amount.toLocaleString()}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setEditingBill(bill); setShowBillModal(true); }}
                                aria-label="Edit bill"
                                className="w-11 h-11 rounded-xl bg-industrial-well-bg/60 shadow-pressed border border-black/5 flex items-center justify-center text-industrial-subtext hover:text-industrial-text hover:bg-industrial-well-bg transition-colors"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                  <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button
                                onClick={() => onUpdateBills(bills.filter(b => b.id !== bill.id))}
                                aria-label="Delete bill"
                                className="w-11 h-11 rounded-xl bg-industrial-well-bg/60 shadow-pressed border border-black/5 flex items-center justify-center text-industrial-subtext hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                  <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                  <path d="M7 6l1 14h8l1-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                  <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              </button>
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
          <ChassisWell label="ACTIVE SUBS">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext">Yearly Total</p>
                <p className="text-2xl font-black text-industrial-blue tracking-tighter">-${(monthlySubTotal * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <TactileButton 
                onClick={() => setShowSubModal(true)}
                color="blue"
                size="sm"
              >
                + Add Sub
              </TactileButton>
            </div>
            
            <div className="space-y-3">
              {subscriptions.map(sub => (
                <div 
                  key={sub.id} 
                  className={`bg-industrial-base rounded-2xl p-4 shadow-tactile-sm border-t border-l border-white/10 flex items-center justify-between transition-all active:translate-y-[1px] ${sub.isOptimizable ? 'ring-1 ring-industrial-orange/30' : ''}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-industrial-text font-black uppercase text-xs tracking-tighter">{sub.name}</p>
                      {sub.isOptimizable && <span className="text-[8px] bg-industrial-orange/10 text-industrial-orange px-1 rounded font-black">SAVE?</span>}
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-industrial-subtext mt-1 opacity-60">${sub.amount} // {sub.cycle.toLowerCase()} // {sub.category}</p>
                  </div>
                  <button 
                    onClick={() => killSubscription(sub.id)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#EF4444] text-white text-[12px] font-semibold tracking-wide shadow-tactile-raised border border-white/15 active:translate-y-[1px]"
                  >
                    Cancel
                  </button>
                </div>
              ))}
              {subscriptions.length === 0 && (
                <div className="text-center py-12 bg-industrial-base rounded-2xl shadow-tactile-sm border border-white/10">
                  <div className="mx-auto w-20 h-20 rounded-2xl bg-industrial-well-bg/60 shadow-pressed border border-black/5 flex items-center justify-center text-4xl mb-6">
                    📺
                  </div>
                  <h3 className="text-lg font-black text-industrial-text tracking-tight mb-2">No subscriptions added</h3>
                  <p className="text-industrial-subtext/70 text-sm font-medium leading-relaxed max-w-[34ch] mx-auto mb-6">
                    Track your recurring services so you can spot easy savings.
                  </p>
                  <TactileButton onClick={() => setShowSubModal(true)} color="blue" size="sm">
                    Add a subscription
                  </TactileButton>
                </div>
              )}
            </div>
          </ChassisWell>

          {showSubModal && (
            <SubscriptionModal 
              onSave={(s) => {
                onUpdateSubscriptions([...subscriptions, s]);
                setShowSubModal(false);
              }}
              onClose={() => setShowSubModal(false)}
            />
          )}
        </div>
      )}
      
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <ChassisWell label="RECENT SPENDING">
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext">{transactions.length} items found</p>
              <TactileButton 
                onClick={() => setShowImportModal(true)}
                color="white"
                size="sm"
              >
                + Import
              </TactileButton>
            </div>
            
            {transactions.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {transactions.slice().reverse().map(t => (
                  <div key={t.id} className="bg-industrial-base rounded-xl p-3 flex justify-between items-center border border-white/10 shadow-tactile-sm transition-all active:translate-y-[1px]">
                    <div>
                      <p className="text-industrial-text font-black uppercase text-[10px] tracking-tighter">{t.merchant}</p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-industrial-subtext">{t.date} // {t.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-industrial-orange font-black tracking-tighter text-sm">-${t.amount.toLocaleString()}</span>
                      <button 
                        onClick={() => onUpdateTransactions(transactions.filter(tx => tx.id !== t.id))}
                        aria-label="Delete transaction"
                        className="w-11 h-11 rounded-xl bg-industrial-well-bg/60 shadow-pressed border border-black/5 flex items-center justify-center text-industrial-subtext hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                          <path d="M7 6l1 14h8l1-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                          <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-14 bg-industrial-base rounded-2xl shadow-tactile-sm border border-white/10">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-industrial-well-bg/60 shadow-pressed border border-black/5 flex items-center justify-center text-4xl mb-6">
                  🧾
                </div>
                <h3 className="text-lg font-black text-industrial-text tracking-tight mb-2">No transactions yet</h3>
                <p className="text-industrial-subtext/70 text-sm font-medium leading-relaxed max-w-[32ch] mx-auto mb-6">
                  Add a few purchases and BillBot will start spotting patterns.
                </p>
                <TactileButton onClick={() => setShowImportModal(true)} size="sm" color="blue">
                  Add a transaction
                </TactileButton>
              </div>
            )}
          </ChassisWell>

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
export const GoalModal = ({ 
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
    <div className="fixed inset-0 bg-industrial-base/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4 pt-safe pb-safe">
      <ChassisWell className="w-full sm:max-w-md sm:w-full max-h-[92vh] overflow-y-auto rounded-3xl" label={goal ? 'Edit goal' : 'Add goal'}>
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
              🅿️ Wishlist
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
            label="Name"
            placeholder="e.g. Japan Trip" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <RecessedInput 
            label="Target amount ($)"
            type="number" 
            placeholder="0.00" 
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />

          {goal && (
            <RecessedInput 
              label="Saved so far ($)"
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
              Cancel
            </button>
            <TactileButton 
              onClick={handleSave} 
              disabled={!name || !targetAmount}
              color="blue"
              className="flex-1"
            >
              Save
            </TactileButton>
          </div>
        </div>
      </ChassisWell>
    </div>
  );
};

// --- GOALS VIEW ---
export const GoalsView = ({ 
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
  const [confettiKey, setConfettiKey] = useState<number | null>(null);
  
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
    setConfettiKey(Date.now());
    
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
      {confettiKey && <ConfettiBurst onDone={() => setConfettiKey(null)} />}
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-3xl font-black text-industrial-text uppercase tracking-tighter">My Goals</h1>
          <div className="flex items-center gap-2 mt-1">
            <LEDIndicator active={true} color="blue" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext/60">Saving Progress</p>
          </div>
        </div>
        <TactileButton 
          onClick={() => setShowNewGoal(true)}
          color="blue"
          size="sm"
        >
          + Add Goal
        </TactileButton>
      </div>
      
      <ChassisWell label="WEEKLY SAVINGS">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext/60 mb-1">Available to Save</p>
            <p className="text-3xl font-black text-industrial-text tracking-tighter">${weeklySurplus.toFixed(0)}</p>
          </div>
          <div className="w-14 h-14 bg-industrial-well-bg rounded-xl flex items-center justify-center text-3xl shadow-well">💰</div>
        </div>
      </ChassisWell>
      
      {showNewGoal && (
        <ChassisWell label="NEW GOAL" className="animate-in slide-in-from-top-4">
          <div className="space-y-6">
            <div className="flex gap-4 bg-industrial-well-bg p-1.5 rounded-xl shadow-well">
              <button 
                onClick={() => setNewGoalType('rocket')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${newGoalType === 'rocket' ? 'bg-industrial-base shadow-tactile-sm text-industrial-blue' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
              >
                🎯 Primary Goal
              </button>
              <button 
                onClick={() => setNewGoalType('impulse')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${newGoalType === 'impulse' ? 'bg-industrial-base shadow-tactile-sm text-industrial-orange' : 'text-industrial-subtext/60 hover:text-industrial-text'}`}
              >
                🅿️ Wishlist
              </button>
            </div>
            
            <RecessedInput 
              label="Goal Name"
              placeholder="e.g. Japan Trip"
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
            />
            
            <RecessedInput 
              label="Target Amount ($)"
              type="number"
              placeholder="0.00"
              value={newGoalAmount}
              onChange={(e) => setNewGoalAmount(e.target.value)}
            />
            
            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowNewGoal(false)} className="flex-1 text-[10px] font-bold uppercase tracking-widest text-industrial-subtext/60 hover:text-industrial-text transition-colors">Cancel</button>
              <TactileButton onClick={addGoal} color="blue" className="flex-1">Add Goal</TactileButton>
            </div>
          </div>
        </ChassisWell>
      )}
      
      {rockets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext/60 px-2">Primary Goals</h3>
            {rockets.map(goal => {
              const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
              const isReady = goal.currentAmount >= goal.targetAmount;
              const isLaunching = launchingId === goal.id;
              
              return (
                <div 
                  key={goal.id} 
                  className={`bg-industrial-base rounded-[2rem] p-5 shadow-tactile-sm border-t border-l border-white/10 transition-all active:translate-y-[1px] ${isLaunching ? 'scale-[1.02]' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-industrial-well-bg shadow-pressed rounded-2xl flex items-center justify-center text-2xl border border-black/5">
                        {goal.emoji || '🚀'}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-industrial-text uppercase tracking-tight leading-none">{goal.name}</h4>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-industrial-subtext/60 mt-1.5">{goal.valueTag}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`w-2 h-2 rounded-full shadow-sm ${isReady ? 'bg-industrial-green animate-pulse' : 'bg-industrial-blue opacity-30'}`} />
                      <span className="text-[10px] font-black text-industrial-subtext/60">{percent}%</span>
                    </div>
                  </div>
                  
                  <div className="h-3 bg-industrial-well-bg shadow-pressed rounded-full overflow-hidden mb-5 p-0.5 border border-black/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isReady ? 'bg-industrial-green' : 'bg-industrial-blue'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-6 px-1">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Saved</span>
                      <span className="text-[13px] font-black text-industrial-text tracking-tighter">${goal.currentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Goal</span>
                      <span className="text-[13px] font-black text-industrial-text tracking-tighter">${goal.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2.5">
                    <TactileButton 
                      onClick={() => addCash(goal.id, 50)}
                      size="sm"
                      className="flex-1"
                      disabled={isReady}
                    >
                      +$50
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
                        color="blue"
                        size="sm"
                        className="flex-1"
                      >
                        Goal Met!
                      </TactileButton>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {impulses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext/60 px-2">Wishlist Items</h3>
            {impulses.map(goal => {
              const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
              const isReady = goal.currentAmount >= goal.targetAmount;
              
              return (
                <div 
                  key={goal.id} 
                  className="bg-industrial-base rounded-2xl p-5 shadow-tactile-sm border border-white/10"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-industrial-base rounded-xl flex items-center justify-center text-2xl shadow-well border border-black/5">
                        {goal.emoji || '🎁'}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-industrial-text uppercase tracking-tighter">{goal.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <LEDIndicator active={true} color="yellow" />
                          <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Status: Saving</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onUpdateGoals(goals.filter(g => g.id !== goal.id))}
                        className="text-[9px] font-bold uppercase tracking-widest text-industrial-subtext hover:text-industrial-orange transition-colors"
                      >
                        [Delete]
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-4 bg-industrial-base rounded-lg shadow-well overflow-hidden mb-4 p-1 border border-black/5">
                    <div 
                      className={`h-full rounded-md transition-all duration-1000 ${isReady ? 'bg-emerald-500' : 'bg-industrial-orange'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Saved</span>
                      <span className="text-sm font-black text-industrial-text tracking-tighter">${goal.currentAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Price</span>
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
                        color="blue"
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
        <div className="text-center py-16 bg-industrial-base rounded-2xl shadow-tactile-sm border border-white/10">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-industrial-well-bg/60 shadow-pressed border border-black/5 flex items-center justify-center text-4xl mb-6">
            🎯
          </div>
          <h3 className="text-lg font-black text-industrial-text tracking-tight mb-2">Set your first goal</h3>
          <p className="text-industrial-subtext/70 text-sm font-medium leading-relaxed max-w-[28ch] mx-auto mb-6">
            Pick something meaningful and start saving a little each week.
          </p>
          <TactileButton onClick={() => setShowNewGoal(true)} color="blue" size="sm">
            Add a goal
          </TactileButton>
        </div>
      )}
    </div>
  );
};

// --- HELP VIEW ---
export const HelpView = ({ health, accounts }: { health: FinancialHealth, accounts: AccountItem[] }) => {
  const [activeSection, setActiveSection] = useState<'chat' | 'crisis' | 'tools'>('chat');
  const [activeTool, setActiveTool] = useState<'hecs' | 'tax' | 'abn' | null>(null);
  
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-hidden">
      <div className="px-2 pb-4 shrink-0">
        <h1 className="text-3xl font-black text-industrial-text uppercase tracking-tighter">Support</h1>
        <div className="flex items-center gap-2 mt-1">
          <LEDIndicator active={true} color="blue" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-industrial-subtext/60">AI Advisor & Tools</p>
        </div>
      </div>

      <div className="px-2 pb-4 shrink-0">
        <div className="flex gap-2 bg-industrial-well-bg p-2 rounded-2xl shadow-well">
          {(['chat', 'crisis', 'tools'] as const).map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`flex-1 py-3 px-2 rounded-xl transition-all duration-75 relative ${activeSection === section ? 'bg-industrial-base shadow-tactile-sm text-industrial-blue' : 'text-industrial-subtext hover:text-industrial-text'}`}
            >
              <span className="text-[10px] font-black uppercase tracking-tighter">{section}</span>
              {activeSection === section && (
                <div className="absolute top-1.5 right-1.5">
                  <div className="w-1 h-1 rounded-full bg-industrial-blue" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 px-2 overflow-y-auto overscroll-contain pb-4">
        {activeSection === 'chat' && (
          <div className="h-full">
            <Advisor health={health} />
          </div>
        )}

        {activeSection === 'tools' && (
          <div className="space-y-6">
            <ChassisWell label="CALCULATORS">
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
              <div className="animate-in slide-in-from-top-4 h-[500px]">
                <ChassisWell label="ATO RULES" className="h-full">
                  <Advisor health={health} />
                </ChassisWell>
              </div>
            )}
          </div>
        )}

        {activeSection === 'crisis' && (
          <ChassisWell label="URGENT HELP" className="bg-industrial-orange/5 border-industrial-orange/10">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-20 h-20 bg-industrial-orange rounded-3xl flex items-center justify-center text-4xl shadow-lg mb-6 text-white animate-pulse">
                🚨
              </div>
              <h3 className="text-xl font-black text-industrial-text uppercase tracking-tighter mb-2">Hardship Protocol</h3>
              <p className="text-industrial-subtext text-sm font-medium mb-8 leading-relaxed">
                If you're struggling to pay your bills, follow this priority guide:
              </p>
              
              <div className="w-full space-y-4 mb-10 text-left">
                {[
                  { title: "Priority 1: Essentials", desc: "Rent, power, water, food", color: "blue" },
                  { title: "Priority 2: Connectivity", desc: "Phone, internet, transport", color: "yellow" },
                  { title: "Priority 3: Unsecured Debt", desc: "Cards, loans, BNPL", color: "orange" }
                ].map((tier, i) => (
                  <div key={i} className="bg-industrial-base p-5 rounded-2xl shadow-well border border-white/10 flex items-start gap-4">
                    <div className="mt-1"><LEDIndicator active color={tier.color as any} /></div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-industrial-text">{tier.title}</h4>
                      <p className="text-industrial-subtext/60 text-xs mt-1">{tier.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <TactileButton 
                onClick={() => window.open('https://www.moneysmart.gov.au/managing-your-money/managing-debts/financial-hardship', '_blank', 'noopener,noreferrer')}
                color="red"
                fullWidth
                size="lg"
              >
                Get External Help ↗
              </TactileButton>
            </div>
          </ChassisWell>
        )}
      </div>
    </div>
  );
};

