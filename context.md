
# BillBot Application Architecture

> **📋 See `.cursorrules`** for AI coding guidelines, common pitfalls, and quick reference.

## 1. System Overview
BillBot is a **local-first, AI-native financial operating system** tailored for the Australian market. It uses a **React 18** frontend, **Three.js (@react-three/fiber)** for data visualization (gamified city), and **Google Gemini Flash 2.5** for intelligence (OCR, categorization, advisory).

**Design Philosophy:**
1.  **Local-First:** All data persists to `localStorage`. No external database.
2.  **Gamification:** Financial data is mapped to 3D objects (Accounts = Buildings, Debt = Pollution/Warning Beacons, Goals = Rockets).
3.  **Australian Context:** Hardcoded logic for HECS/HELP loans, ATO tax rules, Superannuation, and GST.

---

## 2. Tech Stack & Dependencies

*   **Runtime:** Browser (ES Modules via Vite)
*   **Framework:** React 18.3.1 (TypeScript 5.8)
*   **Styling:** Tailwind CSS (compiled locally at build time; no CDN dependency for offline iOS)
*   **3D Engine:** Three.js 0.167.1 + @react-three/fiber 8.17.6 + @react-three/drei 9.112.0 + @react-three/postprocessing 2.16.2
*   **AI SDK:** `@google/genai` 1.33.0 (Model: `gemini-2.5-flash`)
*   **Charts:** Recharts 2.13.0
*   **State:** React `useState` / `useEffect` + Custom LocalStorage Hooks.
*   **Math:** `maath` 0.10.7 (for 3D helpers), native JS Math functions.
*   **Utils:** `uuid` 10.0.0 for ID generation

---

## 3. Data Models (`types.ts`)

The application revolves around the `FinancialHealth` derived state and specific entities.

### Core User State
```typescript
export interface FinancialHealth {
  // Income
  annualSalary: number;     // Gross Income
  monthlyIncome: number;    // Net Income (Post-Tax)
  salarySacrifice: number;  // Pre-tax super contributions
  isStudent: boolean;       // Triggers Poverty/Youth Allowance logic
  
  // Derived from Accounts
  savings: number;          // Sum of CASH, SAVINGS, INVESTMENT, SUPER accounts
  hecsDebt: number;         // Sum of HECS accounts
  mortgageBalance: number;  // Mortgage tracking
  otherDebts: number;       // Sum of LOAN, CREDIT_CARD accounts
  
  // Cashflow
  monthlyExpenses: number;  // Static user input or derived
  survivalNumber: number;   // Minimum viable expenses (bare survival budget)
  
  // Metrics
  score: number;            // 0-100 Health Score (drives City activity level)
  willpowerPoints: number;  // Gamification currency earned by financial discipline
  taxVault: number;         // Gig Economy withholding (quarantined tax money)
}
```

### Account Entities (The Buildings)
```typescript
export type AccountType = 'CASH' | 'SAVINGS' | 'INVESTMENT' | 'SUPER' | 'LOAN' | 'CREDIT_CARD' | 'HECS';

export interface AccountItem {
  id: string;
  name: string;             // e.g. "CommBank Everyday"
  type: AccountType;
  balance: number;
  interestRate?: number;    // For debts (APR)
  limit?: number;           // For credit cards
  isValueBuilding?: boolean; // User flag for "Divine Value" (e.g. Travel Fund)
}
```

### Goal Entities (The Rockets)
```typescript
// Unified Goal type - merges old Launchpad rockets + Impulse Hangar items
export type GoalType = 'rocket' | 'impulse'; // rocket = serious goal, impulse = maybe-buy
export type GoalCategory = 'travel' | 'gadget' | 'car' | 'gift' | 'house_deposit' | 'emergency' | 'experience' | 'other';
export type GoalTag = 'Adventure' | 'Treat' | 'Security' | 'Gift' | 'Freedom';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;    // Logic: Fueling this depletes 'savings'
  deadline?: string;        // ISO string - optional for impulse items
  category: GoalCategory;
  valueTag: GoalTag;
  goalType: GoalType;       // 'rocket' for serious goals, 'impulse' for maybe-buys
  weeklyTarget?: number;     // For impulse items - weekly save target
  createdAt: string;         // Track when goal was created
  completedAt?: string;      // Track when goal was achieved
  emoji?: string;            // Custom emoji for the goal
}
```

### Impulse Entities (The Hangar)
```typescript
export interface ImpulseItem {
  id: string;
  name: string;
  price: number;
  dateAdded: string;        // ISO string
  savedAmount: number;      // For the "Maybuy" construction mechanic
  targetWeeklySave: number; // Weekly contribution target
}

// Used in City visualization
export interface WeeklyBuild {
  id: string;
  name: string;
  target: number;
  saved: number;
}
```

### Transaction & Subscription Entities
```typescript
export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  isDeductible: boolean;    // ATO tax deduction flag
  gstIncluded: boolean;     // Australian GST tracking
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
  nextDueDate: string;
  category: string;
  isOptimizable: boolean;   // AI flag for "You might want to cancel this"
}

// Recurring bills/expenses - rent, utilities, insurance, etc.
export type BillCategory = 'RENT' | 'MORTGAGE' | 'UTILITIES' | 'INSURANCE' | 'PHONE_INTERNET' | 'TRANSPORT' | 'OTHER';

export interface Bill {
  id: string;
  name: string;             // e.g. "AGL Electricity", "Landlord - Rent"
  amount: number;
  cycle: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  nextDueDate: string;
  category: BillCategory;
  isAutoPay: boolean;       // Auto-debit from account?
  isPaid?: boolean;         // Mark as paid for current period
  notes?: string;           // e.g. "Account #12345"
}
```

