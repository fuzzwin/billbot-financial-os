
import { FinancialHealth, Transaction, Subscription, AccountItem, ImpulseItem, Goal } from "../types";

const HEALTH_KEY = 'BILLBOT_HEALTH_V1';
const TX_KEY = 'BILLBOT_TRANSACTIONS_V1';
const SUB_KEY = 'BILLBOT_SUBSCRIPTIONS_V1';
const ACC_KEY = 'BILLBOT_ACCOUNTS_V1';
const IMPULSE_KEY = 'BILLBOT_IMPULSE_V1';
const GOALS_KEY = 'BILLBOT_GOALS_V1';

// In a real Native App, this would connect to SQLite (via op-sqlite or GRDB.swift)
// For this Web Prototype, we use LocalStorage to simulate "On-Device" persistence.

export const loadFinancialHealth = (): FinancialHealth | null => {
  try {
    const data = localStorage.getItem(HEALTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to load local health data", e);
    return null;
  }
};

export const saveFinancialHealth = (health: FinancialHealth) => {
  try {
    localStorage.setItem(HEALTH_KEY, JSON.stringify(health));
  } catch (e) {
    console.error("Failed to save local health data", e);
  }
};

export const loadTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(TX_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load local transactions", e);
    return [];
  }
};

export const saveTransactions = (transactions: Transaction[]) => {
  try {
    localStorage.setItem(TX_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error("Failed to save local transactions", e);
  }
};

export const loadSubscriptions = (): Subscription[] => {
  try {
    const data = localStorage.getItem(SUB_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load subscriptions", e);
    return [];
  }
};

export const saveSubscriptions = (subs: Subscription[]) => {
  try {
    localStorage.setItem(SUB_KEY, JSON.stringify(subs));
  } catch (e) {
    console.error("Failed to save subscriptions", e);
  }
};

export const loadAccounts = (): AccountItem[] => {
  try {
    const data = localStorage.getItem(ACC_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load accounts", e);
    return [];
  }
};

export const saveAccounts = (accounts: AccountItem[]) => {
  try {
    localStorage.setItem(ACC_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error("Failed to save accounts", e);
  }
};

export const loadImpulseItems = (): ImpulseItem[] => {
    try {
        const data = localStorage.getItem(IMPULSE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export const saveImpulseItems = (items: ImpulseItem[]) => {
    try {
        localStorage.setItem(IMPULSE_KEY, JSON.stringify(items));
    } catch (e) {
        console.error("Failed save impulse", e);
    }
}

export const loadGoals = (): Goal[] => {
    try {
        const data = localStorage.getItem(GOALS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

export const saveGoals = (goals: Goal[]) => {
    try {
        localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    } catch (e) {
        console.error("Failed save goals", e);
    }
}

export const clearLocalData = () => {
    localStorage.removeItem(HEALTH_KEY);
    localStorage.removeItem(TX_KEY);
    localStorage.removeItem(SUB_KEY);
    localStorage.removeItem(ACC_KEY);
    localStorage.removeItem(IMPULSE_KEY);
    localStorage.removeItem(GOALS_KEY);
}
