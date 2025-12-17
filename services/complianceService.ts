
import { EffectiveLifeItem, HardshipRequest } from '../types';

// Simplified local database of ATO Effective Life Determinations (2025)
export const COMMON_ASSETS: EffectiveLifeItem[] = [
  { asset: "Laptop (Computer)", lifeYears: 2, rate: 0.50 },
  { asset: "Mobile Phone", lifeYears: 3, rate: 0.3333 },
  { asset: "Tablet", lifeYears: 2, rate: 0.50 },
  { asset: "Office Chair", lifeYears: 10, rate: 0.10 },
  { asset: "Desk", lifeYears: 20, rate: 0.05 },
  { asset: "Monitor", lifeYears: 4, rate: 0.25 },
  { asset: "Keyboard/Mouse", lifeYears: 2, rate: 0.50 },
  { asset: "Camera (Digital)", lifeYears: 3, rate: 0.3333 },
  { asset: "Headphones (Noise Cancelling)", lifeYears: 2, rate: 0.50 },
  { asset: "Standing Desk", lifeYears: 20, rate: 0.05 },
];

export const searchEffectiveLife = (query: string): EffectiveLifeItem[] => {
  if (!query) return COMMON_ASSETS;
  const q = query.toLowerCase();
  return COMMON_ASSETS.filter(item => item.asset.toLowerCase().includes(q));
};

export const validateABN = (abn: string): { isValid: boolean; message: string } => {
  // Remove non-digits/spaces
  const cleanAbn = abn.replace(/[^0-9]/g, '');
  
  if (cleanAbn.length !== 11) {
    return { isValid: false, message: "ABN must be 11 digits." };
  }
  
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  
  // Subtract 1 from first digit
  const firstDigit = parseInt(cleanAbn[0]) - 1;
  let sum = firstDigit * weights[0];
  
  for (let i = 1; i < 11; i++) {
    sum += parseInt(cleanAbn[i]) * weights[i];
  }
  
  const isValid = sum % 89 === 0;
  return { 
    isValid, 
    message: isValid ? "Valid ABN (Checksum Passed)" : "Invalid ABN (Checksum Failed - Potential Fraud)" 
  };
};

export const generateHardshipLetter = (req: HardshipRequest): string => {
  const date = new Date().toLocaleDateString('en-AU');
  
  let proposalText = '';
  if (req.type === 'MORATORIUM') {
    proposalText = `A moratorium on payments for ${req.durationMonths} months, allowing me time to stabilize my financial position.`;
  } else {
    proposalText = `Reduced payments of $${req.offerAmount} per month for ${req.durationMonths} months.`;
  }

  return `Date: ${date}

ATTN: Hardship Department
${req.creditorName}

RE: Hardship Variation Request - Account ${req.accountNumber}

Dear Hardship Manager,

I am writing to inform you that I am currently experiencing financial hardship due to ${req.reason}.

I intend to pay my debt, but I cannot meet the current repayment schedule. I am exercising my right under the National Credit Code to request a hardship variation.

Specifically, I propose:
${proposalText}

Please confirm in writing within 14 days that you will freeze interest, fees, and enforcement action while this arrangement is in place.

If I do not receive a response or if this request is unreasonably refused, I reserve the right to refer this matter to the relevant External Dispute Resolution scheme (AFCA/EWON/TIO).

Sincerely,

${req.userName}`;
};
