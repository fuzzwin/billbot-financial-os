
export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  isDeductible: boolean;
  gstIncluded: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
  nextDueDate: string;
  category: string;
  isOptimizable: boolean; // AI flag for "You might want to cancel this"
}

export interface ImpulseItem {
  id: string;
  name: string;
  price: number;
  dateAdded: string; // ISO string
  savedAmount: number; // For the "Maybuy" construction mechanic
  targetWeeklySave: number;
}

export interface WeeklyBuild {
  id: string;
  name: string;
  target: number;
  saved: number;
}

export type AccountType = 'CASH' | 'SAVINGS' | 'INVESTMENT' | 'SUPER' | 'LOAN' | 'CREDIT_CARD' | 'HECS';

export interface AccountItem {
  id: string;
  name: string; // e.g. "CommBank Everyday"
  type: AccountType;
  balance: number;
  interestRate?: number; // For debts
  limit?: number; // For credit cards
  isValueBuilding?: boolean; // User flag for "Devine Value" (e.g. Travel Fund)
}

export interface FinancialHealth {
  // Income
  annualSalary: number;
  monthlyIncome: number; // Net
  salarySacrifice: number;
  gigIncome?: number; // Side gig/freelance income
  isStudent: boolean; // Triggers Poverty/Youth Allowance logic
  
  // Derived from Accounts
  savings: number;
  hecsDebt: number;
  mortgageBalance: number;
  otherDebts: number;
  
  // Cashflow
  monthlyExpenses: number;
  survivalNumber: number; // Minimum viable expenses
  
  // Metrics
  score: number; // 0-100
  willpowerPoints: number; // Gamification currency
  taxVault: number; // Gig economy tax quarantine
  
  // Progress tracking (new)
  checkInStreak: number; // Weekly check-in streak
  lastCheckIn?: string; // ISO date of last weekly check-in
  totalSavedSinceStart?: number; // Running total of savings progress
  subscriptionsKilled?: number; // Count of killed subscriptions
  goalsCompleted?: number; // Count of completed goals
  joinedAt?: string; // When user started using the app
}

// Simplified navigation - 4 main zones
export enum AppView {
  HOME = 'HOME',           // Dashboard with city, health score, next action
  MONEY = 'MONEY',         // Cash flow: income, expenses, subscriptions, bills
  GOALS = 'GOALS',         // Unified goals: rockets + impulse items + challenges
  HELP = 'HELP',           // AI advisor + crisis command + tools
}

// Legacy views kept for backward compatibility during transition
export enum LegacyAppView {
  DASHBOARD = 'DASHBOARD',
  CITY = 'CITY',
  SUBSCRIPTIONS = 'SUBSCRIPTIONS',
  HECS_CALCULATOR = 'HECS_CALCULATOR',
  BATTERY_CALC = 'BATTERY_CALC',
  DATA_IMPORT = 'DATA_IMPORT',
  ADVISOR = 'ADVISOR',
  WALLET = 'WALLET',
  HANGAR = 'HANGAR',
  GIG_PORT = 'GIG_PORT',
  CRISIS = 'CRISIS',
  SIDE_QUESTS = 'SIDE_QUESTS',
  LAUNCHPAD = 'LAUNCHPAD'
}

export interface HECSSimulationResult {
  strategy: 'PAY_HECS' | 'OFFSET_MORTGAGE';
  savingsDiff: number;
  description: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface EffectiveLifeItem {
  asset: string;
  lifeYears: number;
  rate: number; // Prime Cost
}

export interface BillScanResult {
  biller: string;
  amount: number;
  dueDate: string;
  isTaxDeductible: boolean;
  summary: string;
}

export type HardshipType = 'MORATORIUM' | 'REDUCED_PAYMENT';

export interface HardshipRequest {
    userName: string;
    creditorName: string;
    accountNumber: string;
    reason: string;
    type: HardshipType;
    offerAmount?: number;
    durationMonths: number;
}

// Unified Goal type - merges old Launchpad rockets + Impulse Hangar items
export type GoalType = 'rocket' | 'impulse'; // rocket = serious goal, impulse = maybe-buy
export type GoalCategory = 'travel' | 'gadget' | 'car' | 'gift' | 'house_deposit' | 'emergency' | 'experience' | 'other';
export type GoalTag = 'Adventure' | 'Treat' | 'Security' | 'Gift' | 'Freedom';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO string - optional for impulse items
  category: GoalCategory;
  valueTag: GoalTag;
  goalType: GoalType; // 'rocket' for serious goals, 'impulse' for maybe-buys
  weeklyTarget?: number; // For impulse items - weekly save target
  createdAt: string; // Track when goal was created
  completedAt?: string; // Track when goal was achieved
  emoji?: string; // Custom emoji for the goal
}