### Additional Types
```typescript
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface BillScanResult {
  biller: string;
  amount: number;
  dueDate: string;
  isTaxDeductible: boolean;
  summary: string;
}

export interface EffectiveLifeItem {
  asset: string;
  lifeYears: number;
  rate: number;             // Prime Cost depreciation rate
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

export interface HECSSimulationResult {
  strategy: 'PAY_HECS' | 'OFFSET_MORTGAGE';
  savingsDiff: number;
  description: string;
}
```

### Navigation
```typescript
// Simplified navigation - 4 main zones (v3.0+)
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
```

---

## 4. Component Architecture

### A. Root & State (`App.tsx`)
*   **Responsibility:** Loads data from `storageService.ts` on mount, manages global state.
*   **State Propagation:** Props drill down to views.
*   **Navigation:** State variable `view: AppView` determines the rendered component (4 main zones: HOME, MONEY, GOALS, HELP).
*   **Calculation Engine:** Contains `projectedData` memoized hook that runs time-series simulations (Year 2025 -> 2030) based on `Drift` (Standard) vs `Turbo` (Optimized) modes.
*   **Error Boundary:** Wraps entire app with ErrorBoundary class component for graceful failure handling.
*   **Tutorial System:** First-time users see `WelcomeOverlay` with 4-step onboarding.
*   **Dummy Data:** Fallback data for accounts, transactions, subscriptions, bills, impulse items, and goals if localStorage is empty.
*   **Modal Components:** AccountModal, SubscriptionModal, BillModal, GoalModal, ImportModal for CRUD operations.

### B. 3D Visualization (`IsometricCity.tsx`)
Maps `AccountItem[]` and `FinancialHealth` to a Three.js Canvas.

*   **Visual Elements:**
    *   Buildings with different styles based on account type
    *   4-way intersection with flat road surface (no fountain)
    *   Crosswalks at intersection corners
    *   Roads with lane markings and sidewalks
    *   Trees, street lamps
    *   Marina with bobbing boats
    *   Construction sites for Impulse items
    *   Drifting clouds in the sky

*   **Traffic System (Updated v2):**
    *   **Cars:** Drive straight through intersection in 4 directions
        *   `EAST`: North lane (-Z), travels +X
        *   `WEST`: South lane (+Z), travels -X  
        *   `SOUTH`: East lane (+X), travels +Z
        *   `NORTH`: West lane (-X), travels -Z
    *   **Traffic Lights:** 8-second cycle (3s green, 1s yellow, 4s other direction)
        *   Horizontal (E/W) green → Vertical (N/S) stops
        *   Vertical (N/S) green → Horizontal (E/W) stops
    *   **Stop Line:** Cars stop 1.8 units from center when light is red
    *   **Speed:** Consistent 0.025-0.035 units/frame
    *   **Pedestrians:** Walk around 4 quadrant sidewalks (NW, NE, SW, SE)
        *   Crosswalk awareness - wait at inner corners when traffic flowing
        *   Animated walking legs

*   **Mapping Logic:**
    *   `SAVINGS` -> Building with Golden Dome
    *   `INVESTMENT` -> Building with Antenna + Red beacon
    *   `SUPER` -> Purple Building with Dome
    *   `LOAN`/`CREDIT_CARD`/`HECS` -> Building with Red Warning Beacon
    *   `Goal` -> Rocket on launchpad atop a building
    *   `ImpulseItem` -> Construction site with crane

*   **Visual Feedback:**
    *   `health.score` determines # of cars (2-6) and people (4-12)
    *   `health.score` determines animation speed multiplier (0.3-0.8x)
    *   `isFuture` prop changes lighting/skybox (Day -> Neon purple night)

*   **Features:**
    *   Auto-rotate toggle
    *   OrthographicCamera with OrbitControls
    *   Shadow casting enabled

### C. AI Services (`geminiService.ts`)
All AI functions use `gemini-2.5-flash` model with custom `SYSTEM_INSTRUCTION` persona.

*   **`adviseOnPurchase`:** Financial health + item details -> "VERDICT: [Green/Yellow/Red Light]" with City metaphor explanation
*   **`categorizeTransactions`:** CSV string -> JSON array of Transaction objects with tax deductibility detection
*   **`detectSubscriptions`:** Transaction list -> Identified recurring payments as Subscription objects
*   **`scanBillImage`:** Multimodal image/PDF (base64) -> JSON extraction (Biller, Amount, Due Date)
*   **`parseEmailContent`:** Email text -> BillScanResult extraction
*   **`chatWithAdvisor`:** RAG-lite chat - Injects `FinancialHealth` JSON into system prompt for context-aware conversation
*   **`analyzeHECSvsMortgage`:** HECS balance + mortgage rate + available cash -> Strategic recommendation

**BillBot Persona Rules:**
1. Never use jargon
2. Be direct (if bad idea, say it)
3. Use "City" metaphor (Money = Water/Materials, Debt = Pollution/Fire/Smog)
4. Australian context (AUD, GST, Super, HECS, "Lazy Tax")

### D. Compliance & Calc Engines

#### `complianceService.ts`
*   **`COMMON_ASSETS`:** ATO 2025 Effective Life Determinations database (Laptop, Phone, Monitor, etc.)
*   **`searchEffectiveLife`:** Query asset name -> depreciation rates
*   **`validateABN`:** 11-digit ABN checksum validation (fraud prevention)
*   **`generateHardshipLetter`:** HardshipRequest -> Legal letter template citing National Credit Code

