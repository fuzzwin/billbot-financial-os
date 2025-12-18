
import React, { useState } from 'react';
import { ImpulseItem, FinancialHealth } from '../types';
import { TactileButton } from './ui/TactileButton';
import { RecessedInput } from './ui/RecessedInput';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

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
        const updated = items.map(i => {
            if (i.id === id) {
                const newSaved = Math.min(i.price, i.savedAmount + i.targetWeeklySave);
                if (newSaved >= i.price && i.savedAmount < i.price) {
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
            onUpdateHealth({
                ...health,
                savings: health.savings + decisionItem.price,
                willpowerPoints: (health.willpowerPoints || 0) + 50
            });
            alert(`You kept $${decisionItem.price} cash instead! +50 Willpower Points.`);
        }
        setDecisionItem(null);
    };

    return (
        <div className="max-w-4xl mx-auto pb-24 relative animate-in fade-in slide-in-from-bottom-4">
            
            {/* DECISION MODAL */}
            {decisionItem && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-industrial-base/95 backdrop-blur-sm p-4">
                    <ChassisWell className="max-w-md w-full text-center" label="Module Assembly Complete">
                        <div className="text-5xl mb-6">🏗️ ✅</div>
                        <h2 className="text-2xl font-black text-industrial-text uppercase tracking-tighter mb-2">TARGET REACHED</h2>
                        <p className="text-industrial-subtext text-xs font-medium mb-8 leading-relaxed">
                            Successfully allocated <span className="text-emerald-500 font-bold">${decisionItem.price.toLocaleString()}</span> for {decisionItem.name}.
                            Determine final capital deployment strategy.
                        </p>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <TactileButton 
                                onClick={() => handleDecision(true)}
                                color="white"
                                className="!py-4"
                            >
                                🛍️ Purchase Asset
                            </TactileButton>
                            <TactileButton 
                                onClick={() => handleDecision(false)}
                                color="blue"
                                className="!py-4 shadow-chassis"
                            >
                                💵 Reclaim $${decisionItem.price.toLocaleString()} Cash
                            </TactileButton>
                        </div>
                    </ChassisWell>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6 px-2">
                <div>
                    <h2 className="text-4xl font-black text-industrial-text uppercase tracking-tighter">IMPULSE HANGAR</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <LEDIndicator active={true} color="yellow" />
                      <p className="tactile-label text-industrial-subtext/60">Construction Protocol // Delay Logic Active</p>
                    </div>
                    <p className="text-industrial-subtext text-xs font-medium mt-4 max-w-xl leading-relaxed">
                        Park items. Build savings. Decide later. 
                        By simulating the purchase timeline, you reclaim the dopamine without the capital burn.
                    </p>
                </div>
                <div className="bg-industrial-well-bg p-4 rounded-2xl shadow-well border border-black/5 text-center min-w-[120px]">
                    <p className="text-[9px] text-industrial-blue font-black uppercase tracking-widest mb-1">WILLPOWER</p>
                    <p className="text-2xl font-black text-industrial-text tracking-tighter">{health.willpowerPoints || 0} WP</p>
                </div>
            </div>

            {/* Input Zone */}
            <ChassisWell label="New Module Registry" className="mb-10">
                <div className="flex flex-col lg:flex-row gap-6 items-end">
                    <div className="flex-1 w-full">
                        <RecessedInput 
                            label="Module Identifier"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="e.g. PS5 Pro"
                        />
                    </div>
                    <div className="w-full lg:w-40">
                        <RecessedInput 
                            label="Target Cost ($)"
                            type="number" 
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="w-full lg:w-40">
                        <RecessedInput 
                            label="Weekly Alloc ($)"
                            type="number" 
                            value={weeklySave}
                            onChange={(e) => setWeeklySave(e.target.value)}
                        />
                    </div>
                    <TactileButton 
                        onClick={addItem}
                        color="orange"
                        className="w-full lg:w-auto h-12"
                    >
                        START BUILD
                    </TactileButton>
                </div>
            </ChassisWell>

            {/* Hangar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {items.length === 0 && (
                    <div className="col-span-2 text-center py-24 bg-industrial-well-bg rounded-[3rem] shadow-well border-2 border-dashed border-industrial-border-dark/30">
                        <div className="text-5xl mb-6 opacity-30">🏗️</div>
                        <p className="tactile-label text-industrial-subtext/60">Hangar is clear. Start a deferred purchase module.</p>
                    </div>
                )}
                {items.map(item => {
                    const percent = Math.min(100, (item.savedAmount / item.price) * 100);
                    
                    return (
                        <ChassisWell key={item.id} label="In-Progress Assembly">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-sm font-black text-industrial-text uppercase tracking-tight">{item.name}</h3>
                                    <p className="tactile-label text-industrial-subtext/60 mt-0.5">Registry: ${item.price.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-500 font-black text-xl tracking-tighter">${item.savedAmount.toLocaleString()}</p>
                                    <p className="text-[9px] text-industrial-subtext/40 uppercase font-black">ALLOCATED</p>
                                </div>
                            </div>

                            {/* Construction Visual */}
                            <div className="relative h-28 bg-industrial-well-bg rounded-2xl shadow-well border border-black/5 mb-6 overflow-hidden">
                                {/* Crate filling up */}
                                <div 
                                    className="absolute bottom-0 left-0 w-full bg-industrial-blue/10 border-t border-industrial-blue/30 transition-all duration-1000 ease-in-out"
                                    style={{ height: `${percent}%` }}
                                >
                                    <div className="w-full h-full opacity-5 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[size:10px_10px]"></div>
                                    {/* Liquid surface line */}
                                    <div className="absolute top-0 w-full h-0.5 bg-industrial-blue/40 shadow-[0_0_8px_rgba(0,85,255,0.3)]"></div>
                                </div>
                                
                                {/* Crane Hook */}
                                <div 
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 bg-industrial-subtext/20 transition-all duration-1000"
                                    style={{ height: `${Math.max(10, 100 - percent)}%` }}
                                >
                                    <div className="absolute -bottom-3 -left-2 w-4.5 h-3 border-2 border-industrial-subtext/30 border-t-0 rounded-b-lg"></div>
                                </div>

                                {/* Percentage indicator */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-[40px] font-black text-industrial-text/5 uppercase tracking-tighter">{percent.toFixed(0)}%</span>
                                </div>
                            </div>

                            <TactileButton 
                                onClick={() => processSavingsTick(item.id)}
                                color="white"
                                fullWidth
                                size="sm"
                                className="border border-industrial-border-dark/10"
                            >
                                + ALLOCATE WEEKLY (${item.targetWeeklySave})
                            </TactileButton>
                        </ChassisWell>
                    );
                })}
            </div>
        </div>
    );
};
