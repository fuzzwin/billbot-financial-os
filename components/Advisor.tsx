import React, { useState, useRef, useEffect } from 'react';
import { FinancialHealth, ChatMessage, EffectiveLifeItem } from '../types';
import { chatWithAdvisor } from '../services/geminiService';
import { searchEffectiveLife, validateABN } from '../services/complianceService';
import { TactileButton } from './ui/TactileButton';
import { RecessedInput } from './ui/RecessedInput';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

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
        <ChassisWell label="ATO Life Assets" className="h-full">
            <p className="tactile-label opacity-50 mb-6">Ref: TR 2024/3 // 2025 DETERMINATIONS</p>
            <RecessedInput 
                placeholder="Search identifier (e.g. Laptop)"
                className="mb-6"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
            />
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {results.map((item, idx) => (
                    <div key={idx} className="bg-industrial-base p-3 rounded-xl shadow-tactile-sm border border-white/10">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-black text-industrial-text uppercase tracking-tighter">{item.asset}</span>
                            <span className="text-industrial-blue font-black text-xs">{item.lifeYears}Y</span>
                        </div>
                        <div className="tactile-label opacity-50">Rate: {(item.rate * 100).toFixed(1)}% PC</div>
                    </div>
                ))}
            </div>
        </ChassisWell>
    )
  };

  const AbnCheckerTool = () => {
      const checkAbn = () => {
          setAbnResult(validateABN(abnInput));
      }
      return (
        <ChassisWell label="ABN VALIDATOR">
            <p className="tactile-label opacity-50 mb-6">Integrity Check // Mod 11 Algorithm</p>
            <RecessedInput 
                placeholder="ABN (11 DIGITS)"
                className="mb-4"
                value={abnInput}
                onChange={(e) => setAbnInput(e.target.value)}
            />
            <TactileButton 
                onClick={checkAbn}
                color="blue"
                fullWidth
                className="mb-6"
            >
                Verify Entity
            </TactileButton>
            {abnResult && (
                <div className={`p-4 rounded-2xl shadow-well border ${abnResult.isValid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-industrial-orange/10 border-industrial-orange/20 text-industrial-orange'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <LEDIndicator active={true} color={abnResult.isValid ? 'green' : 'red'} />
                        <p className="text-[10px] font-black uppercase tracking-tighter">{abnResult.isValid ? 'Valid Checksum' : 'Invalid Checksum'}</p>
                    </div>
                    <p className="text-[11px] font-medium opacity-80 leading-tight">{abnResult.message}</p>
                </div>
            )}
        </ChassisWell>
      );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-in fade-in zoom-in-95 duration-500 pb-20">
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-industrial-base rounded-[2rem] shadow-chassis border-t border-l border-white/10 overflow-hidden">
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-industrial-base">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-0.5">
                    <LEDIndicator active={true} color="green" />
                    <h2 className="text-sm font-black text-industrial-text uppercase tracking-widest">Neural Advisor</h2>
                </div>
                <p className="tactile-label opacity-50 ml-4">System Operational // Link: Active</p>
            </div>
            <div className="bg-industrial-base px-3 py-1 rounded-lg shadow-well text-[9px] font-black text-industrial-subtext/60 uppercase border-t border-l border-white/5">AUD // COMPLIANT</div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-2xl shadow-tactile-sm text-sm font-medium leading-relaxed border-t border-l ${
                        msg.role === 'user' 
                        ? 'bg-industrial-blue text-white border-white/20 rounded-tr-none' 
                        : 'bg-industrial-base text-industrial-text border-white/10 rounded-tl-none'
                    }`}>
                        {msg.text.split('\n').map((line, idx) => <p key={idx} className="mb-2 last:mb-0">{line}</p>)}
                        <div className={`text-[8px] font-black uppercase tracking-widest mt-2 ${msg.role === 'user' ? 'text-white/40' : 'text-industrial-subtext/40'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-industrial-base text-industrial-subtext/40 p-5 rounded-2xl rounded-tl-none shadow-tactile-sm border-t border-l border-white/10 flex items-center gap-3">
                         <div className="w-2 h-2 bg-industrial-subtext/20 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-industrial-subtext/20 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                         <div className="w-2 h-2 bg-industrial-subtext/20 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-industrial-base border-t border-black/5">
            <div className="flex gap-4 bg-industrial-base p-2 rounded-2xl shadow-well border-t border-l border-black/5">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Input command (e.g. Optimize tax flow)"
                    className="flex-1 bg-transparent px-4 py-3 text-sm font-bold text-industrial-text placeholder-industrial-subtext/40 outline-none"
                />
                <TactileButton 
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    color="orange"
                    size="md"
                >
                    Exec
                </TactileButton>
            </div>
        </div>
      </div>

      {/* Tools Sidebar */}
      <div className="w-80 hidden lg:flex flex-col gap-6">
            <div className="bg-industrial-base p-2 rounded-2xl shadow-well border-t border-l border-black/5 flex gap-2">
                <button 
                    onClick={() => setActiveTool('EFFECTIVE_LIFE')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all ${activeTool === 'EFFECTIVE_LIFE' ? 'bg-industrial-base shadow-tactile-sm text-industrial-blue' : 'text-industrial-subtext hover:text-industrial-text'}`}
                >
                    Asset Life
                </button>
                <button 
                    onClick={() => setActiveTool('ABN_CHECKER')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all ${activeTool === 'ABN_CHECKER' ? 'bg-industrial-base shadow-tactile-sm text-industrial-blue' : 'text-industrial-subtext hover:text-industrial-text'}`}
                >
                    Entity Auth
                </button>
            </div>

            <div className="flex-1">
                {activeTool === 'NONE' && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-industrial-base border-2 border-dashed border-black/5 rounded-[2rem]">
                        <div className="w-16 h-16 bg-industrial-base rounded-2xl flex items-center justify-center text-4xl shadow-well border-t border-l border-black/5 mb-6 opacity-40">🛠️</div>
                        <p className="tactile-label opacity-40 leading-relaxed">Select a compliance module to assist with operational diagnostics.</p>
                    </div>
                )}
                {activeTool === 'EFFECTIVE_LIFE' && <EffectiveLifeTool />}
                {activeTool === 'ABN_CHECKER' && <AbnCheckerTool />}
            </div>
      </div>
    </div>
  );
};