#### `HECSCalculator.tsx`
*   **2025 Legislation Constants:**
    *   `HECS_INDEXATION_FORECAST`: 4.0%
    *   `DEBT_WAIVER_PERCENT`: 20% (Government "Debt Destruction" event)
    *   `NEW_REPAYMENT_THRESHOLD`: $67,000
    *   `FREEZE_DATE`: June 1st, 2025
*   **Features:**
    *   Countdown banner to debt waiver date
    *   Compares Mortgage Offset Rate vs HECS Indexation
    *   Deterministic advice + AI analysis

#### `CrisisCommand.tsx`
*   **Three Modes:**
    1. **TRIAGE:** Priority hierarchy (Roof > Critical Assets > Unsecured Debt)
    2. **LETTER:** Hardship letter generator with Moratorium/Reduced Payment options
    3. **OMBUDSMAN:** EDR escalation links (AFCA, EWON/EWOV, TIO)

#### `BatteryROI.tsx`
*   **2025 Federal Battery Rebate Logic:**
    *   Base rebate: $3,500
    *   Taper threshold: 14kWh
    *   Reduction: $500 per kWh over threshold
*   Calculates real cost after rebate and payback period

### E. Gamification Components

#### `Launchpad.tsx`
*   Goal management with rocket visualization
*   "Reality Check Banner" - compares weekly surplus to weekly goal requirements
*   Fuel mechanism: Add money to goals incrementally
*   Launch animation with 2-second delay, deducts from savings, awards Willpower Points

#### `RocketSilo.tsx`
*   Individual rocket visualization component
*   Uses `useGoalCalculator` hook for status calculation
*   Color-coded status lights (green/amber/red)
*   Fuel level visual (liquid rising)
*   Lock icon during Crisis Mode (Status goals paused)

#### `ImpulseHangar.tsx`
*   "Park items. Build savings. Decide later."
*   Construction visualization with crane and fill level
*   Weekly contribution button
*   Decision modal on goal completion: Buy Item vs Keep Cash (+50 WP)

#### `SideQuests.tsx`
*   **Weather Challenge:** Save amount = current temperature in $
*   **Reverse 52-Week Challenge:** Save big early, easy later (Week 1 = $52, Week 52 = $1)

### F. Dashboard Components

#### `CashflowMonitor` (inline in App.tsx)
*   Visual bar showing expenses vs surplus
*   Color-coded (rose for expenses, emerald for surplus)

#### `SafeZoneShield.tsx`
*   Shield icon with status indicator
*   **SAFE:** Cashflow > 0 AND Savings > 1 month expenses
*   **CAUTION:** Cashflow > 0 BUT Savings < 1 month expenses
*   **DANGER:** Cashflow < 0 (bleeding mode with pulse animation)

#### `TimeTravelUI.tsx`
*   Year slider (2025-2030)
*   Mode toggle: Drift (current path) vs Turbo (optimized)
*   Net worth delta display
*   **Tangible Goal Conversion:** Maps net worth amounts to real-world equivalents ($150k+ = House Deposit, $60k = Luxury Car, etc.)

#### `WeeklyBriefing.tsx`
*   Step-through balance update wizard
*   Iterates through all accounts
*   Shows net worth change summary at end

### G. Management Components

#### `MoneyView` (inline in App.tsx)
*   **Tabbed Interface:** Overview, Accounts, Bills, Subscriptions, Transactions
*   **Overview Tab:**
    *   Income section (salary, gig income, tax vault)
    *   Expense breakdown (Bills, Subscriptions, Other Spending)
    *   Monthly surplus calculation with health indicator
*   **Accounts Tab:**
    *   Assets section (CASH, SAVINGS, INVESTMENT, SUPER) with Add/Edit/Delete
    *   Liabilities section (LOAN, CREDIT_CARD, HECS) with Add/Edit/Delete
    *   AccountModal for creating/editing accounts
*   **Bills Tab:**
    *   Bills grouped by category (RENT, MORTGAGE, UTILITIES, INSURANCE, etc.)
    *   Overdue/due soon indicators
    *   Auto-pay badges
    *   BillModal for creating/editing bills
*   **Subscriptions Tab:**
    *   List of all subscriptions with "Axe" delete buttons
    *   Optimization flags (isOptimizable)
    *   SubscriptionModal for adding new subscriptions
*   **Transactions Tab:**
    *   Transaction list with merchant, amount, date, category
    *   ImportModal for adding transactions manually
    *   Delete functionality

#### `WalletManager.tsx`
*   **Sections:** Assets vs Liabilities columns
*   **Net Worth Hero:** Total calculation display
*   **Debt Crusher Calculator:**
    *   BY_DATE mode: Target payoff date -> Required monthly payment
    *   BY_BUDGET mode: Monthly payment -> Time to freedom
    *   Uses PMT/NPER financial formulas
*   Income settings editor

#### `SubscriptionManager.tsx`
*   Auto-detect subscriptions from transactions via AI
*   Filter: All Active vs Optimization Opportunities
*   Monthly/Yearly burn calculation
*   Due date status indicators (Overdue, Due soon)
*   "Crush" animation on removal

#### `PurchaseAdvisor.tsx` (Dashboard Hero)
*   "Asset Scanner" modal
*   Work-related toggle for tax deduction calculation
*   Estimated refund at 32.5% marginal rate
*   AI verdict integration

### H. Data Input Components

#### `DataIngestion.tsx` ("The Shoebox")
*   File upload: CSV, Images, PDF
*   Text dump zone for pasting emails/receipts
*   Bill confirmation dialog with extracted data
*   Converts to Transaction on confirmation

#### `GigPort.tsx`
*   Gig economy income processor
*   30% automatic tax quarantine
*   Visual "truck" animation during processing
*   Only net amount hits savings

### I. AI Chat Interface & Help Tools

