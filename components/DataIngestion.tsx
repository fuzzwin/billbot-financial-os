
import React, { useState } from 'react';
import { categorizeTransactions, scanBillImage, parseEmailContent } from '../services/geminiService';
import { Transaction, BillScanResult } from '../types';
import { TactileButton } from './ui/TactileButton';
import { RecessedInput } from './ui/RecessedInput';
import { ChassisWell } from './ui/ChassisWell';
import { LEDIndicator } from './ui/LEDIndicator';

interface DataIngestionProps {
  onDataLoaded: (transactions: Transaction[]) => void;
}

export const DataIngestion: React.FC<DataIngestionProps> = ({ onDataLoaded }) => {
  const [processing, setProcessing] = useState(false);
  const [billResult, setBillResult] = useState<BillScanResult | null>(null);
  const [dumpText, setDumpText] = useState('');

  const handleDumpProcessing = async () => {
    if (!dumpText.trim()) return;
    setProcessing(true);
    try {
        const result = await parseEmailContent(dumpText);
        if (result) {
            setBillResult(result);
        } else {
            alert("Couldn't find a bill in that text. Try pasting a cleaner summary.");
        }
    } catch (e) {
        console.error(e);
    }
    setProcessing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setProcessing(true);
        const reader = new FileReader();
        
        if (file.type && file.type.includes('csv')) {
             reader.onload = async (event) => {
                const text = event.target?.result as string;
                try {
                    const transactions = await categorizeTransactions(text);
                    onDataLoaded(transactions);
                    alert(`Registry Updated: ${transactions.length} records processed.`);
                } catch (e) {
                    console.error(e);
                }
                setProcessing(false);
             };
             reader.readAsText(file);
        } else {
            // Image/PDF
             reader.onload = async (event) => {
                const base64Raw = event.target?.result as string;
                const base64Data = base64Raw.split(',')[1];
                try {
                    const result = await scanBillImage(base64Data, file.type);
                    setBillResult(result);
                } catch (e) {
                    console.error(e);
                }
                setProcessing(false);
            };
            reader.readAsDataURL(file);
        }
    }
  };

  const confirmBill = () => {
      if (!billResult) return;
      const newTransaction: Transaction = {
          id: Math.random().toString(36).substr(2, 9),
          date: billResult.dueDate || new Date().toISOString().split('T')[0],
          merchant: billResult.biller,
          amount: billResult.amount,
          category: 'Bill',
          isDeductible: billResult.isTaxDeductible,
          gstIncluded: true
      };
      onDataLoaded([newTransaction]);
      setBillResult(null);
      setDumpText('');
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-24 px-2">
      
      <div className="mb-8">
          <h2 className="text-3xl font-black text-industrial-text uppercase tracking-tighter italic transform -rotate-1">The Shoebox</h2>
          <div className="flex items-center gap-2 mt-1">
            <LEDIndicator active={true} color="blue" />
            <p className="tactile-label text-industrial-subtext/60">V1.2 // INGESTION_MOD</p>
          </div>
      </div>

      <ChassisWell label="Data Input Zone">
          {!billResult ? (
              <div className="space-y-8">
                  
                  {/* File Upload Zone */}
                  <div className="text-center">
                      <label className="cursor-pointer block">
                          <div className={`
                            bg-industrial-base rounded-2xl p-10 border-2 border-dashed border-industrial-border-dark/50 hover:border-industrial-orange transition-all duration-300 group
                            ${processing ? 'animate-pulse' : ''}
                          `}>
                              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📸</div>
                              <p className="text-sm font-black text-industrial-text uppercase tracking-tighter mb-1">
                                {processing ? 'AI READING...' : 'UPLOAD PHOTO / PDF / CSV'}
                              </p>
                              <p className="text-[10px] font-bold text-industrial-subtext/60 uppercase tracking-widest">Max 10MB per unit</p>
                          </div>
                          <input type="file" accept="image/*,.pdf,.csv" className="hidden" onChange={handleFileUpload} disabled={processing} />
                      </label>
                  </div>

                  <div className="flex items-center gap-4">
                      <div className="h-px bg-industrial-well-shadow-light/50 shadow-well flex-1"></div>
                      <span className="tactile-label opacity-40">OR SERIAL DUMP</span>
                      <div className="h-px bg-industrial-well-shadow-light/50 shadow-well flex-1"></div>
                  </div>

                  {/* Text Dump Zone */}
                  <div className="space-y-4">
                      <div className="bg-industrial-well-bg rounded-xl p-4 shadow-well border-t border-l border-black/5 min-h-[160px] flex flex-col">
                          <textarea 
                            value={dumpText}
                            onChange={(e) => setDumpText(e.target.value)}
                            placeholder="Paste email content, SMS notices, or raw expense logs here..."
                            className="flex-1 bg-transparent text-sm font-bold text-industrial-text placeholder-industrial-subtext/30 outline-none resize-none"
                          ></textarea>
                          
                          <div className="flex justify-end mt-4 pt-4 border-t border-black/5">
                            <TactileButton 
                                onClick={handleDumpProcessing}
                                disabled={processing || !dumpText.trim()}
                                color="orange"
                                size="sm"
                            >
                                {processing ? 'Parsing...' : 'Process Data'}
                            </TactileButton>
                          </div>
                      </div>
                  </div>
              </div>
          ) : (
              // Result Confirmation
              <div className="animate-in zoom-in-95 space-y-8">
                  <div className="text-center">
                      <div className="text-5xl mb-4 filter drop-shadow-sm">🧾</div>
                      <h3 className="text-lg font-black text-industrial-text uppercase tracking-tighter">Unit Detected</h3>
                      <p className="tactile-label opacity-50">Verify parameters before registry entry</p>
                  </div>

                  <div className="bg-industrial-well-bg p-6 rounded-2xl shadow-well border-t border-l border-black/5 space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-black/5">
                          <span className="tactile-label opacity-40">Origin</span>
                          <span className="text-sm font-black text-industrial-text uppercase tracking-tight">{billResult.biller}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-black/5">
                          <span className="tactile-label opacity-40">Value (AUD)</span>
                          <span className="text-xl font-black text-industrial-orange tracking-tighter">${billResult.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="tactile-label opacity-40">Due Date</span>
                          <span className="text-sm font-black text-industrial-text uppercase tracking-tight">{billResult.dueDate}</span>
                      </div>
                      <div className="mt-6 p-4 bg-industrial-base/30 rounded-xl border border-black/5">
                          <p className="text-[11px] font-medium text-industrial-subtext italic leading-relaxed">"{billResult.summary}"</p>
                      </div>
                  </div>

                  <div className="flex gap-4">
                      <button 
                        onClick={() => { setBillResult(null); setDumpText(''); }}
                        className="flex-1 tactile-label text-industrial-subtext/40 hover:text-industrial-text transition-colors"
                      >
                          Discard Record
                      </button>
                      <TactileButton 
                        onClick={confirmBill}
                        color="blue"
                        className="flex-1"
                      >
                          Commit to Registry
                      </TactileButton>
                  </div>
              </div>
          )}
      </ChassisWell>

      <div className="mt-12 px-2">
          <p className="text-[10px] font-black text-industrial-subtext/30 uppercase tracking-[0.2em] leading-relaxed">
            Note: All data processing is executed via local neural analysis. BillBot does not transmit raw financial data outside the operational sandbox.
          </p>
      </div>
    </div>
  );
};
