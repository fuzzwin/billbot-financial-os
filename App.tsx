
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AppView, FinancialHealth, Transaction, Subscription, AccountItem, ImpulseItem, Goal } from './types';
import { IsometricCity } from './components/IsometricCity';
import { HECSCalculator } from './components/HECSCalculator';
import { DataIngestion } from './components/DataIngestion';
import { Advisor } from './components/Advisor';
import { WalletManager } from './components/WalletManager';
import { SubscriptionManager } from './components/SubscriptionManager';
import { PurchaseAdvisor } from './components/PurchaseAdvisor';
import { SafeZoneShield } from './components/SafeZoneShield';
import { BatteryROI } from './components/BatteryROI';
import { ImpulseHangar } from './components/ImpulseHangar';
import { GigPort } from './components/GigPort';
import { CrisisCommand } from './components/CrisisCommand';
import { SideQuests } from './components/SideQuests';
import { Launchpad } from './components/Launchpad';
import { WeeklyBriefing } from './components/WeeklyBriefing';
import { TimeTravelUI } from './components/TimeTravelUI';
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8">
          <div className="bg-red-900/20 border border-red-500 rounded-2xl p-8 max-w-2xl w-full">
              <h1 className="text-3xl font-black text-red-500 mb-4 italic">SYSTEM FAILURE</h1>
              <p className="mb-4 text-slate-300">BillBot encountered a critical error while rendering the interface.</p>
              <pre className="bg-slate-950 p-4 rounded-lg text-xs font-mono text-red-300 overflow-auto border border-red-900/50 mb-6">
                {this.state.error?.toString()}
              </pre>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl"
              >
                REBOOT SYSTEM
              </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- CASHFLOW MONITOR COMPONENT ---
