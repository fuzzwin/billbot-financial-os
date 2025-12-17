import React, { useState, useRef, useEffect } from 'react';
import { FinancialHealth, ChatMessage, EffectiveLifeItem } from '../types';
import { chatWithAdvisor } from '../services/geminiService';
import { searchEffectiveLife, validateABN } from '../services/complianceService';

interface AdvisorProps {
  health: FinancialHealth;
}

export const Advisor: React.FC<AdvisorProps> = ({ health }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hello! I'm BillBot, your local financial operating system. How can I help you optimize your wealth today?", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tools State
  const [activeTool, setActiveTool] = useState<'NONE' | 'EFFECTIVE_LIFE' | 'ABN_CHECKER'>('NONE');
  const [assetSearch, setAssetSearch] = useState('');
  const [abnInput, setAbnInput] = useState('');
  const [abnResult, setAbnResult] = useState<{isValid: boolean, message: string} | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const context = JSON.stringify(health);
    const responseText = await chatWithAdvisor([...messages, userMsg], context);

    const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Tool Components
  const EffectiveLifeTool = () => {
    const results = searchEffectiveLife(assetSearch);
    return (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-full flex flex-col">
            <h3 className="text-neon-blue font-bold mb-2">ATO Effective Life Lookup</h3>
            <p className="text-xs text-slate-400 mb-4">Official 2025 Determinations for Depreciation.</p>
            <input 
                type="text"
                placeholder="Search asset (e.g. Laptop)"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mb-4 focus:border-neon-blue outline-none"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
            />
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {results.map((item, idx) => (
                    <div key={idx} className="bg-slate-900/50 p-2 rounded border border-slate-700/50 text-sm">
                        <div className="flex justify-between font-bold text-slate-200">
                            <span>{item.asset}</span>
                            <span className="text-emerald-400">{item.lifeYears} Years</span>
                        </div>
                        <div className="text-xs text-slate-500">Prime Cost Rate: {(item.rate * 100).toFixed(2)}%</div>
                    </div>
                ))}
            </div>
        </div>
    )
  };

  const AbnCheckerTool = () => {
      const checkAbn = () => {
          setAbnResult(validateABN(abnInput));
      }
      return (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-fit">
            <h3 className="text-neon-blue font-bold mb-2">Fraud Prevention (ABN)</h3>
            <p className="text-xs text-slate-400 mb-4">Validate Australian Business Numbers checksum.</p>
            <input 
                type="text"
                placeholder="Enter ABN (11 digits)"
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white mb-2 focus:border-neon-blue outline-none"
                value={abnInput}
                onChange={(e) => setAbnInput(e.target.value)}
            />
            <button 
                onClick={checkAbn}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded transition-colors mb-4"
            >
                Validate
            </button>
            {abnResult && (
                <div className={`p-3 rounded border ${abnResult.isValid ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' : 'bg-red-900/20 border-red-500/50 text-red-400'}`}>
                    <p className="text-sm font-bold">{abnResult.isValid ? '✓ Valid Entity' : '⚠ Invalid ABN'}</p>
                    <p className="text-xs opacity-80">{abnResult.message}</p>
                </div>
            )}
        </div>
      );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
                Advisor Neural Core
            </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                        msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    }`}>
                        {msg.text.split('\n').map((line, idx) => <p key={idx} className="mb-1">{line}</p>)}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-slate-800 text-slate-400 p-4 rounded-2xl rounded-bl-none border border-slate-700 flex items-center gap-2">
                         <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                         <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask about taxes, HECS, or savings strategies..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none transition-all"
                />
                <button 
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="bg-neon-blue text-slate-950 font-bold px-6 py-3 rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    SEND
                </button>
            </div>
        </div>
      </div>

      {/* Tools Sidebar */}
      <div className="w-80 hidden lg:flex flex-col gap-4">
            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800 flex gap-2">
                <button 
                    onClick={() => setActiveTool('EFFECTIVE_LIFE')}
                    className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${activeTool === 'EFFECTIVE_LIFE' ? 'bg-slate-700 text-neon-blue' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    EFFECTIVE LIFE
                </button>
                <button 
                    onClick={() => setActiveTool('ABN_CHECKER')}
                    className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${activeTool === 'ABN_CHECKER' ? 'bg-slate-700 text-neon-blue' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    ABN CHECKER
                </button>
            </div>

            <div className="flex-1">
                {activeTool === 'NONE' && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                        <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <p className="text-sm">Select a compliance tool to assist your financial planning.</p>
                    </div>
                )}
                {activeTool === 'EFFECTIVE_LIFE' && <EffectiveLifeTool />}
                {activeTool === 'ABN_CHECKER' && <AbnCheckerTool />}
            </div>
      </div>
    </div>
  );
};
