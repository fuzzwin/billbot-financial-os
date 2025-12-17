
import React, { useState } from 'react';
import { categorizeTransactions, scanBillImage, parseEmailContent } from '../services/geminiService';
import { Transaction, BillScanResult } from '../types';

interface DataIngestionProps {
  onDataLoaded: (transactions: Transaction[]) => void;
}

export const DataIngestion: React.FC<DataIngestionProps> = ({ onDataLoaded }) => {
  const [activeTab, setActiveTab] = useState<'DUMP_ZONE' | 'CSV'>('DUMP_ZONE');
  const [processing, setProcessing] = useState(false);
  const [billResult, setBillResult] = useState<BillScanResult | null>(null);
  const [dumpText, setDumpText] = useState('');

  const handleDumpProcessing = async () => {
    if (!dumpText.trim()) return;
    setProcessing(true);
    // Try to parse as email/text first
    const result = await parseEmailContent(dumpText);
    if (result) {
        setBillResult(result);
    } else {
        alert("Couldn't find a bill in that text. Try pasting a cleaner summary.");
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
                const transactions = await categorizeTransactions(text);
                onDataLoaded(transactions);
                setProcessing(false);
                alert(`Boom! ${transactions.length} transactions added to your City.`);
             };
             reader.readAsText(file);
        } else {
            // Image/PDF
             reader.onload = async (event) => {
                const base64Raw = event.target?.result as string;
                const base64Data = base64Raw.split(',')[1];
                const result = await scanBillImage(base64Data, file.type);
                setBillResult(result);
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
    <div className="max-w-2xl mx-auto mt-6">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-white italic tracking-tighter transform -rotate-1">THE SHOEBOX</h2>
        <p className="text-slate-400 mt-2">Don't organize. Just dump your stuff here.</p>
      </div>

      <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl p-8 relative overflow-hidden group hover:border-neon-blue transition-colors">
          
          {/* Background Icon */}
          <div className="absolute -right-10 -bottom-10 text-9xl opacity-5 group-hover:opacity-10 transition-opacity">📦</div>

          {!billResult ? (
              <div className="space-y-6 relative z-10">
                  
                  {/* File Upload Zone */}
                  <div className="text-center">
                      <label className="cursor-pointer block">
                          <span className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-8 rounded-xl border border-slate-600 transition-all inline-block shadow-lg">
                             {processing ? '🤖 AI IS READING...' : '📸 UPLOAD PHOTO / FILE'}
                          </span>
                          <input type="file" accept="image/*,.pdf,.csv" className="hidden" onChange={handleFileUpload} disabled={processing} />
                      </label>
                      <p className="text-xs text-slate-500 mt-2">Supports: Bank CSVs, Photos of Bills, PDF Invoices</p>
                  </div>

                  <div className="flex items-center gap-4">
                      <div className="h-px bg-slate-800 flex-1"></div>
                      <span className="text-slate-600 font-bold text-xs">OR PASTE TEXT</span>
                      <div className="h-px bg-slate-800 flex-1"></div>
                  </div>

                  {/* Text Dump Zone */}
                  <div className="relative">
                      <textarea 
                        value={dumpText}
                        onChange={(e) => setDumpText(e.target.value)}
                        placeholder="Paste an email from Netflix, a text from your landlord, or a messy list of expenses..."
                        className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 text-sm focus:border-neon-blue outline-none resize-none"
                      ></textarea>
                      {dumpText && (
                          <button 
                            onClick={handleDumpProcessing}
                            disabled={processing}
                            className="absolute bottom-4 right-4 bg-neon-blue text-slate-900 font-bold px-4 py-2 rounded-lg text-xs hover:bg-cyan-400"
                          >
                              {processing ? 'THINKING...' : 'PROCESS'}
                          </button>
                      )}
                  </div>
              </div>
          ) : (
              // Result Confirmation
              <div className="animate-in zoom-in-95">
                  <div className="text-center mb-6">
                      <div className="text-4xl mb-2">🧾</div>
                      <h3 className="text-xl font-bold text-white">I found a bill!</h3>
                      <p className="text-slate-400 text-sm">Does this look right?</p>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 mb-6">
                      <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Merchant</span>
                          <span className="text-white font-bold">{billResult.biller}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Amount</span>
                          <span className="text-white font-mono font-bold text-lg">${billResult.amount}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Due Date</span>
                          <span className="text-white font-bold">{billResult.dueDate}</span>
                      </div>
                      <div className="border-t border-slate-700 pt-2 mt-2">
                          <p className="text-xs text-slate-300 italic">"{billResult.summary}"</p>
                      </div>
                  </div>

                  <div className="flex gap-3">
                      <button 
                        onClick={() => { setBillResult(null); setDumpText(''); }}
                        className="flex-1 py-3 text-slate-400 font-bold hover:text-white"
                      >
                          Discard
                      </button>
                      <button 
                        onClick={confirmBill}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
                      >
                          Yes, Add to City
                      </button>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};
