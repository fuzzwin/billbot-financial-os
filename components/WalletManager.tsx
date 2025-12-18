
import React, { useState, useEffect } from 'react';
import { AccountItem, AccountType, FinancialHealth } from '../types';
import { TactileButton } from './ui/TactileButton';
import { RecessedInput } from './ui/RecessedInput';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

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
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-24">
      
      <div className="mb-8 px-2">
          <h2 className="text-3xl font-black text-industrial-text uppercase tracking-tighter">Asset & Liability Registry</h2>
          <div className="flex items-center gap-2 mt-1">
            <LEDIndicator active={true} color="blue" />
            <p className="tactile-label text-industrial-subtext/60">System V2.5 // Wallet Module</p>
          </div>
      </div>

      {/* Net Worth Hero */}
      <ChassisWell className="mb-8" label="Core Financial Balance">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
                <p className="tactile-label text-industrial-subtext/60 mb-1">Total Equity</p>
                <p className={`text-5xl font-black tracking-tighter ${netWorth >= 0 ? 'text-emerald-500' : 'text-industrial-orange'}`}>
                    ${netWorth.toLocaleString()}
                </p>
            </div>
            <div className="flex gap-10">
                <div className="flex flex-col items-center">
                    <p className="tactile-label text-industrial-subtext/60 mb-1">Assets (+)</p>
                    <p className="text-emerald-500 font-black text-xl tracking-tight">${totalAssets.toLocaleString()}</p>
                </div>
                <div className="w-px bg-industrial-well-shadow-light/50 h-10 shadow-well"></div>
                <div className="flex flex-col items-center">
                    <p className="tactile-label text-industrial-subtext/60 mb-1">Liabilities (-)</p>
                    <p className="text-industrial-orange font-black text-xl tracking-tight">${totalLiabilities.toLocaleString()}</p>
                </div>
            </div>
          </div>
      </ChassisWell>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ASSETS COLUMN */}
          <ChassisWell label="Operational Assets">
              <div className="space-y-4">
                  {assets.map(acc => (
                      <div key={acc.id} className="bg-industrial-base p-4 rounded-xl flex justify-between items-center shadow-tactile-sm border-t border-l border-white/10">
                          <div>
                              <p className="text-sm font-black text-industrial-text uppercase tracking-tight">{acc.name}</p>
                              <p className="tactile-label text-industrial-subtext/60">{acc.type}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-emerald-500 font-black tracking-tighter">${acc.balance.toLocaleString()}</p>
                              <div className="flex gap-2 justify-end mt-1">
                                <button onClick={() => startEditing(acc)} className="tactile-label text-industrial-subtext/40 hover:text-industrial-blue transition-colors">Edit</button>
                                <button onClick={() => removeAccount(acc.id)} className="tactile-label text-industrial-subtext/40 hover:text-industrial-orange transition-colors">Delete</button>
                              </div>
                          </div>
                      </div>
                  ))}
                  <TactileButton 
                    onClick={() => { setShowAdd(true); setEditingId(null); setNewType('SAVINGS'); }}
                    fullWidth
                    color="blue"
                    className="mt-2"
                  >
                    + Add Asset Module
                  </TactileButton>
              </div>
          </ChassisWell>

          {/* LIABILITIES COLUMN */}
          <div className="space-y-6">
              <ChassisWell label="Debt Obligations">
                  <div className="space-y-4">
                      {liabilities.map(acc => (
                          <div 
                            key={acc.id} 
                            onClick={() => setSelectedDebt(acc)}
                            className={`bg-industrial-base p-4 rounded-xl flex justify-between items-center cursor-pointer transition-all border-t border-l ${selectedDebt?.id === acc.id ? 'shadow-tactile-pressed translate-y-[1px] border-industrial-blue/50' : 'shadow-tactile-sm border-white/10 hover:shadow-md'}`}
                          >
                              <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <LEDIndicator active={selectedDebt?.id === acc.id} color="blue" />
                                    <p className="text-sm font-black text-industrial-text uppercase tracking-tight">{acc.name}</p>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <span className="tactile-label text-industrial-subtext/60">{acc.type}</span>
                                    {acc.interestRate && <span className="tactile-label text-industrial-orange">{acc.interestRate}% APR</span>}
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="text-industrial-orange font-black tracking-tighter">${acc.balance.toLocaleString()}</p>
                                  <div className="flex gap-2 justify-end mt-1" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={(e) => { e.stopPropagation(); startEditing(acc); }} className="tactile-label text-industrial-subtext/40 hover:text-industrial-blue transition-colors">Edit</button>
                                    <button onClick={(e) => { e.stopPropagation(); removeAccount(acc.id); }} className="tactile-label text-industrial-subtext/40 hover:text-industrial-orange transition-colors">Delete</button>
                                  </div>
                              </div>
                          </div>
                      ))}
                      <TactileButton 
                        onClick={() => { setShowAdd(true); setEditingId(null); setNewType('CREDIT_CARD'); }}
                        fullWidth
                        color="orange"
                        className="mt-2"
                      >
                        + Add Debt Module
                      </TactileButton>
                  </div>
              </ChassisWell>
              
              {/* DEBT CRUSHER CALCULATOR */}
              {selectedDebt && (
                  <div className="bg-industrial-dark-base rounded-[2rem] p-8 shadow-2xl animate-in fade-in slide-in-from-top-4 relative border border-white/5">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                                <LEDIndicator active={true} color="blue" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Debt Projection</h3>
                            </div>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-tight">Focus: {selectedDebt.name}</p>
                          </div>
                          <button onClick={() => setSelectedDebt(null)} className="text-white/20 hover:text-white transition-colors">✕</button>
                      </div>

                      <div className="flex gap-2 mb-6 bg-industrial-well-bg p-1.5 rounded-xl shadow-well border-t border-l border-white/5">
                          <button 
                            onClick={() => setCalcMode('BY_DATE')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${calcMode === 'BY_DATE' ? 'bg-industrial-base/10 text-white shadow-md' : 'text-white/40'}`}
                          >
                              Target Date
                          </button>
                          <button 
                            onClick={() => setCalcMode('BY_BUDGET')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${calcMode === 'BY_BUDGET' ? 'bg-industrial-base/10 text-white shadow-md' : 'text-white/40'}`}
                          >
                              Monthly Budget
                          </button>
                      </div>

                      <div className="mb-8">
                          {calcMode === 'BY_DATE' ? (
                              <div className="space-y-2">
                                  <label className="tactile-label text-white/40">Repayment Period (Months)</label>
                                  <input 
                                    type="number" 
                                    value={targetMonths}
                                    onChange={(e) => setTargetMonths(e.target.value)}
                                    className="w-full bg-industrial-well-bg rounded-xl p-4 text-industrial-text font-black tracking-tight outline-none focus:ring-1 focus:ring-industrial-blue/50 shadow-well border-t border-l border-white/5"
                                  />
                              </div>
                          ) : (
                              <div className="space-y-2">
                                  <label className="tactile-label text-white/40">Monthly Allocation ($)</label>
                                  <input 
                                    type="number" 
                                    value={monthlyBudget}
                                    onChange={(e) => setMonthlyBudget(e.target.value)}
                                    className="w-full bg-industrial-well-bg rounded-xl p-4 text-industrial-text font-black tracking-tight outline-none focus:ring-1 focus:ring-industrial-blue/50 shadow-well border-t border-l border-white/5"
                                  />
                              </div>
                          )}
                      </div>

                      {debtResult ? (
                          <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                               <div className="grid grid-cols-2 gap-8 text-center">
                                   <div>
                                       <p className="tactile-label text-white/40 mb-2">{calcMode === 'BY_DATE' ? 'Required Payment' : 'Estimated Time'}</p>
                                       <p className="text-2xl font-black text-emerald-500 tracking-tighter">
                                           {calcMode === 'BY_DATE' 
                                            ? `$${debtResult.payment.toFixed(0)}` 
                                            : `${debtResult.time.toFixed(1)} mo`}
                                       </p>
                                   </div>
                                   <div>
                                       <p className="tactile-label text-white/40 mb-2">Projected Interest</p>
                                       <p className="text-xl font-black text-industrial-orange tracking-tighter">${debtResult.totalInterest.toFixed(0)}</p>
                                   </div>
                               </div>
                               <div className="mt-6 pt-6 border-t border-white/5 text-center">
                                   <p className="tactile-label text-white/40">
                                       Clearance Date: <span className="text-white">{new Date(new Date().setMonth(new Date().getMonth() + debtResult.time)).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                                   </p>
                               </div>
                          </div>
                      ) : (
                          <div className="text-center p-4 bg-industrial-orange/10 border border-industrial-orange/20 rounded-xl">
                              <p className="tactile-label text-industrial-orange">Warning: Insufficient Cash Flow</p>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>

      {/* INCOME SETTINGS */}
      <ChassisWell label="Revenue Flow Configuration" className="mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <RecessedInput 
                label="Annual Gross Salary (AUD)" 
                type="number" 
                value={salary} 
                onChange={e => setSalary(e.target.value)} 
              />
              <RecessedInput 
                label="Monthly Net Income (AUD)" 
                type="number" 
                value={income} 
                onChange={e => setIncome(e.target.value)} 
              />
          </div>
          <TactileButton onClick={handleIncomeUpdate} color="blue" className="mt-8">
            Commit Changes
          </TactileButton>
      </ChassisWell>

      {/* ADD/EDIT MODAL */}
      {showAdd && (
          <div className="fixed inset-0 bg-industrial-base/95 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
              <ChassisWell className="w-full max-w-md" label={editingId ? 'Module Modification' : 'New Module Registry'}>
                  <div className="space-y-6">
                      <div className="space-y-1.5">
                          <label className="tactile-label px-1 text-industrial-subtext/60">Module Classification</label>
                          <select 
                            value={newType} 
                            onChange={(e) => setNewType(e.target.value as AccountType)}
                            className="w-full bg-industrial-base rounded-xl px-4 py-3 text-sm font-bold text-industrial-text shadow-well outline-none appearance-none cursor-pointer border-t border-l border-white/5"
                          >
                              <option value="SAVINGS">Savings Vault</option>
                              <option value="CASH">Liquid Asset / Cash</option>
                              <option value="INVESTMENT">Investment Portfolio</option>
                              <option value="SUPER">Superannuation</option>
                              <option value="CREDIT_CARD">Credit Liability</option>
                              <option value="LOAN">Fixed Loan / Debt</option>
                              <option value="HECS">HECS / HELP Registry</option>
                          </select>
                      </div>

                      <RecessedInput 
                        label="Module Identifier" 
                        placeholder="e.g. CBA Transaction" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />

                      <RecessedInput 
                        label="Current Balance ($)" 
                        type="number" 
                        placeholder="0.00" 
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                      />

                      {['LOAN', 'CREDIT_CARD'].includes(newType) && (
                          <RecessedInput 
                            label="Interest Rate (%)" 
                            type="number" 
                            placeholder="e.g. 18.5" 
                            value={newRate}
                            onChange={(e) => setNewRate(e.target.value)}
                          />
                      )}
                  </div>

                  <div className="flex gap-4 mt-10">
                      <button onClick={resetForm} className="flex-1 tactile-label text-industrial-subtext/40 hover:text-industrial-text transition-colors">Cancel</button>
                      <TactileButton onClick={handleSaveAccount} color="orange" className="flex-1">
                        {editingId ? 'Sync' : 'Initialize'}
                      </TactileButton>
                  </div>
              </ChassisWell>
          </div>
      )}

    </div>
  );
};
