
import React, { useState } from 'react';
import { Goal, FinancialHealth } from '../types';
import { RocketSilo } from './RocketSilo';
import { TactileButton } from './ui/TactileButton';
import { RecessedInput } from './ui/RecessedInput';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

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
    };

    const handleLaunch = (goal: Goal) => {
        if (launchingId) return; // Prevent double launch
        
        setLaunchingId(goal.id);

        setTimeout(() => {
            onUpdateGoals(goals.filter(g => g.id !== goal.id));
            setLaunchingId(null);
            
            onUpdateHealth({
                ...health,
                savings: Math.max(0, health.savings - goal.targetAmount),
                willpowerPoints: (health.willpowerPoints || 0) + 100 
            });
        }, 2000); 
    };

    // Calculation Logic
    const monthlySurplus = health.monthlyIncome - health.monthlyExpenses;
    const isCrisis = monthlySurplus < 0;
    
    const totalWeeklyNeed = goals.reduce((sum, g) => {
        const days = Math.max(1, (new Date(g.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        const weeks = days / 7;
        const remaining = g.targetAmount - g.currentAmount;
        return sum + (remaining > 0 ? remaining / weeks : 0);
    }, 0);

    const weeklySurplus = Math.max(0, monthlySurplus / 4);
    const coverage = totalWeeklyNeed > 0 ? (weeklySurplus / totalWeeklyNeed) * 100 : 100;

    return (
        <div className="max-w-6xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6 px-2">
                <div>
                    <h2 className="text-4xl font-black text-industrial-text uppercase tracking-tighter">THE LAUNCHPAD</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <LEDIndicator active={true} color="blue" />
                      <p className="tactile-label text-industrial-subtext/60">Module Registry // Rocket Status: Active</p>
                    </div>
                    <p className="text-industrial-subtext text-xs font-medium mt-4 max-w-xl leading-relaxed">
                        "Fuel, Don't Build". Money for goals is meant to be spent. 
                        Fill the tanks, launch the mission, and enjoy the memory.
                    </p>
                </div>
                <TactileButton 
                    onClick={() => setShowForm(!showForm)}
                    color="blue"
                    size="lg"
                    className="!rounded-2xl shadow-chassis"
                >
                    + NEW MISSION
                </TactileButton>
            </div>

            {/* REALITY CHECK BANNER */}
            {goals.length > 0 && (
                <ChassisWell label="Operational Capacity Check" className="mb-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-well ${coverage >= 100 ? 'bg-emerald-500/10' : 'bg-industrial-orange/10'}`}>
                                {coverage >= 100 ? '✅' : '⚠️'}
                            </div>
                            <div>
                                <h4 className={`text-sm font-black uppercase tracking-tight ${coverage >= 100 ? 'text-emerald-500' : 'text-industrial-orange'}`}>
                                    {coverage >= 100 ? "All Systems Go" : "Fuel Shortage Detected"}
                                </h4>
                                <p className="text-xs text-industrial-subtext font-medium mt-1">
                                    City produces <span className="text-industrial-text font-bold">${weeklySurplus.toFixed(0)}/wk</span> surplus. 
                                    Goals require <span className="text-industrial-text font-bold">${totalWeeklyNeed.toFixed(0)}/wk</span>.
                                </p>
                            </div>
                        </div>
                        <div className="text-center bg-industrial-well-bg px-6 py-3 rounded-2xl shadow-well border border-black/5">
                            <div className="text-2xl font-black text-industrial-text tracking-tighter">{Math.min(100, coverage).toFixed(0)}%</div>
                            <div className="text-[9px] text-industrial-subtext/60 uppercase font-black tracking-widest">REALISTIC CAP</div>
                        </div>
                    </div>
                </ChassisWell>
            )}

            {/* NEW GOAL FORM */}
            {showForm && (
                <div className="fixed inset-0 bg-industrial-base/95 backdrop-blur-sm flex items-center justify-center z-[110] p-6">
                    <ChassisWell className="w-full max-w-2xl" label="Initialize Mission Protocol">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <RecessedInput 
                                label="Mission Identifier" 
                                placeholder="e.g. Japan 2026" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <RecessedInput 
                                label="Target Fuel ($)" 
                                type="number" 
                                placeholder="5000" 
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                            />
                            <RecessedInput 
                                label="Launch Date" 
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                            <div className="space-y-1.5">
                                 <label className="tactile-label px-1 text-industrial-subtext/60">Value Tag</label>
                                 <select 
                                    value={tag}
                                    onChange={(e) => setTag(e.target.value as any)}
                                    className="w-full bg-industrial-base rounded-xl px-4 py-3 text-sm font-bold text-industrial-text shadow-well outline-none appearance-none cursor-pointer border border-black/5"
                                 >
                                     <option value="Adventure">Adventure (Travel)</option>
                                     <option value="Comfort">Comfort (Home)</option>
                                     <option value="Security">Security (Safety)</option>
                                     <option value="Status">Status (Luxury)</option>
                                 </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setShowForm(false)} className="tactile-label text-industrial-subtext/60 hover:text-industrial-text px-4">Abort</button>
                            <TactileButton onClick={handleCreate} color="blue">Create Rocket</TactileButton>
                        </div>
                    </ChassisWell>
                </div>
            )}

            {/* ROCKET GRID */}
            {goals.length === 0 ? (
                <div className="text-center py-24 bg-industrial-well-bg rounded-[3rem] shadow-well border-2 border-dashed border-industrial-border-dark/30">
                    <div className="text-5xl mb-6 opacity-30">🚀</div>
                    <p className="tactile-label text-industrial-subtext/60 mb-6">No missions registered on the pad.</p>
                    <TactileButton onClick={() => setShowForm(true)} color="blue" size="md">Start Module Construction</TactileButton>
                </div>
            ) : (
                <div className="flex flex-wrap gap-12 justify-center md:justify-start">
                    {goals.map(goal => (
                        <div key={goal.id} className={`relative ${launchingId === goal.id ? 'animate-[fly-off_2s_ease-in_forwards]' : ''}`}>
                             <RocketSilo 
                                goal={goal} 
                                onAddFuel={(amt) => handleAddFuel(goal.id, amt)}
                                onLaunch={() => handleLaunch(goal)}
                                isPaused={isCrisis && goal.valueTag === 'Status'}
                             />
                             {launchingId === goal.id && (
                                 <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-20 h-40 bg-industrial-orange/30 blur-2xl animate-pulse rounded-full z-0"></div>
                             )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
