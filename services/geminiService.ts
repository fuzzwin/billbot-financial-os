import { GoogleGenAI } from "@google/genai";
import { Transaction, ChatMessage, BillScanResult, Subscription, FinancialHealth } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash";

// The persona is NOT a bank manager. It's a savvy friend.
const SYSTEM_INSTRUCTION = `
You are BillBot, a financial guide for a regular Australian who finds money confusing.
Your goal is to translate complex financial data into simple, actionable advice.
Rules:
1. NEVER use jargon (e.g., don't say "Amortization", say "Paying it off").
2. Be direct. If a purchase is a bad idea, say it.
3. Use the "City" metaphor. Money = Water/Materials. Debt = Pollution/Fire/Smog.
4. Context: User is in Australia (check for AUD, GST, Superannuation, Lazy Tax).
5. If analyzing a bill (Energy/Internet), check if the rate seems high (Lazy Tax).
`;

export const adviseOnPurchase = async (
  health: FinancialHealth, 
  itemCost: number, 
  itemName: string
): Promise<string> => {
  const freeCash = health.monthlyIncome - health.monthlyExpenses;
  const impact = (itemCost / Math.max(1, freeCash)) * 100;

  const prompt = `
    User wants to buy: ${itemName} for $${itemCost}.
    Their disposable income remaining this month: $${freeCash}.
    This item represents ${impact.toFixed(1)}% of their "Fun Money".
    Current Savings: $${health.savings}.
    Current Debt: $${health.hecsDebt + health.otherDebts}.
    
    Give a 1-sentence verdict (Yes/No/Caution) starting with "VERDICT: [Green Light/Yellow Light/Red Light]".
    Then give a 1-sentence reason using the City metaphor (e.g. "This will drain your reservoir" or "The factory will produce more smog").
  `;

  try {
    const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "I can't decide right now.";
  } catch (e) {
      return "Error connecting to advisor.";
  }
}

export const categorizeTransactions = async (rawCsv: string): Promise<Transaction[]> => {
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Parse this CSV/Text data into a JSON array of transactions. 
      Identify if the purchase is likely tax deductible in Australia (Work related).
      
      CSV Data:
      ${rawCsv}
      `,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as Transaction[];
  } catch (error) {
    console.error("Gemini Categorization Error:", error);
    return [];
  }
};

export const detectSubscriptions = async (transactions: Transaction[]): Promise<Subscription[]> => {
    if (transactions.length === 0) return [];
    const simplifiedTx = transactions.map(t => `${t.date}: ${t.merchant} ($${t.amount})`).join('\n');

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `
            Analyze this transaction list. Identify RECURRING payments (Netflix, Gym, Internet, Insurance).
            Return JSON array of Subscription objects.
            Transactions:
            ${simplifiedTx}
            `,
            config: {
                responseMimeType: "application/json",
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });
        
        const text = response.text;
        if (!text) return [];
        return JSON.parse(text) as Subscription[];
    } catch (e) {
        return [];
    }
}

export const scanBillImage = async (base64Image: string, mimeType: string): Promise<BillScanResult | null> => {
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Image
                        }
                    },
                    {
                        text: "Analyze this bill/invoice/fine. Extract Biller, Amount, Due Date. If it's an Energy/Internet bill, check if the rate looks high (Lazy Tax) and mention it in the summary. Return JSON."
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });
        
        const text = response.text;
        if(!text) return null;
        return JSON.parse(text) as BillScanResult;
    } catch (e) {
        console.error("Bill Scan Error", e);
        return null;
    }
}

export const parseEmailContent = async (emailText: string): Promise<BillScanResult | null> => {
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `
      Analyze this text (email/receipt).
      Extract Biller, Amount, Due Date.
      If it looks like a Parking Fine or Speeding Fine, prioritize the due date.
      
      Text:
      "${emailText}"
      `,
      config: {
        responseMimeType: "application/json",
        systemInstruction: SYSTEM_INSTRUCTION
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as BillScanResult;
  } catch (e) {
    return null;
  }
};

export const chatWithAdvisor = async (history: ChatMessage[], context: string): Promise<string> => {
    try {
        let prompt = `Current Financial Health Context: ${context}\n\n`;
        prompt += `Conversation History:\n`;
        history.forEach(msg => {
            prompt += `${msg.role.toUpperCase()}: ${msg.text}\n`;
        });
        prompt += `\nBILLBOT (You):`;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });
        return response.text || "I'm having trouble connecting to the Neural Engine.";
    } catch (e) {
        console.error(e);
        return "Offline mode: Unable to generate response.";
    }
}

export const analyzeHECSvsMortgage = async (
  hecsBalance: number,
  mortgageRate: number,
  availableCash: number
): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `
            Scenario:
            User has $${availableCash} available cash.
            HECS Balance: $${hecsBalance}.
            Mortgage Variable Rate: ${mortgageRate}%.
            Forecasted HECS Indexation: 4.0%.
            
            Task: Provide a strategic recommendation (Pay HECS or Offset). 
            Explain it simply.
            `,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });
        return response.text || "Analysis failed.";
    } catch (e) {
        return "Could not run simulation analysis.";
    }
}