const CashflowMonitor = ({ income, expenses }: { income: number, expenses: number }) => {
    const surplus = income - expenses;
    const maxVal = Math.max(income, expenses);
    const expenseWidth = (expenses / maxVal) * 100;
    const surplusWidth = (Math.max(0, surplus) / maxVal) * 100;

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-white font-bold flex items-center gap-2">
                     ⚡ City Power Supply
                 </h3>
                 <span className={`font-mono font-bold ${surplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {surplus >= 0 ? '+' : ''}${surplus.toLocaleString()}/mo
                 </span>
             </div>
             
             {/* Visualization Bar */}
             <div className="flex h-4 rounded-full overflow-hidden bg-slate-800 mb-2">
                 {/* Expenses Segment */}
                 <div style={{ width: `${expenseWidth}%` }} className="bg-rose-500/80 transition-all duration-1000 relative group">
                     <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_75%,transparent_75%,transparent)] bg-[size:10px_10px]"></div>
                 </div>
                 {/* Surplus Segment */}
                 {surplus > 0 && (
                     <div style={{ width: `${surplusWidth}%` }} className="bg-emerald-500/80 transition-all duration-1000"></div>
                 )}
             </div>

             <div className="flex justify-between text-xs text-slate-500">
                 <span>Expenses: ${expenses.toLocaleString()}</span>
                 <span>Income: ${income.toLocaleString()}</span>
             </div>
        </div>
    );
};

// --- DUMMY DATA FOR VISUALIZATION ---
const DUMMY_ACCOUNTS: AccountItem[] = [
  { id: '1', name: 'CommBank Everyday', type: 'CASH', balance: 3450.50 },
  { id: '2', name: 'ING Savings', type: 'SAVINGS', balance: 18500.00, isValueBuilding: false },
  { id: '3', name: 'Vanguard ETF', type: 'INVESTMENT', balance: 12200.00 },
  { id: '4', name: 'AusSuper', type: 'SUPER', balance: 52000.00 },
  { id: '5', name: 'Amex Platinum', type: 'CREDIT_CARD', balance: 1250.00, interestRate: 20.99 },
  { id: '6', name: 'HECS Debt', type: 'HECS', balance: 24000.00 },
  { id: '7', name: 'Car Loan', type: 'LOAN', balance: 15000.00, interestRate: 8.5 },
  { id: '8', name: 'Travel Fund', type: 'SAVINGS', balance: 2450.00, isValueBuilding: true },
];

const DUMMY_SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', name: 'Netflix 4K', amount: 22.99, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], category: 'Entertainment', isOptimizable: false },
  { id: 's2', name: 'Anytime Fitness', amount: 19.95, cycle: 'WEEKLY', nextDueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], category: 'Gym', isOptimizable: false },
  { id: 's3', name: 'Adobe Creative Cloud', amount: 79.99, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0], category: 'Software', isOptimizable: true },
  { id: 's4', name: 'Spotify Duo', amount: 18.99, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0], category: 'Entertainment', isOptimizable: false },
  { id: 's5', name: 'Amazon Prime', amount: 9.99, cycle: 'MONTHLY', nextDueDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0], category: 'Shopping', isOptimizable: true },
];

const DUMMY_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2025-05-01', merchant: 'Woolworths Metro', amount: 85.50, category: 'Groceries', isDeductible: false, gstIncluded: true },
  { id: 't2', date: '2025-05-02', merchant: 'Shell Coles Express', amount: 65.00, category: 'Transport', isDeductible: true, gstIncluded: true },
  { id: 't3', date: '2025-05-03', merchant: 'Netflix', amount: 22.99, category: 'Entertainment', isDeductible: false, gstIncluded: true },
  { id: 't4', date: '2025-05-04', merchant: 'Uber Eats', amount: 45.20, category: 'Food', isDeductible: false, gstIncluded: true },
  { id: 't5', date: '2025-05-05', merchant: 'Officeworks', amount: 249.00, category: 'Work Equipment', isDeductible: true, gstIncluded: true },
];

const DUMMY_IMPULSE_ITEMS: ImpulseItem[] = [
  { id: 'i1', name: 'PS5 Pro', price: 1200, savedAmount: 450, targetWeeklySave: 50, dateAdded: '2025-01-01' },
  { id: 'i2', name: 'Herman Miller Chair', price: 1800, savedAmount: 1200, targetWeeklySave: 100, dateAdded: '2025-02-01' },
  { id: 'i3', name: 'Bali Trip', price: 3500, savedAmount: 500, targetWeeklySave: 150, dateAdded: '2025-03-01' },
];

const DUMMY_GOALS: Goal[] = [
  { id: 'g1', name: 'Japan 2026', targetAmount: 8000, currentAmount: 3200, deadline: '2026-03-01', category: 'travel', valueTag: 'Adventure' },
  { id: 'g2', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 10000, deadline: '2025-12-01', category: 'house_deposit', valueTag: 'Security' },
];

// --- TUTORIAL COMPONENT ---
const TutorialOverlay = ({ step, onNext, onClose }: { step: number, onNext: () => void, onClose: () => void }) => {
    const content = [
        {
            title: "Welcome to BillBot",
            text: "The first financial OS designed specifically for the Australian economy. Let's get you oriented.",
            icon: "👋"
        },
        {
            title: "Your Wealth City",
            text: "We don't do boring spreadsheets. Your assets build skyscrapers, and debt creates pollution. Watch your city grow as you save.",
            icon: "🏙️"
        },
        {
            title: "The Launchpad",
            text: "Fuel goals like rockets. When you spend the money, they don't crash—they launch! No more guilt for spending saved cash.",
            icon: "🚀"
        },
        {
            title: "Crisis Protocol",
            text: "In trouble? The Red Phone provides triage strategies and generates hardship letters instantly.",
            icon: "☎️"
        }
    ];

    const current = content[step];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-blue/10 rounded-full blur-3xl"></div>
                
                <div className="text-5xl mb-6 relative z-10 animate-bounce">{current.icon}</div>
                <h2 className="text-2xl font-black text-white mb-2 relative z-10">{current.title}</h2>
                <p className="text-slate-400 mb-8 leading-relaxed relative z-10">{current.text}</p>
                
                <div className="flex justify-between items-center relative z-10">
                    <div className="flex gap-1.5">
                        {content.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-neon-blue' : 'w-2 bg-slate-700'}`} />
                        ))}
                    </div>
                    <button 
                        onClick={step === content.length - 1 ? onClose : onNext}
                        className="bg-neon-blue text-slate-900 font-bold px-6 py-2 rounded-lg hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                    >
                        {step === content.length - 1 ? "Let's Build" : "Next →"}
                    </button>
                </div>
            </div>
        </div>
    );
}

