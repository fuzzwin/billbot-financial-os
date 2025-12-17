
import React, { useState } from 'react';

export const SideQuests: React.FC = () => {
    // MOCK WEATHER for demo purposes (In real app, fetch from BOM API)
    const [weather] = useState({ temp: 28, condition: 'Sunny' });
    
    // 52 Week Challenge Logic (Current week simulation)
    // TypeScript doesn't have getWeek on Date by default, mocking logic:
    const mockWeek = Math.ceil((new Date().getDate() + new Date().getMonth() * 30) / 7);
    const amountToSave = 52 - mockWeek + 1; // Reverse 52 week challenge

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4">
             <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-white italic tracking-tighter">SIDE QUESTS</h2>
                <p className="text-slate-400 mt-2">Gamified challenges to level up your wealth.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* QUEST 1: WEATHER CHALLENGE */}
                <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden group hover:border-neon-blue transition-colors">
                    <div className="h-32 bg-sky-500/20 relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-sky-500/10 animate-pulse"></div>
                        <div className="text-6xl z-10">☀️</div>
                        <div className="absolute bottom-2 right-4 text-sky-300 font-bold text-xl">{weather.temp}°C</div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2">Weather Station</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            It's a hot one! The "Weather Challenge" suggests matching the temperature in savings.
                        </p>
                        <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <span className="text-slate-300 font-bold">Today's Target</span>
                            <span className="text-neon-blue font-mono font-bold text-2xl">${weather.temp}.00</span>
                        </div>
                        <button className="w-full mt-4 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl transition-colors">
                            Complete Transfer
                        </button>
                    </div>
                </div>

                {/* QUEST 2: 52-WEEK REVERSE */}
                <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden group hover:border-emerald-500 transition-colors">
                    <div className="h-32 bg-emerald-500/20 relative flex items-center justify-center overflow-hidden">
                         <div className="text-6xl z-10">📅</div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2">The Reverse 52-Week</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Save big early, easy later. We are in Week {mockWeek}.
                        </p>
                        <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <span className="text-slate-300 font-bold">Week {mockWeek} Goal</span>
                            <span className="text-emerald-400 font-mono font-bold text-2xl">${amountToSave}.00</span>
                        </div>
                        <button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors">
                            Stash ${amountToSave}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