#### `HelpView` (inline in App.tsx)
*   **Tabbed Interface:** Chat, SOS, Tools
*   **Chat Tab:** Embedded chat interface (placeholder for Gemini integration)
*   **SOS Tab:** Crisis priority guide and hardship letter generator
*   **Tools Tab:**
    *   **HECS Strategy Calculator** - Interactive tool with 2025 legislation awareness
        *   Input: HECS balance, annual income, mortgage rate
        *   Output: 20% waiver calculation, repayment threshold check, strategic advice
    *   **Tax Deduction Lookup** - Search ATO Effective Life database
        *   Search work-related assets (laptop, phone, desk, etc.)
        *   Returns depreciation rates and effective life years
    *   **ABN Validator** - Validate Australian Business Numbers
        *   Uses official ATO checksum algorithm
        *   Returns validation result with fraud warning if invalid

#### `Advisor.tsx`
*   Full-height chat interface
*   Message history with typing indicators
*   **Tools Sidebar:**
    *   Effective Life Lookup: Search ATO depreciation database
    *   ABN Checker: Validate business numbers

### J. Onboarding

#### `Profile.tsx`
*   3-step onboarding wizard
*   Collects: Annual salary, Monthly income, HECS debt, Other debts, Savings, Survival number
*   Help tips explaining Australian-specific concepts

---

## 5. Key Logic Flows

### 1. The "Launchpad" Mechanic (Spending Guilt-Free)
*   **Concept:** Money saved for goals is meant to be burned.
*   **Flow:**
    1.  User creates `Goal` (Rocket or Impulse) with name, target, deadline (optional), value tag, emoji
    2.  User "Fuels" Goal (Increment `currentAmount` via +$50/+$100/+$500 buttons)
    3.  User "Launches" Goal when fuel = 100%
    4.  **Result:** 
        *   For Rockets: `Goal` is deleted after 2-second animation, `FinancialHealth.savings` is **reduced** by the target amount, and `willpowerPoints` increase by 100
        *   For Impulses: User chooses "Buy It" (same as rocket) or "Keep Cash" (adds to savings, +50 WP, removes goal)
    5.  **Edit/Delete:** Users can edit goal details (name, amount, deadline, emoji) or delete goals without launching

### 2. Time Travel Simulation (`App.tsx` -> `projectedData`)
*   **Inputs:** Current Accounts, Income, Expenses
*   **Mode `DRIFT`:**
    *   Surplus adds to Savings at 0.3% monthly yield
    *   Deficit adds to Debt at 1.5% monthly interest (18% APR)
*   **Mode `TURBO`:**
    *   Expenses reduced by 10%
    *   Income increased by 5%
    *   Investment yield increased to 0.5% monthly
*   **Crisis Debt:** If deficit and no debt accounts exist, creates "Unpaid Bills" credit card
*   **Output:** `projectedAccounts`, `projectedHealth`, `netWorthDelta`

### 3. Asset Scanning (`PurchaseAdvisor.tsx`)
*   **Logic:**
    1.  Input Price + Item Name
    2.  Toggle "Work Related?"
    3.  If Work Related: Calculate `EstimatedRefund = Price * 0.325` (Marginal Tax Rate)
    4.  Send data to Gemini for "Verdict" based on `freeCash = Income - Expenses`

### 4. Health Score Calculation (`App.tsx`)
*   Base score: 50
*   +10 if Net Worth > $10,000
*   +10 if Net Worth > $50,000
*   +20 if Other Debts = $0
*   -10 if Other Debts > $5,000
*   Clamped to 0-100

### 5. Gig Port Tax Quarantine
*   Gross income input
*   30% moved to `taxVault`
*   70% (net) added to `savings`
*   Prevents accidental spending of tax obligations

### 6. Impulse Hangar Flow
*   Add item with name, price, weekly save target
*   Click "Add Weekly Contribution" to simulate week passing
*   On goal reached: Decision modal
    *   Buy Item: Remove from hangar
    *   Keep Cash: Add price to savings, +50 WP, remove from hangar

---

## 6. Hooks

### `useGoalCalculator.ts`
Calculates goal status metrics:
```typescript
interface GoalStatus {
  weeklyContributionNeeded: number;  // (Target - Current) / Weeks Remaining
  daysRemaining: number;
  percentageComplete: number;
  isOnTrack: boolean;
  statusColor: 'green' | 'amber' | 'red';
}
```
**Status Color Logic:**
*   Red: <30 days remaining AND <80% complete, OR deadline passed
*   Amber: <90 days remaining AND <50% complete
*   Green: On track

---

## 7. Prompt Engineering Context
The AI is instructed via `SYSTEM_INSTRUCTION` in `geminiService.ts`.
*   **Persona:** "BillBot", a savvy friend, not a bank manager
*   **Metaphor:** Use "City" metaphors (Pollution, Reservoirs, Materials)
*   **Constraint:** Australian jurisdiction (AUD, GST, Super, HECS, "Lazy Tax" for overpriced bills)

---

## 8. Storage Schema (LocalStorage)
Keys:
*   `BILLBOT_HEALTH_V1`: `FinancialHealth` object
*   `BILLBOT_ACCOUNTS_V1`: Array of `AccountItem`
*   `BILLBOT_TRANSACTIONS_V1`: Array of `Transaction`
*   `BILLBOT_SUBSCRIPTIONS_V1`: Array of `Subscription`
*   `BILLBOT_BILLS_V1`: Array of `Bill` (recurring expenses)
*   `BILLBOT_IMPULSE_V1`: Array of `ImpulseItem`
*   `BILLBOT_GOALS_V1`: Array of `Goal`
*   `BILLBOT_HAS_SEEN_TUTORIAL`: Boolean flag (existence check)

