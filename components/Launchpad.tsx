
import React, { useState } from 'react';
import { Goal, FinancialHealth } from '../types';
import { RocketSilo } from './RocketSilo';

interface LaunchpadProps {
    health: FinancialHealth;
    onUpdateHealth: (h: FinancialHealth) => void;
    goals: Goal[];
    onUpdateGoals: (goals: Goal[]) => void;
}

export const Launchpad: React.FC<LaunchpadProps> = ({ health, onUpdateHealth, goals, onUpdateGoals }) => {
    const [showForm, setShowForm] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [current, setCurrent] = useState('');
    const [date, setDate] = useState('');
    const [tag, setTag] = useState<Goal['valueTag']>('Adventure');

    // Launch Animation State
    const [launchingId, setLaunchingId] = useState<string | null>(null);

    const handleCreate = () => {
        if (!name || !target || !date) return;
        
        const newGoal: Goal = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            targetAmount: parseFloat(target),
            currentAmount: parseFloat(current) || 0,
            deadline: new Date(date).toISOString(),
            category: 'travel', // Default for now
            valueTag: tag
        };

        onUpdateGoals([...goals, newGoal]);
        setShowForm(false);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setTarget('');
        setCurrent('');
        setDate('');
    };

    const handleAddFuel = (goalId: string, amount: number) => {
        const updated = goals.map(g => {
            if (g.id === goalId) {
                return { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + amount) };
            }
            return g;
        });
        onUpdateGoals(updated);
        // Note: In a real app, this would deduct from 'Cash' account in Wallet
    };

    const handleLaunch = (goal: Goal) => {
        if (launchingId) return; // Prevent double launch
        
        // 1. Trigger Animation state
        setLaunchingId(goal.id);

        // 2. Delay actual removal
        setTimeout(() => {
            // Remove Goal
            onUpdateGoals(goals.filter(g => g.id !== goal.id));
            setLaunchingId(null);
            
            // Deduct from Health Savings (Spending the money)
            onUpdateHealth({
                ...health,
                savings: Math.max(0, health.savings - goal.targetAmount),
                willpowerPoints: health.willpowerPoints + 100 // Bonus for successful goal
            });

            alert(`🚀 MISSION SUCCESS: ${goal.name} LAUNCHED! Enjoy the experience.`);
        }, 2000); // 2 second launch sequence
    };

    // Calculation Logic
    const monthlySurplus = health.monthlyIncome - health.monthlyExpenses;
    const isCrisis = monthlySurplus < 0;
    
    const totalWeeklyNeed = goals.reduce((sum, g) => {
        // Rough calc: (Target - Current) / Weeks Left
        const days = Math.max(1, (new Date(g.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        const weeks = days / 7;
        const remaining = g.targetAmount - g.currentAmount;
        return sum + (remaining > 0 ? remaining / weeks : 0);
    }, 0);

    const weeklySurplus = Math.max(0, monthlySurplus / 4);
    const coverage = totalWeeklyNeed > 0 ? (weeklySurplus / totalWeeklyNeed) * 100 : 100;

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                <div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter">THE LAUNCHPAD</h2>
                    <p className="text-slate-400 mt-2 max-w-xl">
                        "Fuel, Don't Build". Money for goals is meant to be spent. 
                        Fill the tanks, launch the mission, and enjoy the memory.
                    </p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="bg-neon-blue text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-cyan-400 shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-transform hover:scale-105"
                >
                    + NEW MISSION
                </button>
            </div>

            {/* REALITY CHECK BANNER */}
            {goals.length > 0 && (
                <div className={`mb-8 p-4 rounded-xl border flex items-center justify-between gap-4 ${coverage >= 100 ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-amber-900/30 border-amber-500/30'}`}>
                    <div>
                        <h4 className={`font-bold ${coverage >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {coverage >= 100 ? "✅ All Systems Go" : "⚠️ Fuel Shortage Detected"}
                        </h4>
                        <p className="text-xs text-slate-300 mt-1">
                            Your city produces <span className="text-white font-bold">${weeklySurplus.toFixed(0)}/wk</span> surplus. 
                            Your goals require <span className="text-white font-bold">${totalWeeklyNeed.toFixed(0)}/wk</span> to launch on time.
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-2xl font-black text-white">{Math.min(100, coverage).toFixed(0)}%</div>
                        <div className="text-xs text-slate-500 uppercase">Realistic Capacity</div>
                    </div>
                </div>
            )}

            {/* NEW GOAL FORM */}
            {showForm && (
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl mb-10 animate-in slide-in-from-top-4">
                    <h3 className="text-white font-bold mb-4">Initialize Mission Protocol</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400">MISSION NAME</label>
                            <input 
                                type="text" 
                                placeholder="Japan 2026" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-neon-blue"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400">TARGET FUEL ($)</label>
                            <input 
                                type="number" 
                                placeholder="5000" 
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-neon-blue"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400">LAUNCH DATE</label>
                            <input 
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-neon-blue"
                            />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-400">VALUE TAG</label>
                             <select 
                                value={tag}
                                onChange={(e) => setTag(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-neon-blue"
                             >
                                 <option value="Adventure">Adventure (Travel/Experiences)</option>
                                 <option value="Comfort">Comfort (Home/Furniture)</option>
                                 <option value="Security">Security (Emergency Fund)</option>
                                 <option value="Status">Status (Car/Watches)</option>
                             </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowForm(false)} className="text-slate-400 font-bold hover:text-white px-4">Cancel</button>
                        <button onClick={handleCreate} className="bg-emerald-500 text-white font-bold px-6 py-2 rounded-lg hover:bg-emerald-400">Create Rocket</button>
                    </div>
                </div>
            )}

            {/* ROCKET GRID */}
            {goals.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
                    <p className="text-4xl mb-4">🚀</p>
                    <p>No missions on the pad.</p>
                    <button onClick={() => setShowForm(true)} className="text-neon-blue hover:underline mt-2">Start a savings goal</button>
                </div>
            ) : (
                <div className="flex flex-wrap gap-8 justify-center md:justify-start">
                    {goals.map(goal => (
                        <div key={goal.id} className={`relative ${launchingId === goal.id ? 'animate-[fly-off_2s_ease-in_forwards]' : ''}`}>
                             <RocketSilo 
                                goal={goal} 
                                onAddFuel={(amt) => handleAddFuel(goal.id, amt)}
                                onLaunch={() => handleLaunch(goal)}
                                isPaused={isCrisis && goal.valueTag === 'Status'}
                             />
                             {/* Exhaust Plume Animation during Launch */}
                             {launchingId === goal.id && (
                                 <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-20 h-40 bg-orange-500 blur-2xl animate-pulse rounded-full opacity-80 z-0"></div>
                             )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