const App = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [impulseItems, setImpulseItems] = useState<ImpulseItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  // Tutorial & UI State
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWeeklyBriefing, setShowWeeklyBriefing] = useState(false);
  
  // Time Travel State
  const [timeYear, setTimeYear] = useState(2025);
  const [timeMode, setTimeMode] = useState<'DRIFT' | 'TURBO'>('DRIFT');
  
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
    isStudent: false
  });

  // Load Data on Mount
  useEffect(() => {
      const savedHealth = loadFinancialHealth();
      const savedTx = loadTransactions();
      const savedSubs = loadSubscriptions();
      const savedAcc = loadAccounts();
      const savedImpulse = loadImpulseItems();
      const savedGoals = loadGoals();
      
      if (savedHealth) setHealth(savedHealth);
      
      // Load saved data or fallback to DUMMY data
      if (savedTx.length > 0) setTransactions(savedTx);
      else setTransactions(DUMMY_TRANSACTIONS);

      if (savedSubs.length > 0) setSubscriptions(savedSubs);
      else setSubscriptions(DUMMY_SUBSCRIPTIONS);

      if (savedAcc.length > 0) setAccounts(savedAcc);
      else setAccounts(DUMMY_ACCOUNTS);

      if (savedImpulse.length > 0) setImpulseItems(savedImpulse);
      else setImpulseItems(DUMMY_IMPULSE_ITEMS);
      
      // Goal Logic: Use dummy if empty to ensure visual pop
      if (savedGoals.length > 0) setGoals(savedGoals);
      else setGoals(DUMMY_GOALS);

      // Check Tutorial Status
      const hasSeenTutorial = localStorage.getItem('BILLBOT_HAS_SEEN_TUTORIAL');
      if (!hasSeenTutorial) {
          setShowTutorial(true);
      }
  }, []);

  // Persistence Effects
  useEffect(() => { saveFinancialHealth(health); }, [health]);
  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveSubscriptions(subscriptions); }, [subscriptions]);
  useEffect(() => { saveImpulseItems(impulseItems); }, [impulseItems]);
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

  // Handle Tutorial Flow
  const handleTutorialNext = () => {
      const nextStep = tutorialStep + 1;
      setTutorialStep(nextStep);
      
      // Auto-navigate views to match tutorial context
      if (nextStep === 1) setView(AppView.DASHBOARD);
      if (nextStep === 2) setView(AppView.LAUNCHPAD);
      if (nextStep === 3) setView(AppView.CRISIS);
  };

  const handleTutorialClose = () => {
      localStorage.setItem('BILLBOT_HAS_SEEN_TUTORIAL', 'true');
      setShowTutorial(false);
      setView(AppView.DASHBOARD);
  };

  const NavItem = ({ label, target, icon, onClick }: { label: string, target: AppView, icon: any, onClick?: () => void }) => {
    const isActive = view === target;
    return (
        <button 
            onClick={() => { setView(target); onClick?.(); }}
            className={`relative group flex items-center gap-3 p-3 w-full rounded-xl mb-1 transition-all duration-300 overflow-hidden ${isActive ? 'bg-slate-800 text-white shadow-[0_0_20px_rgba(0,243,255,0.1)]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
            {/* Active Indicator Strip */}
            {isActive && (
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neon-blue rounded-r-full shadow-[0_0_10px_#00f3ff]" />
            )}
            
            {/* Icon Wrapper for animation */}
            <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'translate-x-1 scale-105' : 'group-hover:scale-110'}`}>
                {icon}
            </div>
            
            <span className={`relative z-10 font-bold text-sm tracking-wide transition-all duration-300 ${isActive ? 'translate-x-1' : ''}`}>
                {label}
            </span>
        </button>
    );
  };

  const projectedData = React.useMemo(() => {
      if (timeYear === 2025) return { accounts, health, netWorthDelta: 0 };

      const months = (timeYear - 2025) * 12;
      
      // Create deep copies for simulation
      const projectedAccounts = accounts.map(a => ({...a}));
      const projectedHealth = {...health};

      let monthlyIncome = health.monthlyIncome;
      let monthlyExpenses = health.monthlyExpenses;

      // Turbo Logic: Optimization + Career Growth assumption
      if (timeMode === 'TURBO') {
          monthlyExpenses *= 0.9; // 10% Cut
          monthlyIncome *= 1.05; // 5% Growth/Side Gig
      }

      const monthlySurplus = monthlyIncome - monthlyExpenses;
      
      // Simulation Loop
      for (let i = 0; i < months; i++) {
          if (monthlySurplus >= 0) {
              // Add to savings
              const savingsAccs = projectedAccounts.filter(a => ['SAVINGS', 'INVESTMENT', 'SUPER'].includes(a.type));
              if (savingsAccs.length > 0) {
                  const split = monthlySurplus / savingsAccs.length;
                  savingsAccs.forEach(a => {
                      const rate = timeMode === 'TURBO' ? 0.005 : 0.003; // Higher returns in turbo (better investment)
                      a.balance += split + (a.balance * rate); 
                  });
              }
          } else {
              // Add to debt
              const debtAccs = projectedAccounts.filter(a => ['CREDIT_CARD', 'LOAN'].includes(a.type));
              if (debtAccs.length > 0) {
                  const split = Math.abs(monthlySurplus) / debtAccs.length;
                  debtAccs.forEach(a => {
                      a.balance += split + (a.balance * 0.015); // 18% APR
                  });
              } else {
                  // Create crisis debt if none exists to track the deficit
                  const crisis = projectedAccounts.find(a => a.id === 'crisis-debt');
                  if (crisis) {
                      crisis.balance += Math.abs(monthlySurplus) + (crisis.balance * 0.015);
                  } else {
                      projectedAccounts.push({
                          id: 'crisis-debt',
                          name: 'Unpaid Bills',
                          type: 'CREDIT_CARD',
                          balance: Math.abs(monthlySurplus),
                          interestRate: 18
                      });
                  }
              }
          }
      }

      // Calculate Net Worth Difference
      const currentNetWorth = accounts.reduce((sum, a) => sum + (['LOAN','CREDIT_CARD','HECS'].includes(a.type) ? -a.balance : a.balance), 0);
      const futureNetWorth = projectedAccounts.reduce((sum, a) => sum + (['LOAN','CREDIT_CARD','HECS'].includes(a.type) ? -a.balance : a.balance), 0);

      return { 
          accounts: projectedAccounts, 
          health: projectedHealth,
          netWorthDelta: Math.round(futureNetWorth - currentNetWorth)
      };
  }, [accounts, health, timeYear, timeMode]);

  const cashflow = (health.monthlyIncome - health.monthlyExpenses);
  const hasWeeds = subscriptions.some(s => s.isOptimizable);
  const isCrisis = health.monthlyExpenses > health.monthlyIncome || health.survivalNumber > health.monthlyIncome;

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200 font-sans selection:bg-neon-blue selection:text-slate-900 relative">
      
      {showTutorial && (
          <TutorialOverlay step={tutorialStep} onNext={handleTutorialNext} onClose={handleTutorialClose} />
      )}

      {showWeeklyBriefing && (
          <WeeklyBriefing 
            accounts={accounts}
            onUpdateAccounts={setAccounts}
            onComplete={() => setShowWeeklyBriefing(false)}
          />
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl animate-in fade-in slide-in-from-right-10 flex flex-col p-6">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-white italic">MENU</h2>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-800 rounded-full text-white">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                <NavItem target={AppView.DASHBOARD} label="My City" icon={<span>🏙️</span>} onClick={() => setMobileMenuOpen(false)} />
                <NavItem target={AppView.LAUNCHPAD} label="The Launchpad" icon={<span>🚀</span>} onClick={() => setMobileMenuOpen(false)} />
                <NavItem target={AppView.WALLET} label="My Wallet" icon={<span>💳</span>} onClick={() => setMobileMenuOpen(false)} />
                <NavItem target={AppView.DATA_IMPORT} label="The Shoebox" icon={<span>📦</span>} onClick={() => setMobileMenuOpen(false)} />
                <NavItem target={AppView.SUBSCRIPTIONS} label="Subscriptions" icon={<span>📅</span>} onClick={() => setMobileMenuOpen(false)} />
                <NavItem target={AppView.HANGAR} label="Impulse Hangar" icon={<span>🏗️</span>} onClick={() => setMobileMenuOpen(false)} />
                <NavItem target={AppView.SIDE_QUESTS} label="Side Quests" icon={<span>⚔️</span>} onClick={() => setMobileMenuOpen(false)} />
                <NavItem target={AppView.GIG_PORT} label="Gig Port" icon={<span>⚓</span>} onClick={() => setMobileMenuOpen(false)} />
                <div className="my-2 h-px bg-slate-800"></div>
                <NavItem target={AppView.CRISIS} label="Crisis Protocol" icon={<span className="text-red-500">☎️</span>} onClick={() => setMobileMenuOpen(false)} />
                <NavItem target={AppView.ADVISOR} label="Advisor" icon={<span>🤖</span>} onClick={() => setMobileMenuOpen(false)} />
              </div>
          </div>
      )}

      {/* Sidebar (Desktop) */}
      <aside className="w-64 border-r border-slate-800 flex-shrink-0 hidden md:flex flex-col bg-slate-900/50 backdrop-blur-sm fixed h-full z-20">
        <div className="p-6">
            <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-2 group cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
                <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-purple-600 rounded flex items-center justify-center shadow-lg group-hover:shadow-neon-blue/50 transition-shadow duration-300">
                    B
                </div>
                BillBot
            </h1>
        </div>

        <nav className="flex-1 px-4 mt-2">
            <NavItem target={AppView.DASHBOARD} label="My City" icon={<span>🏙️</span>} />
            <NavItem target={AppView.LAUNCHPAD} label="The Launchpad" icon={<span>🚀</span>} />
            <NavItem target={AppView.WALLET} label="My Wallet" icon={<span>💳</span>} />
            <NavItem target={AppView.DATA_IMPORT} label="The Shoebox" icon={<span>📦</span>} />
            <NavItem target={AppView.SUBSCRIPTIONS} label="Subscriptions" icon={<span>📅</span>} />
            <NavItem target={AppView.HANGAR} label="Impulse Hangar" icon={<span>🏗️</span>} />
            <NavItem target={AppView.SIDE_QUESTS} label="Side Quests" icon={<span>⚔️</span>} />
            <NavItem target={AppView.GIG_PORT} label="Gig Port" icon={<span>⚓</span>} />
            
            <div className="my-2 h-px bg-slate-800"></div>
            
            {/* Crisis Toggle - Always visible if condition met, otherwise nav item */}
            <div className={`${isCrisis ? 'animate-pulse' : ''}`}>
                <NavItem target={AppView.CRISIS} label="Crisis Protocol" icon={<span className="text-red-500">☎️</span>} />
            </div>
            
            <div className="my-2 h-px bg-slate-800"></div>
            <NavItem target={AppView.ADVISOR} label="Advisor" icon={<span>🤖</span>} />
        </nav>

        <div className="p-4">
             <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                 <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Net Worth</p>
                 <p className={`text-xl font-mono font-bold ${health.savings - (health.hecsDebt + health.otherDebts) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     ${(health.savings - (health.hecsDebt + health.otherDebts)).toLocaleString()}
                 </p>
             </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 overflow-y-auto">
        
        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center mb-6">
             <div className="flex items-center gap-2" onClick={() => setView(AppView.DASHBOARD)}>
                 <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-purple-600 rounded flex items-center justify-center text-xs font-bold text-black shadow-lg">B</div>
                 <h1 className="text-xl font-black italic">BillBot</h1>
             </div>
             <button 
                onClick={() => setMobileMenuOpen(true)}
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white border border-slate-700 active:scale-95 transition-transform"
             >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
             </button>
        </header>

        {view === AppView.DASHBOARD && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto pb-24 md:pb-0">
                
                {/* 1. Hero Action: The "Can I Buy It?" Button */}
                <PurchaseAdvisor health={health} />

                {/* 2. Cashflow Monitor & Briefing Trigger */}
                <div className="flex gap-4 items-stretch">
                    <div className="flex-1">
                        <CashflowMonitor income={health.monthlyIncome} expenses={health.monthlyExpenses} />
                    </div>
                    <button 
                        onClick={() => setShowWeeklyBriefing(true)}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl px-6 flex flex-col justify-center items-center text-center group w-24 md:w-32 transition-all"
                        title="Update Balances"
                    >
                        <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">📅</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Weekly Check-in</span>
                    </button>
                </div>

                {/* 3. Safe Zone Shield - Moved OUT of City Container for layout cleanliness */}
                <SafeZoneShield health={health} />

                {/* 4. The City Visualization (Center Stage) */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-1 relative overflow-hidden group hover:border-slate-700 transition-all shadow-2xl touch-none">
                     <IsometricCity 
                        onNavigate={setView}
                        accounts={projectedData.accounts}
                        health={projectedData.health}
                        goals={goals}
                        hasWeeds={hasWeeds}
                        isFuture={timeYear > 2025}
                        weeklyBuilds={impulseItems.map(i => ({
                            id: i.id,
                            name: i.name,
                            target: i.price,
                            saved: i.savedAmount
                        }))}
                        subscriptions={subscriptions}
                     />
                     
                     <TimeTravelUI 
                        year={timeYear}
                        setYear={setTimeYear}
                        mode={timeMode}
                        setMode={setTimeMode}
                        netWorthDelta={projectedData.netWorthDelta}
                     />
                </div>

                {/* 5. Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button onClick={() => setView(AppView.WALLET)} className="bg-slate-800 hover:bg-slate-700 p-6 rounded-xl border border-slate-700 text-left group transition-colors">
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">👛</div>
                        <h3 className="text-white font-bold">My Wallet</h3>
                        <p className="text-slate-400 text-xs mt-1">Manage Banks & Debts.</p>
                    </button>
                    
                    <button onClick={() => setView(AppView.HECS_CALCULATOR)} className="bg-slate-800 hover:bg-slate-700 p-6 rounded-xl border border-slate-700 text-left group transition-colors">
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">🎓</div>
                        <h3 className="text-white font-bold">HECS Strategy</h3>
                        <p className="text-slate-400 text-xs mt-1">Debt Destruction Event</p>
                    </button>

                    <button onClick={() => setView(AppView.BATTERY_CALC)} className="bg-slate-800 hover:bg-slate-700 p-6 rounded-xl border border-slate-700 text-left group transition-colors col-span-2 md:col-span-1">
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">🔋</div>
                        <h3 className="text-white font-bold">Battery ROI</h3>
                        <p className="text-slate-400 text-xs mt-1">2025 Solar Rebates</p>
                    </button>
                </div>

            </div>
        )}

        {view === AppView.ADVISOR && <Advisor health={health} />}
        {view === AppView.WALLET && <WalletManager accounts={accounts} onUpdateAccounts={setAccounts} health={health} onUpdateHealth={setHealth} />}
        {view === AppView.SUBSCRIPTIONS && <SubscriptionManager transactions={transactions} subscriptions={subscriptions} onUpdateSubscriptions={setSubscriptions} />}
        {view === AppView.HECS_CALCULATOR && <div className="max-w-3xl mx-auto"><HECSCalculator /></div>}
        {view === AppView.BATTERY_CALC && <BatteryROI />}
        {view === AppView.DATA_IMPORT && <DataIngestion onDataLoaded={(d) => { setTransactions([...transactions, ...d]); setView(AppView.DASHBOARD); }} />}
        {view === AppView.HANGAR && <ImpulseHangar health={health} onUpdateHealth={setHealth} items={impulseItems} onUpdateItems={setImpulseItems} />}
        {view === AppView.GIG_PORT && <GigPort health={health} onUpdateHealth={setHealth} />}
        {view === AppView.CRISIS && <CrisisCommand accounts={accounts} />}
        {view === AppView.SIDE_QUESTS && <SideQuests />}
        {view === AppView.LAUNCHPAD && <Launchpad health={health} onUpdateHealth={setHealth} goals={goals} onUpdateGoals={setGoals} />}

      </main>
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
} else {
  console.error("Failed to find the root element");
}