---

## 9. Tutorial System
4-step overlay shown on first visit:
1. **Welcome:** Introduction to BillBot
2. **Wealth City:** 3D visualization explanation (navigates to Dashboard)
3. **Launchpad:** Rocket/goal system (navigates to Launchpad)
4. **Crisis Protocol:** Emergency features (navigates to Crisis)

---

## 10. Styling & Animations

### Custom Colors (Tailwind)
*   `neon-blue`: #00f3ff (cyan accent)
*   `neon-purple`: Purple accent
*   `neon-green`: Green accent

### CSS Animations
*   `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-bottom-4`: Entry animations
*   `animate-pulse`: Pulsing elements
*   `animate-bounce`: Bouncing elements
*   Subscription "crush" animation: scale-0, opacity-0, rotate-12
*   Rocket launch: `fly-off` animation (custom)
*   Gig Port: `smoke` animation for tax truck

---

## 11. Error Handling

### ErrorBoundary (Class Component)
*   Catches render errors across entire app
*   Displays "SYSTEM FAILURE" screen with error details
*   "REBOOT SYSTEM" button triggers page reload

### Service Error Handling
*   All Gemini service functions use try/catch
*   Fallback messages on API failure
*   Console error logging

---

## 12. Mobile Support & Development
*   Responsive sidebar (hidden on mobile, drawer navigation)
*   Mobile menu button in header
*   Touch-friendly city visualization (touch-none class)
*   Responsive grids throughout (1 col mobile, 2-3 cols desktop)
*   **Mobile Preview:** QR code page (`qr-preview.html`) for easy phone testing
    *   Vite dev server configured with `host: '0.0.0.0'` for network access
    *   Scan QR code to access app on phone via local network
    *   Requires phone and computer on same Wi-Fi network

---

## 13. Changelog

### v3.15 - iPhone UI Refinement & Space Optimization (Jan 2, 2026)
**Changes:**
1. **Unified Command Bar:** Consolidated top overlay cards (Net Worth, Stability, Theme) into a single horizontal HUD for better vertical space usage.
2. **Condensed Action HUD:** Refined the bottom action grid into a more compact dual-row HUD, reducing the vertical gap between city and navigation.
3. **Enhanced City Immersiveness:** Increased default zoom level on Home view to better fill "void" space with city details.
4. **Optimized Map Labels:** Scaled down quadrant signs and increased transparency for a cleaner, less cluttered 3D view.
5. **Touch Ergonomics:** Standardized action button heights to 48px+ for reliable iPhone interaction.

### v3.14 - iPhone & Scalability Optimization (Dec 22, 2025)
**Changes:**
1. **Responsive Typography:** Refactored large titles (`text-4xl` to `text-6xl`) to use responsive prefixes (e.g., `text-2xl md:text-4xl`), preventing overflow on small iPhone screens.
2. **Standardized Touch Targets:** Increased button hit areas to a minimum of `48px` height for `md` and `54px` for `lg` variants. Enlarged tab navigation and theme toggles for better ergonomics.
3. **Flexible City View:** Changed the `IsometricCity` container from fixed pixel heights to relative viewport units (`min-h-[45vh] max-h-[70vh]`), allowing the 3D map to scale better across different device aspect ratios.
4. **Enhanced Modals:** Refined all CRUD modals (`Account`, `Bill`, `Goal`, `Import`) with better padding and `rounded-3xl` corners, optimized for the "bottom sheet" pattern on mobile.
5. **Layout Tightening:** Reduced excessive padding in `App.tsx` and `HomeView` overlays to maximize screen real estate on smaller devices like the iPhone SE.
6. **Chat & Form Ergonomics:** Enlarged chat input fields and form elements for easier touch interaction.

### v3.13 - UI & Layout Recovery (Dec 21, 2025)
**Changes:**
1. **Tailwind Fix:** Imported `index.css` directly into `App.tsx` and removed the redundant `<link>` from `index.html`. This ensures Vite processes Tailwind classes, fixing the unstyled "broken" UI.
2. **Immersive Home View:** Refactored the `main` container and `HomeView` to allow the 3D city to occupy the full viewport (`100vh`) without being restricted by parent padding or `max-w-lg` constraints.
3. **Overlay Depth:** Adjusted the bottom overlay in `HomeView` to be positioned above the floating navigation bar (`bottom: 8.5rem`), ensuring all controls are visible and interactive.
4. **Layout Robustness:** Removed negative margins and fixed viewport height calculations for a more stable mobile experience.

### v3.12 - Offline iOS WebKit Wrapper (Dec 21, 2025)
**Changes:**
1. **Offline Web Bundle:** Removed runtime CDN dependencies (Tailwind CDN + `esm.sh` importmap) and switched to locally compiled Tailwind via PostCSS so the UI can ship offline.
2. **iOS Wrapper (Xcode 16):** Added a SwiftUI `WKWebView` shell with a custom `WKURLSchemeHandler` (`billbot://`) to serve the bundled web build from the app resources.
3. **Native Bridge:** Added a minimal JS↔︎native message bridge (`window.BillbotNative.postMessage`) for future native features (camera/files/etc).
4. **Safe-Area + Viewport Fixes:** Updated home HUD, bottom nav, and bottom-sheet modals to respect iPhone notch/home-indicator safe areas, and added a stable `--bb-vh` height var to prevent iOS Safari `100vh` layout overlap.

