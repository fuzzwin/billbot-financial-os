
import React, { useState, useEffect, useMemo } from 'react';
import './index.css';
import { AppView, FinancialHealth, Transaction, Subscription, AccountItem, ImpulseItem, Goal, AccountType, Bill, BillCategory, ThemeMode } from './types';
import { 
  HomeView, 
  MoneyView, 
  GoalsView, 
  HelpView, 
  WelcomeOverlay, 
  ErrorBoundary, 
  ConfettiBurst,
  getThemeIcon,
  DUMMY_ACCOUNTS,
  DUMMY_SUBSCRIPTIONS,
  DUMMY_GOALS,
  DUMMY_BILLS
} from './components/DashboardViews';
import { WeeklyBriefing } from './components/WeeklyBriefing';
import { Advisor } from './components/Advisor';
import { 
  loadFinancialHealth, 
  saveFinancialHealth, 
  loadTransactions, 
  saveTransactions, 
  loadSubscriptions, 
  saveSubscriptions, 
  loadAccounts, 
  saveAccounts, 
  loadImpulseItems, 
  saveImpulseItems, 
  loadGoals, 
  saveGoals, 
  loadBills, 
  saveBills 
} from './services/storageService';
import { postNativeMessage } from './services/nativeBridge';
import { TactileButton } from './components/ui/TactileButton';
import { RecessedInput } from './components/ui/RecessedInput';
import { ChassisWell } from './components/ui/ChassisWell';
import { LEDIndicator } from './components/ui/LEDIndicator';

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
    postNativeMessage({
      type: 'billbot_app_mount',
      payload: { timestamp: new Date().toISOString() },
    });

    const savedHealth = loadFinancialHealth();
    const savedSubs = loadSubscriptions();
    const savedAcc = loadAccounts();
    const savedGoals = loadGoals();
    const savedBills = loadBills();
    
    if (savedHealth) setHealth(prev => ({...prev, ...savedHealth}));
    
    if (savedSubs.length > 0) setSubscriptions(savedSubs);
    else setSubscriptions(DUMMY_SUBSCRIPTIONS);

    if (savedAcc.length > 0) setAccounts(savedAcc);
    else setAccounts(DUMMY_ACCOUNTS);
    
    if (savedGoals.length > 0) setGoals(savedGoals);
    else setGoals(DUMMY_GOALS);
    
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
    { view: AppView.HOME, icon: '🏙️', label: 'GRID' },
    { view: AppView.MONEY, icon: '📊', label: 'CASH' },
    { view: AppView.GOALS, icon: '🎯', label: 'MODS' },
    { view: AppView.HELP, icon: '🤖', label: 'OPS' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-industrial-base text-industrial-text font-sans transition-colors duration-500 overflow-hidden flex flex-col" 
      style={{ 
        height: '100%', 
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
      }}
      data-theme={theme}
    >
      
      {/* Theme Toggle */}
      {view !== AppView.HOME && (
        <div className="fixed right-6 z-[110]" style={{ top: 'calc(var(--bb-safe-top) + 1.5rem)' }}>
          <button 
            onClick={toggleTheme}
            className="w-12 h-12 rounded-2xl bg-industrial-base shadow-tactile-raised border-t border-l border-white/40 flex items-center justify-center text-xl hover:scale-105 active:scale-95 active:shadow-well transition-all duration-200"
            title={`Theme: ${theme}`}
          >
            {getThemeIcon(theme)}
          </button>
        </div>
      )}

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

      <main
        className={`w-full max-w-lg mx-auto relative flex flex-col flex-1 transition-all duration-300 ${view === AppView.HOME || view === AppView.HELP ? 'overflow-hidden touch-none' : 'overflow-y-auto overscroll-contain'}`}
        style={{
          paddingTop: view === AppView.HOME ? '0' : 'calc(var(--bb-safe-top) + 2rem)',
          paddingBottom: view === AppView.HOME ? '0' : 'calc(7.5rem + var(--bb-safe-bottom))',
          height: '100%',
          minHeight: '0'
        }}
      >
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

      <nav
        className="fixed left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-industrial-base/95 backdrop-blur-md border-t border-l border-white/30 rounded-3xl shadow-tactile-raised z-[100] p-1"
        style={{ bottom: 'calc(var(--bb-safe-bottom) + 1rem)' }}
      >
        <div className="flex justify-between items-center bg-industrial-well-bg shadow-well rounded-2xl p-0.5">
          {navItems.map(item => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`
                flex-1 py-3 px-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 rounded-xl relative overflow-hidden min-h-[52px]
                ${view === item.view 
                  ? 'bg-industrial-base shadow-tactile-sm text-[#3B82F6]' 
                  : 'text-industrial-subtext/50 hover:text-industrial-text'
                }
              `}
            >
              <span className={`text-lg transition-transform ${view === item.view ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className={`text-[8px] font-black uppercase tracking-[0.15em] leading-none ${view === item.view ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
              
              {view === item.view && (
                <div className="absolute top-1.5 right-1.5">
                  <div className="w-1 h-1 rounded-full bg-[#3B82F6]" />
                </div>
              )}
            </button>
          ))}
        </div>
      </nav>
      
      {editingGoal && (
        <div className="fixed inset-0 bg-industrial-base/95 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <ChassisWell className="w-full max-w-md" label="Edit goal">
            <div className="space-y-6">
              <RecessedInput 
                label="Name"
                value={editingGoal.name}
                onChange={(e) => setEditingGoal({...editingGoal, name: e.target.value})}
              />
              <RecessedInput 
                label="Target amount ($)"
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
                  Save
                </TactileButton>
              </div>
            </div>
          </ChassisWell>
        </div>
      )}
    </div>
  );
};

export default App;
