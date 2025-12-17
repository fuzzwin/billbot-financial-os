
import React, { useState } from 'react';
import { ImpulseItem, FinancialHealth } from '../types';

interface ImpulseHangarProps {
    health: FinancialHealth;
    onUpdateHealth: (h: FinancialHealth) => void;
    items: ImpulseItem[];
    onUpdateItems: (items: ImpulseItem[]) => void;
}

export const ImpulseHangar: React.FC<ImpulseHangarProps> = ({ health, onUpdateHealth, items, onUpdateItems }) => {
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [weeklySave, setWeeklySave] = useState('20');
    
    // Modal for final decision
    const [decisionItem, setDecisionItem] = useState<ImpulseItem | null>(null);

    const addItem = () => {
        if (!newItemName || !newItemPrice) return;
        const newItem: ImpulseItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: newItemName,
            price: parseFloat(newItemPrice),
            dateAdded: new Date().toISOString(),
            savedAmount: 0,
            targetWeeklySave: parseFloat(weeklySave)
        };
        const updated = [...items, newItem];
        onUpdateItems(updated);
        setNewItemName('');
        setNewItemPrice('');
    };

    const processSavingsTick = (id: string) => {
        // Simulate a week passing (for demo purposes, user clicks to add progress)
        const updated = items.map(i => {
            if (i.id === id) {
                const newSaved = Math.min(i.price, i.savedAmount + i.targetWeeklySave);
                if (newSaved >= i.price && i.savedAmount < i.price) {
                    // Just hit goal
                    setDecisionItem({ ...i, savedAmount: newSaved });
                }
                return { ...i, savedAmount: newSaved };
            }
            return i;
        });
        onUpdateItems(updated);
    };

    const handleDecision = (takeItem: boolean) => {
        if (!decisionItem) return;
        
        const updated = items.filter(i => i.id !== decisionItem.id);
        onUpdateItems(updated);
        
        if (takeItem) {
            alert(`Enjoy your new ${decisionItem.name}!`);
        } else {
            // Keep Cash
            onUpdateHealth({
                ...health,
                savings: health.savings + decisionItem.price,
                willpowerPoints: health.willpowerPoints + 50
            });
            alert(`You kept $${decisionItem.price} cash instead! +50 Willpower Points.`);
        }
        setDecisionItem(null);
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 relative">
            
            {/* DECISION MODAL */}
            {decisionItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur p-4">
                    <div className="bg-slate-900 border border-neon-blue rounded-2xl p-8 max-w-md w-full text-center animate-in zoom-in-95">
                        <div className="text-6xl mb-4">🏗️ ✅</div>
                        <h2 className="text-3xl font-black text-white italic">GOAL REACHED!</h2>
                        <p className="text-slate-300 my-4">
                            You have successfully saved <span className="text-emerald-400 font-bold">${decisionItem.price}</span> for the {decisionItem.name}.
                        </p>
                        <p className="text-white font-bold text-lg mb-8">What do you want to do?</p>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <button 
                                onClick={() => handleDecision(true)}
                                className="bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold"
                            >
                                🛍️ Buy the Item
                            </button>
                            <button 
                                onClick={() => handleDecision(false)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                            >
                                💵 Keep the $${decisionItem.price} Cash
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-black text-white italic">IMPULSE HANGAR</h2>
                    <p className="text-slate-400">Park items. Build savings. Decide later.</p>
                </div>
                <div className="bg-slate-900 border border-indigo-500 rounded-xl p-4 text-center">
                    <p className="text-xs text-indigo-400 font-bold uppercase">Willpower Points</p>
                    <p className="text-2xl font-black text-white">{health.willpowerPoints || 0} WP</p>
                </div>
            </div>

            {/* Input Zone */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 mb-8 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-slate-400">ITEM NAME</label>
                    <input 
                        type="text" 
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="e.g. PS5 Pro"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-neon-blue"
                    />
                </div>
                <div className="w-full md:w-32">
                    <label className="text-xs font-bold text-slate-400">PRICE</label>
                    <input 
                        type="number" 
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="$0"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-neon-blue"
                    />
                </div>
                <div className="w-full md:w-32">
                    <label className="text-xs font-bold text-slate-400">WEEKLY SAVE</label>
                    <input 
                        type="number" 
                        value={weeklySave}
                        onChange={(e) => setWeeklySave(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-neon-blue"
                    />
                </div>
                <button 
                    onClick={addItem}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors whitespace-nowrap"
                >
                    START BUILD
                </button>
            </div>

            {/* Hangar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.length === 0 && (
                    <div className="col-span-2 text-center py-20 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
                        Hangar is empty. Start a savings project.
                    </div>
                )}
                {items.map(item => {
                    const percent = Math.min(100, (item.savedAmount / item.price) * 100);
                    
                    return (
                        <div key={item.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden group">
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{item.name}</h3>
                                    <p className="text-slate-400 font-mono text-sm">Goal: ${item.price}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-400 font-black text-2xl">${item.savedAmount}</p>
                                    <p className="text-xs text-slate-500">Saved so far</p>
                                </div>
                            </div>

                            {/* Construction Visual */}
                            <div className="relative h-24 bg-slate-900 rounded-lg border border-slate-700 mb-4 overflow-hidden">
                                {/* Crate filling up */}
                                <div 
                                    className="absolute bottom-0 left-0 w-full bg-indigo-600/50 border-t-2 border-indigo-400 transition-all duration-500"
                                    style={{ height: `${percent}%` }}
                                >
                                    <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[size:10px_10px]"></div>
                                </div>
                                {/* Crane Hook */}
                                <div 
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-1 bg-slate-500 transition-all duration-500"
                                    style={{ height: `${100 - percent}%` }}
                                >
                                    <div className="absolute -bottom-2 -left-2 w-5 h-2 border-2 border-slate-500 rounded-b-lg"></div>
                                </div>
                            </div>

                            <button 
                                onClick={() => processSavingsTick(item.id)}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg text-sm transition-colors z-10 relative"
                            >
                                + Add Weekly Contribution (${item.targetWeeklySave})
                            </button>

                        </div>
                    );
                })}
            </div>
        </div>
    );
};