### v3.11 - City Readability + Clay Pass (Dec 19, 2025)
**Changes:**
1. **Waterfall/Fountain Fix:** Moved and resized the Cashflow Fountain off the central intersection so traffic never clips through it.
2. **Traffic Safety:** Added a simple “no-drive zone” system so cars won’t enter prop areas (future-proofing against new map objects).
3. **Map Signage:** Added in-world quadrant signposts (Banks, Debts, Goals, Harbor) for instant map comprehension.
4. **Claymation Look:** Softer materials and lighting (higher roughness, lower metalness), reduced emissive “neon” feel, added subtle fog and improved sky/ether gradients.
5. **Glow Tuning:** Reduced UI glow intensity in LEDs and a few hotspot elements to avoid over-bloomed UI.

### v3.10 - UI Overhaul: Clarity, Controls, Delight (Dec 19, 2025)
**Changes:**
1. **Typography & Readability:** Increased base label sizing and reduced “all-caps everywhere” feel for better scanning and accessibility.
2. **Color Semantics:** Standardized meaning across the app (blue = primary action, red = danger/debt, amber = warning) and synced Tailwind theme colors with CSS variables.
3. **Component Polish:** Simplified `ChassisWell` to remove noisy nested wells while keeping tactile depth; improved LED glow to match indicator color.
4. **Touch Targets:** Replaced tiny text controls with 44px+ icon buttons (edit/delete/close), and enlarged city controls for mobile friendliness.
5. **Human-first Language:** Updated modals and weekly check-in copy to plain English while preserving subtle “OS” flavor.
6. **Empty States:** Added illustrated empty states for Goals, Transactions, and Subscriptions with encouraging copy and clear CTAs.
7. **Mobile Modals:** Converted key modals to bottom-sheet style on mobile (full-width, safe-area friendly).
8. **Delight & Guidance:** Added a lightweight confetti burst on goal launches and introduced a city legend overlay (toggle “?”) to explain the map.
9. **3D Stability:** Fixed Three.js console errors by avoiding invalid emissive color values.

### v3.9 - Readability & Lingo Cleanup (Dec 18, 2025)
**Changes:**
1. **Simplified Lingo:** Replaced complex industrial terms with clear, everyday language:
   - "Monthly Burn" -> "Monthly Spending"
   - "Revenue Stream" -> "Monthly Income"
   - "Strategic Targets" -> "My Goals"
   - "Velocity Multiplier" -> "Weekly Savings"
   - "Operational Surplus" -> "Money Left Over"
   - "Initialize Asset" -> "Add Account"
   - "Neural Advisor" -> "AI Advisor"
2. **Visual Contrast:** 
   - Improved text sizing and weight for better readability on light backgrounds.
   - Replaced many all-caps "tactile-labels" with larger, bold, title-case headers.
   - Updated modal and button terminology to be more direct (e.g., "Cfg" -> "Edit", "Exec" -> "Send").
3. **3D Tooltip Clarity:** Updated Three.js tooltips to use human-friendly descriptions (e.g., "Your bank account" instead of "Liquidity storage node").
4. **Theme Consistency:** Refined theme background colors and border treatments for cleaner UI separation.
5. **Stability:** Fixed critical syntax errors in `App.tsx` caused by duplicated and nested component fragments.

### v3.8 - Vibrancy & Environmental Color (Dec 18, 2025)
**Changes:**
1. **Lush Environments:** Replaced brutalist grey ground planes with **vibrant green grass** across all themes, using deep forest greens for dark mode and fresh lawn greens for light mode.
2. **Skyward Bound:** Overhauled the skybox logic to use **blues and azure gradients** instead of monochromatic grays. Higher financial health scores now trigger a brighter, more vibrant sky blue.
3. **Hydration Boost:** Brightened the **water colors** in the Harbor and Fountain to better contrast with the new greenery.
4. **Natural Lighting:** Synchronized tree and foliage colors to match the new grass tones for a more cohesive "park" feel within the industrial grid.

### v3.7 - Atmospheric Enhancements & Architectural Detail (Dec 18, 2025)
**Changes:**
1. **Tiered Waterworks:** Redesigned the **Cashflow Fountain** with a 3-tiered 3D structure, animated water splashes, and a recessed pool.
2. **Night Sky & Stars:** Implemented a **Starfield system** that activates in Dark/Future modes to improve night-time atmosphere.
3. **Advanced Roofscape:** Added **Helipads** and HVAC antenna units to building roofs, providing more vertical detail.
4. **Urban Amenities:** Added **Sidewalk Benches** and refined street lamp geometry with metallic finishes.
5. **Traffic Refinement:** Improved car wheel geometry and adjusted intersection stop-line proximity for smoother traffic visualization.

### v3.6 - Grid Visualization Polish & Environmental Detail (Dec 18, 2025)
**Changes:**
1. **Infrastructure Detail:**
   - Added **lane markings** to all roads for a more realistic traffic flow.
   - Added **animated ripples** to the Harbor and Cashflow Fountain for dynamic water movement.
   - Implemented **Ground Grid** system to reinforce the "Financial Grid" metaphor.
2. **Ambience & Lighting:**
   - Added **Street Lamps** on all quadrant corners with dynamic lighting (point lights active at night).
   - Enhanced **Building Windows** with night-time emission (windows light up when theme is dark).
   - Added **Car Headlights** with emissive glow for better visibility during night cycles.
3. **Space Management:**
   - Implemented **Construction Sites** (scaffolding and foundation pads) to fill empty quadrant slots when user has few accounts or goals.
   - Added **Secondary Tree logic** to NW quadrant to create park-like environments in empty slots.
   - Increased **Cloud density** with drifting animations.
4. **Traffic Coordination:**
   - Refined pedestrian corner logic to ensure walkers stay precisely on sidewalks.
   - Synchronized environmental colors with industrial-neumorphic UI theme variables.

