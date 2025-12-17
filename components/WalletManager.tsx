
import React, { useState, useEffect } from 'react';
import { AccountItem, AccountType, FinancialHealth } from '../types';

interface WalletManagerProps {
  accounts: AccountItem[];
  onUpdateAccounts: (accounts: AccountItem[]) => void;
  health: FinancialHealth;
  onUpdateHealth: (health: FinancialHealth) => void;
}

export const WalletManager: React.FC<WalletManagerProps> = ({ 
    accounts, 
    onUpdateAccounts,
    health,
    onUpdateHealth
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<AccountItem | null>(null);
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<AccountType>('SAVINGS');
  const [newBalance, setNewBalance] = useState('');
  const [newRate, setNewRate] = useState('');

  // Income State
  const [income, setIncome] = useState(health.monthlyIncome.toString());
  const [salary, setSalary] = useState(health.annualSalary.toString());

  // Debt Calc State
  const [calcMode, setCalcMode] = useState<'BY_DATE' | 'BY_BUDGET'>('BY_DATE');
  const [targetMonths, setTargetMonths] = useState('12');
  const [monthlyBudget, setMonthlyBudget] = useState('500');

  const handleSaveAccount = () => {
      if (!newName || !newBalance) return;
      
      if (editingId) {
          // Update existing account
          const updatedAccounts = accounts.map(acc => {
              if (acc.id === editingId) {
                  return {
                      ...acc,
                      name: newName,
                      type: newType,
                      balance: parseFloat(newBalance),
                      interestRate: newRate ? parseFloat(newRate) : undefined
                  };
              }
              return acc;
          });
          onUpdateAccounts(updatedAccounts);
      } else {
          // Create new account
          const newItem: AccountItem = {
              id: Math.random().toString(36).substr(2, 9),
              name: newName,
              type: newType,
              balance: parseFloat(newBalance),
              interestRate: newRate ? parseFloat(newRate) : undefined
          };
          onUpdateAccounts([...accounts, newItem]);
      }
      resetForm();
  };

  const startEditing = (acc: AccountItem) => {
      setEditingId(acc.id);
      setNewName(acc.name);
      setNewType(acc.type);
      setNewBalance(acc.balance.toString());
      setNewRate(acc.interestRate ? acc.interestRate.toString() : '');
      setShowAdd(true);
  };

  const removeAccount = (id: string) => {
      onUpdateAccounts(accounts.filter(a => a.id !== id));
      if (selectedDebt?.id === id) setSelectedDebt(null);
  };

  const resetForm = () => {
      setNewName('');
      setNewBalance('');
      setNewRate('');
      setEditingId(null);
      setShowAdd(false);
  };

  const handleIncomeUpdate = () => {
      onUpdateHealth({
          ...health,
          monthlyIncome: parseFloat(income) || 0,
          annualSalary: parseFloat(salary) || 0
      });
      alert("Income updated!");
  };

  // Group accounts for display
  const assets = accounts.filter(a => ['CASH', 'SAVINGS', 'INVESTMENT', 'SUPER'].includes(a.type));
  const liabilities = accounts.filter(a => ['LOAN', 'CREDIT_CARD', 'HECS'].includes(a.type));

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  // Debt Calculator Logic
  const calculateDebtStrategy = () => {
      if (!selectedDebt) return null;
      const balance = selectedDebt.balance;
      const rate = (selectedDebt.interestRate || 0) / 100 / 12; // Monthly rate
      
      if (calcMode === 'BY_DATE') {
          // PMT Formula: P = (r*PV) / (1 - (1+r)^-n)
          const months = parseFloat(targetMonths) || 12;
          if (rate === 0) return { payment: balance / months, totalInterest: 0, time: months };
          
          const payment = (rate * balance) / (1 - Math.pow(1 + rate, -months));
          const totalPay = payment * months;
          return { payment, totalInterest: totalPay - balance, time: months };
      } else {
          // NPER Formula (approx)
          const payment = parseFloat(monthlyBudget) || 100;
          if (payment <= balance * rate) return null; // Never payoff
          
          let n = Math.log(payment / (payment - balance * rate)) / Math.log(1 + rate);
          return { payment, totalInterest: (payment * n) - balance, time: n };
      }
  };

  const debtResult = calculateDebtStrategy();

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20">
      
      <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-white italic tracking-tighter">MY WALLET</h2>
          <p className="text-slate-400 mt-2">Manage all your banks, debts, and loans in one place.</p>
      </div>

      {/* Net Worth Hero */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-2xl border border-slate-700 shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Net Worth</p>
              <p className={`text-5xl font-mono font-bold ${netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${netWorth.toLocaleString()}
              </p>
          </div>
          <div className="flex gap-8 text-center">
              <div>
                  <p className="text-slate-500 text-xs uppercase">Assets</p>
                  <p className="text-emerald-500 font-bold text-xl">+${totalAssets.toLocaleString()}</p>
              </div>
              <div className="w-px bg-slate-700 h-10"></div>
              <div>
                  <p className="text-slate-500 text-xs uppercase">Liabilities</p>
                  <p className="text-rose-500 font-bold text-xl">-${totalLiabilities.toLocaleString()}</p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ASSETS COLUMN */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden h-fit">
              <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-emerald-400 flex items-center gap-2">
                      <span>💰</span> WHAT I HAVE (Assets)
                  </h3>
              </div>
              <div className="p-4 space-y-3">
                  {assets.map(acc => (
                      <div key={acc.id} className="bg-slate-800 p-4 rounded-lg flex justify-between items-center border border-slate-700">
                          <div>
                              <p className="font-bold text-white">{acc.name}</p>
                              <p className="text-xs text-slate-400 uppercase">{acc.type}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-emerald-400 font-mono font-bold">${acc.balance.toLocaleString()}</p>
                              <div className="flex gap-2 justify-end mt-1">
                                <button onClick={() => startEditing(acc)} className="text-xs text-slate-500 hover:text-white">Edit</button>
                                <button onClick={() => removeAccount(acc.id)} className="text-xs text-slate-600 hover:text-red-400">Remove</button>
                              </div>
                          </div>
                      </div>
                  ))}
                  <button onClick={() => { setShowAdd(true); setEditingId(null); setNewType('SAVINGS'); }} className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:border-emerald-500 hover:text-emerald-500 transition-colors font-bold">
                      + Add Bank / Asset
                  </button>
              </div>
          </div>

          {/* LIABILITIES COLUMN */}
          <div className="space-y-6">
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-rose-400 flex items-center gap-2">
                          <span>📉</span> WHAT I OWE (Debts)
                      </h3>
                  </div>
                  <div className="p-4 space-y-3">
                      {liabilities.map(acc => (
                          <div 
                            key={acc.id} 
                            onClick={() => setSelectedDebt(acc)}
                            className={`bg-slate-800 p-4 rounded-lg flex justify-between items-center border cursor-pointer transition-all ${selectedDebt?.id === acc.id ? 'border-neon-blue ring-1 ring-neon-blue' : 'border-slate-700 hover:border-slate-500'}`}
                          >
                              <div>
                                  <p className="font-bold text-white">{acc.name}</p>
                                  <div className="flex gap-2">
                                    <span className="text-xs text-slate-400 uppercase">{acc.type}</span>
                                    {acc.interestRate && <span className="text-xs text-rose-300 bg-rose-900/30 px-1 rounded">{acc.interestRate}% APR</span>}
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-rose-400 font-mono font-bold">${acc.balance.toLocaleString()}</p>
                                  <span className="text-[10px] text-neon-blue uppercase font-bold">Tap to Plan</span>
                                  <div className="flex gap-2 justify-end mt-1" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={(e) => { e.stopPropagation(); startEditing(acc); }} className="text-xs text-slate-500 hover:text-white">Edit</button>
                                    <button onClick={(e) => { e.stopPropagation(); removeAccount(acc.id); }} className="text-xs text-slate-600 hover:text-red-400">Remove</button>
                                  </div>
                              </div>
                          </div>
                      ))}
                      <button onClick={() => { setShowAdd(true); setEditingId(null); setNewType('CREDIT_CARD'); }} className="w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-500 hover:border-rose-500 hover:text-rose-500 transition-colors font-bold">
                          + Add Loan / Debt
                      </button>
                  </div>
              </div>
              
              {/* DEBT CRUSHER CALCULATOR */}
              {selectedDebt && (
                  <div className="bg-slate-900 border border-neon-blue/50 rounded-xl p-6 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full blur-3xl"></div>
                      
                      <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-black text-white italic">DEBT CRUSHER</h3>
                            <p className="text-slate-400 text-sm">Strategy for: <span className="text-white font-bold">{selectedDebt.name}</span></p>
                          </div>
                          <button onClick={() => setSelectedDebt(null)} className="text-slate-500 hover:text-white">✕</button>
                      </div>

                      <div className="flex gap-2 mb-4 bg-slate-950 p-1 rounded-lg">
                          <button 
                            onClick={() => setCalcMode('BY_DATE')}
                            className={`flex-1 py-2 text-xs font-bold rounded ${calcMode === 'BY_DATE' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}
                          >
                              Target Date
                          </button>
                          <button 
                            onClick={() => setCalcMode('BY_BUDGET')}
                            className={`flex-1 py-2 text-xs font-bold rounded ${calcMode === 'BY_BUDGET' ? 'bg-slate-800 text-white shadow' : 'text-slate-500'}`}
                          >
                              Monthly Budget
                          </button>
                      </div>

                      <div className="mb-6">
                          {calcMode === 'BY_DATE' ? (
                              <div>
                                  <label className="text-xs font-bold text-slate-500">I WANT TO BE DEBT FREE IN (MONTHS)</label>
                                  <input 
                                    type="number" 
                                    value={targetMonths}
                                    onChange={(e) => setTargetMonths(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white outline-none focus:border-neon-blue mt-1"
                                  />
                              </div>
                          ) : (
                              <div>
                                  <label className="text-xs font-bold text-slate-500">I CAN AFFORD TO PAY ($/MONTH)</label>
                                  <input 
                                    type="number" 
                                    value={monthlyBudget}
                                    onChange={(e) => setMonthlyBudget(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white outline-none focus:border-neon-blue mt-1"
                                  />
                              </div>
                          )}
                      </div>

                      {debtResult ? (
                          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                               <div className="grid grid-cols-2 gap-4 text-center">
                                   <div>
                                       <p className="text-xs text-slate-500 uppercase">{calcMode === 'BY_DATE' ? 'Monthly Payment' : 'Months to Freedom'}</p>
                                       <p className="text-2xl font-bold text-emerald-400">
                                           {calcMode === 'BY_DATE' 
                                            ? `$${debtResult.payment.toFixed(2)}` 
                                            : `${debtResult.time.toFixed(1)} mo`}
                                       </p>
                                   </div>
                                   <div>
                                       <p className="text-xs text-slate-500 uppercase">Total Interest</p>
                                       <p className="text-xl font-bold text-rose-400">${debtResult.totalInterest.toFixed(2)}</p>
                                   </div>
                               </div>
                               <div className="mt-3 pt-3 border-t border-slate-800 text-center">
                                   <p className="text-xs text-slate-400">
                                       Payoff Date: <span className="text-white font-bold">{new Date(new Date().setMonth(new Date().getMonth() + debtResult.time)).toLocaleDateString()}</span>
                                   </p>
                               </div>
                          </div>
                      ) : (
                          <div className="text-center text-rose-400 text-sm font-bold">
                              Payments too low to cover interest!
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>

      {/* INCOME SETTINGS */}
      <div className="mt-8 bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="font-bold text-white mb-4">Income Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Annual Salary (Pre-Tax)</label>
                  <input type="number" value={salary} onChange={e => setSalary(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Monthly Income (Post-Tax)</label>
                  <input type="number" value={income} onChange={e => setIncome(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>
          </div>
          <button onClick={handleIncomeUpdate} className="mt-4 bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700 font-bold text-sm">Update Income</button>
      </div>

      {/* ADD/EDIT MODAL */}
      {showAdd && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-xl font-bold text-white mb-4">{editingId ? 'Edit Account' : 'Add Account'}</h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">Type</label>
                          <select 
                            value={newType} 
                            onChange={(e) => setNewType(e.target.value as AccountType)}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none"
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
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-neon-blue"
                          />
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">Current Balance</label>
                          <input 
                            type="number" 
                            placeholder="0.00" 
                            value={newBalance}
                            onChange={(e) => setNewBalance(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-neon-blue"
                          />
                      </div>

                      {['LOAN', 'CREDIT_CARD'].includes(newType) && (
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Interest Rate (%)</label>
                            <input 
                                type="number" 
                                placeholder="e.g. 18.5" 
                                value={newRate}
                                onChange={(e) => setNewRate(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-neon-blue"
                            />
                          </div>
                      )}
                  </div>

                  <div className="flex gap-3 mt-6">
                      <button onClick={resetForm} className="flex-1 py-3 text-slate-400 hover:text-white font-bold">Cancel</button>
                      <button onClick={handleSaveAccount} className="flex-1 bg-neon-blue text-slate-900 font-bold py-3 rounded-xl hover:bg-cyan-400">
                        {editingId ? 'Update Item' : 'Save Item'}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