### v3.5 - UI Visual Overhaul & Industrial Neumorphism (Dec 18, 2025)
**Changes:**
1. **Design System Refresh:** Transitioned to a more refined "Industrial Neumorphic" aesthetic across all themes.
   - **Improved Shadows:** Increased blur radii and tuned shadow opacities for softer, deeper depth effects.
   - **Refined Color Palette:** Updated base and accent colors for better contrast and cohesive look in Light, Mid, and Dark modes.
   - **Enhanced Typography:** Improved font weights and letter spacings for better hierarchy and readability.
2. **Component Upgrades:**
   - **TactileButton:** Added subtle inner glows, improved active states, and theme-aware shadow colors for colored variants.
   - **ChassisWell:** Increased structural depth with border highlights and more recessed "wells".
   - **RecessedInput:** Improved visual depth and added focus ring animations.
   - **LEDIndicator:** Enhanced glow effects and added realistic light reflections.
3. **Navigation & UI Polishing:**
   - **Bottom Navigation:** Improved active tab selection with scaled icons and pulsing indicator lights.
   - **Tab Navigation:** Refined selection states in Money and Help views with tactile-inset designs.
   - **Home Overlays:** Upgraded the 3D view overlays with high-quality backdrop blurs and refined typography.
4. **Consistency Improvements:** Updated HECS Calculator, Crisis Command, and Profile onboarding to match the new industrial design language.
5. **3D City Coordination:** Synchronized the Isometric City environmental colors with the updated UI theme variables for a seamless transition between 2D and 3D.

### v3.4 - Complete CRUD & Bills Management (Dec 18, 2025)
**Changes:**
1. **Full CRUD for Accounts** - Add, edit, and delete assets/liabilities in Money view
   - AccountModal component with type selection, balance, interest rate fields
   - Edit and delete buttons on each account card
2. **Full CRUD for Subscriptions** - Add new subscriptions with cycle and category
   - SubscriptionModal component
   - Edit and delete functionality
3. **Full CRUD for Goals** - Edit goal details and delete without launching
   - GoalModal component with emoji picker, goal type toggle, deadline
   - Edit and delete buttons on all goals
4. **Transaction Management** - New Transactions tab in Money view
   - Add transactions manually with merchant, amount, date, category
   - Delete transactions
5. **Working Help Tools** - All tools now functional
   - HECS Strategy Calculator with 2025 legislation (20% waiver, $67k threshold)
   - Tax Deduction Lookup with ATO depreciation database search
   - ABN Validator with official checksum algorithm
6. **Mobile Preview** - QR code page for easy phone access
   - qr-preview.html with QR code generator
   - Vite config updated for network access (host: '0.0.0.0')

### v3.3 - Bills Section for Recurring Expenses (Dec 18, 2025)
**Changes:**
1. **New Bill Type** - Added `Bill` interface for recurring expenses
   - Categories: RENT, MORTGAGE, UTILITIES, INSURANCE, PHONE_INTERNET, TRANSPORT, OTHER
   - Cycles: WEEKLY, FORTNIGHTLY, MONTHLY, QUARTERLY, YEARLY
   - Auto-pay indicator and notes field
2. **Bills Tab in Money View** - New dedicated section
   - Bills grouped by category with visual icons
   - Overdue/due soon indicators (red/amber badges)
   - Full CRUD - Add, edit, delete bills
   - BillModal component with all fields
3. **Overview Integration** - Bills included in expense breakdown
   - Money Out section shows: Bills, Subscriptions, Other Spending
   - Monthly bills total calculated from all cycles
4. **Storage** - Added `BILLBOT_BILLS_V1` to localStorage schema
5. **Dummy Data** - Pre-populated with sample bills (rent, utilities, insurance)

### v3.2 - Improved Top Overlay Layout (Dec 18, 2025)
**Changes:**
1. Moved city view controls (zoom, bird's eye, rotate) to vertical stack on left side
2. Added dynamic AI "Insight Card" floating in the sky area
3. Insight card shows contextual tips based on user's financial state
4. Added z-index fixes for proper overlay stacking over Three.js canvas
5. Cleaner header layout with score ring + title on left, surplus badge on right

### v3.1 - City Controls & Camera (Dec 18, 2025)
**Changes:**
1. Added zoom in/out controls for city view
2. Added bird's eye view toggle (🦅) for top-down perspective
3. Added auto-rotate toggle (⟳) for cinematic view
4. Camera positions adjust dynamically based on view mode
5. OrbitControls enabled for manual rotation in bird's eye mode

### v3.0 - Major UI Overhaul: 4-Zone Navigation (Dec 18, 2025)
**Philosophy Change:** From "Swiss Army Knife with Everything" to "Financial Fitness in 5 Minutes a Week"

**Navigation Simplification:**
- Consolidated 12+ screens into 4 main zones:
  - **HOME** (🏙️): Dashboard with city, health score ring, cash left, AI-powered "Next Action", weekly check-in CTA
  - **MONEY** (💰): Unified cash flow view with Overview/Accounts/Subscriptions tabs
  - **GOALS** (🚀): Merged Launchpad rockets + Impulse Hangar into single goal system
  - **HELP** (🆘): Merged Crisis Command + AI Advisor + Tools
- Bottom tab navigation (mobile-first design)
- Removed Battery ROI (too niche)
- Removed separate Gig Port, Side Quests screens (merged into main flows)

**New Components:**
- `HealthScoreRing` - Circular progress indicator for health score
- `CashLeftCard` - Shows monthly surplus with visual bar
- `NextActionCard` - AI-powered suggestions for next financial action
- `QuickStats` - Net worth, active goals, willpower points
- `WelcomeOverlay` - 4-step onboarding for new users

**Goal System Unification:**
- Single `Goal` type with `goalType: 'rocket' | 'impulse'`
- Rockets = serious goals with deadlines
- Impulse = "maybe buys" with skip option (+50 WP)
- Visual fuel progress with +$50/+$100/+$500 buttons
- Launch celebration when goal is reached
- **Full CRUD** - Edit goal details (name, amount, deadline, emoji) and delete goals

**Money Flow Features:**
- Tabbed interface: Overview, Accounts, Bills, Subscriptions, Transactions
- Full CRUD for accounts (Assets & Liabilities) - Add, Edit, Delete
- Bills section for recurring expenses (Rent, Mortgage, Utilities, Insurance, etc.)
- Bills grouped by category with overdue/due soon indicators
- Full CRUD for subscriptions - Add, Edit, Delete
- Transaction management - Add and delete transactions
- Inline subscription "Kill" buttons
- Income editor with gig income + tax vault display
- Monthly surplus calculation includes bills, subscriptions, and other spending

**Help Center Features:**
- Embedded chat interface (placeholder for Gemini)
- Crisis priority guide (Roof > Assets > Debt)
- Quick action buttons for hardship letters, financial counsellors
- **Working Tools Section:**
  - **HECS Strategy Calculator** - Enter balance and income, get 2025 legislation-aware advice
  - **Tax Deduction Lookup** - Search ATO depreciation database for work assets
  - **ABN Validator** - Validate Australian Business Numbers with checksum algorithm

**Progress Tracking (New Fields):**
- `checkInStreak` - Weekly check-in streak counter
- `lastCheckIn` - ISO date of last check-in
- `subscriptionsKilled` - Count of killed subscriptions
- `goalsCompleted` - Count of launched goals
- `totalSavedSinceStart` - Running savings total

**Mobile/PWA Improvements:**
- Safe area padding for notches/home indicators
- PWA meta tags for home screen installation
- Bottom navigation with z-50 to stay above Three.js canvas
- Touch-friendly tap areas

### v2.2 - Meaningful City Elements (Dec 17, 2025)
**Changes:**
1. **Themed Quadrants** - Each quadrant now has a purpose:
   - NW: Asset buildings (Savings, Investment, Super, Cash)
   - NE: Debt buildings with smoke effects
   - SW: Goals/Rockets + Construction sites
   - SE: Harbor District (liquidity visualization)
2. **Cashflow Fountain** - Central fountain shows surplus/deficit
   - Water level rises with positive cashflow
   - Turns red and shows warning when negative
   - Ring indicator shows health status
3. **Subscription Drains** - Pipes around perimeter showing recurring expenses
   - Flow animation indicates cost level
   - Visual representation of "money leaking"
4. **Tax Vault Building** - Shows quarantined gig economy tax
   - Fill level indicates amount saved
   - Pulsing beacon when substantial balance
5. **Willpower Tower** - Grows with willpower points
   - Glowing rings for each 100 WP
   - Rotating beacon at top
6. **Divine Value Buildings** - Golden glow for `isValueBuilding` accounts
7. **Weather System** - Clouds respond to health score
   - Storm clouds (gray) when score < 40
   - More clouds appear during financial stress
8. **Harbor District** - Water level shows liquid savings
   - Boats bob in the water
   - Visual gauge shows savings vs max
9. **Debt Smoke Effect** - Debt buildings now emit animated smoke
10. **Dynamic Sky** - Background changes with health score
    - Sunny (score > 70)
    - Partly cloudy (score 40-70)
    - Overcast (score < 40)
11. **Enhanced UI** - Added cashflow indicator and legend overlay

**New Props:**
- `subscriptions: Subscription[]` - Now passed to IsometricCity for drain visualization

### v2.1 - Traffic System Overhaul (Dec 17, 2025)
**Changes:**
1. **Removed central fountain** - Intersection is now a flat 4-way crossroad
2. **Simplified car system** - Cars drive straight through in 4 directions (EAST, WEST, NORTH, SOUTH)
3. **Fixed car issues:**
   - No more cars driving through center/fountain
   - No more backwards-facing cars
   - No more random fast cars on borders
   - Cars stop properly at traffic lights (not in middle of street)
4. **Traffic light coordination:**
   - Horizontal cars (E/W) go when `horizontalGreen = true`
   - Vertical cars (N/S) go when `horizontalGreen = false`
   - Stop line at 1.8 units from intersection center
5. **Pedestrian system maintained** - Still walk on quadrant sidewalks with crosswalk awareness

### v2.0 - Initial Codebase Documentation (Dec 17, 2025)
*   Complete documentation of all components, data models, and logic flows
*   Tech stack and dependencies documented with versions
  *   All 13 AppView navigation states documented
  *   Storage schema and tutorial system documented

### v1.1 - iOS Safari Layout & Safe Area Optimization (Dec 23, 2025)
**Changes:**
1.  **Eliminated "White Gap":** Replaced legacy JS `vh` hacks with `fixed inset-0` root container and `height: -webkit-fill-available` on `html/body`.
2.  **Safe Area Precision:** Implemented `env(safe-area-inset-*)` variables for consistent padding across all iPhone models (including Dynamic Island/Home Indicator).
3.  **Home HUD Refinement:** Increased spacing for bottom overlay actions in the 3D City view to prevent overlap with the bottom navigation bar on tall iPhone displays.
4.  **AI Advisor Overhaul:** Refactored the "OPS" view to use a sticky composer and flex-based message list, ensuring the chat input remains reachable above the keyboard and bottom nav.
5.  **Native Interaction:** Added Momentum Scrolling and Scroll-Snap to dashboard tabs for a native iOS feel.
