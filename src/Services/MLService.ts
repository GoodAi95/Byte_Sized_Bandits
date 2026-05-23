// MLService.ts
// Simulated ML Service - In production, this calls the Python FastAPI microservice
// Simulates XGBoost+LightGBM stacking ensemble and Naive Bayes

import type { FinancialProfile, ShapFactor, FraudScanResult } from '../Models';
import { generateId } from '../Models';

// ─── Credit Score Prediction (Simulates XGBoost+LightGBM Stacking) ─────────

interface PredictionResult {
  predictedScore: number;
  baseScore: number;
  factors: ShapFactor[];
}

// Feature weight simulation based on real credit scoring models
const FEATURE_WEIGHTS: Record<string, { weight: number; optimal: number; label: string }> = {
  creditUtilization: { weight: -1.8, optimal: 30, label: 'Credit Utilization' },
  missedPayments: { weight: -35, optimal: 0, label: 'Missed Payments' },
  totalDebt: { weight: -0.0008, optimal: 5000, label: 'Total Debt' },
  totalSavings: { weight: 0.0012, optimal: 50000, label: 'Total Savings' },
  monthlyIncome: { weight: 0.0006, optimal: 80000, label: 'Monthly Income' },
  numberOfCreditCards: { weight: -5, optimal: 2, label: 'Number of Credit Cards' },
  numberOfLoans: { weight: -12, optimal: 0, label: 'Active Loans' },
  ageOfCreditHistory: { weight: 4.5, optimal: 15, label: 'Credit History Age' },
  gambling: { weight: -40, optimal: 0, label: 'Gambling Activity' },
  hasInvestments: { weight: 15, optimal: 1, label: 'Investment Portfolio' },
  hasMortgage: { weight: 5, optimal: 1, label: 'Mortgage (shows stability)' },
};

function getAdvice(feature: string, direction: 'positive' | 'negative', value: number): string {
  const adviceMap: Record<string, Record<string, string>> = {
    creditUtilization: {
      positive: 'Great job keeping your credit utilization low! This significantly helps your score.',
      negative: `Your credit utilization is at ${value}%. Try to keep it below 30% for optimal score impact.`,
    },
    missedPayments: {
      positive: 'Perfect payment history! Keep paying all bills on time.',
      negative: `You have ${value} missed payment(s). Set up debit orders to avoid future misses.`,
    },
    totalDebt: {
      positive: 'Your debt levels are well-managed. Keep it up!',
      negative: 'Consider a debt snowball or avalanche strategy to reduce your debt faster.',
    },
    totalSavings: {
      positive: 'Strong savings buffer! This shows financial stability.',
      negative: 'Try to build an emergency fund of 3-6 months of expenses.',
    },
    monthlyIncome: {
      positive: 'Your income level supports your credit profile well.',
      negative: 'Consider additional income streams to improve your debt-to-income ratio.',
    },
    numberOfCreditCards: {
      positive: 'Good number of credit accounts shows responsible credit management.',
      negative: 'Too many credit cards can lower your score. Avoid opening new accounts.',
    },
    numberOfLoans: {
      positive: 'Low number of active loans is favorable for your score.',
      negative: 'Multiple active loans increase risk. Focus on paying off the smallest ones first.',
    },
    ageOfCreditHistory: {
      positive: 'Long credit history is one of your strongest assets!',
      negative: 'Your credit history is relatively short. Keep accounts open and active.',
    },
    gambling: {
      positive: 'No gambling activity is a positive factor for lenders.',
      negative: 'Gambling activity is a red flag for lenders. Consider reducing or eliminating it.',
    },
    hasInvestments: {
      positive: 'Having investments shows financial planning and stability.',
      negative: 'Consider starting to invest, even small amounts, to build long-term wealth.',
    },
    hasMortgage: {
      positive: 'A mortgage demonstrates financial stability and commitment.',
      negative: 'While not having a mortgage isn\'t negative, it\'s a type of credit that can help your mix.',
    },
  };
  return adviceMap[feature]?.[direction] || 'Continue monitoring this aspect of your finances.';
}

export function predictCreditScore(profile: FinancialProfile): PredictionResult {
  const baseScore = 580;
  let adjustment = 0;
  const factors: ShapFactor[] = [];

  // Credit Utilization (0-100%)
  const utilImpact = (profile.creditUtilization - 30) * FEATURE_WEIGHTS.creditUtilization.weight;
  adjustment += utilImpact;
  factors.push({
    feature: 'Credit Utilization',
    impactPoints: Math.round(utilImpact * 100) / 100,
    yourValue: profile.creditUtilization,
    direction: utilImpact >= 0 ? 'positive' : 'negative',
    advice: getAdvice('creditUtilization', utilImpact >= 0 ? 'positive' : 'negative', profile.creditUtilization),
  });

  // Missed Payments
  const missedImpact = profile.missedPayments * FEATURE_WEIGHTS.missedPayments.weight;
  adjustment += missedImpact;
  factors.push({
    feature: 'Payment History',
    impactPoints: Math.round(missedImpact * 100) / 100,
    yourValue: profile.missedPayments,
    direction: missedImpact >= 0 ? 'positive' : 'negative',
    advice: getAdvice('missedPayments', missedImpact >= 0 ? 'positive' : 'negative', profile.missedPayments),
  });

  // Total Debt
  const debtImpact = (profile.totalDebt - 15000) * FEATURE_WEIGHTS.totalDebt.weight;
  adjustment += debtImpact;
  factors.push({
    feature: 'Total Debt',
    impactPoints: Math.round(debtImpact * 100) / 100,
    yourValue: profile.totalDebt,
    direction: debtImpact >= 0 ? 'positive' : 'negative',
    advice: getAdvice('totalDebt', debtImpact >= 0 ? 'positive' : 'negative', profile.totalDebt),
  });

  // Savings
  const savingsImpact = (profile.totalSavings - 10000) * FEATURE_WEIGHTS.totalSavings.weight;
  adjustment += savingsImpact;
  factors.push({
    feature: 'Total Savings',
    impactPoints: Math.round(savingsImpact * 100) / 100,
    yourValue: profile.totalSavings,
    direction: savingsImpact >= 0 ? 'positive' : 'negative',
    advice: getAdvice('totalSavings', savingsImpact >= 0 ? 'positive' : 'negative', profile.totalSavings),
  });

  // Income
  const incomeImpact = (profile.monthlyIncome - 5000) * FEATURE_WEIGHTS.monthlyIncome.weight;
  adjustment += incomeImpact;
  factors.push({
    feature: 'Monthly Income',
    impactPoints: Math.round(incomeImpact * 100) / 100,
    yourValue: profile.monthlyIncome,
    direction: incomeImpact >= 0 ? 'positive' : 'negative',
    advice: getAdvice('monthlyIncome', incomeImpact >= 0 ? 'positive' : 'negative', profile.monthlyIncome),
  });

  // Credit Cards
  const cardImpact = (profile.numberOfCreditCards - 3) * FEATURE_WEIGHTS.numberOfCreditCards.weight;
  adjustment += cardImpact;
  factors.push({
    feature: 'Credit Cards',
    impactPoints: Math.round(cardImpact * 100) / 100,
    yourValue: profile.numberOfCreditCards,
    direction: cardImpact >= 0 ? 'positive' : 'negative',
    advice: getAdvice('numberOfCreditCards', cardImpact >= 0 ? 'positive' : 'negative', profile.numberOfCreditCards),
  });

  // Loans
  const loanImpact = profile.numberOfLoans * FEATURE_WEIGHTS.numberOfLoans.weight;
  adjustment += loanImpact;
  factors.push({
    feature: 'Active Loans',
    impactPoints: Math.round(loanImpact * 100) / 100,
    yourValue: profile.numberOfLoans,
    direction: loanImpact >= 0 ? 'positive' : 'negative',
    advice: getAdvice('numberOfLoans', loanImpact >= 0 ? 'positive' : 'negative', profile.numberOfLoans),
  });

  // Age of Credit History
  const ageImpact = (profile.ageOfCreditHistory - 5) * FEATURE_WEIGHTS.ageOfCreditHistory.weight;
  adjustment += ageImpact;
  factors.push({
    feature: 'Credit History Length',
    impactPoints: Math.round(ageImpact * 100) / 100,
    yourValue: profile.ageOfCreditHistory,
    direction: ageImpact >= 0 ? 'positive' : 'negative',
    advice: getAdvice('ageOfCreditHistory', ageImpact >= 0 ? 'positive' : 'negative', profile.ageOfCreditHistory),
  });

  // Gambling
  const gamblingValue = profile.gambling === 'No' ? 0 : profile.gambling === 'Low' ? 1 : 2;
  const gamblingImpact = gamblingValue * FEATURE_WEIGHTS.gambling.weight;
  adjustment += gamblingImpact;
  factors.push({
    feature: 'Gambling Activity',
    impactPoints: Math.round(gamblingImpact * 100) / 100,
    yourValue: gamblingValue,
    direction: gamblingImpact >= 0 ? 'positive' : 'negative',
    advice: getAdvice('gambling', gamblingImpact >= 0 ? 'positive' : 'negative', gamblingValue),
  });

  // Investments
  const investImpact = profile.hasInvestments ? FEATURE_WEIGHTS.hasInvestments.weight : -FEATURE_WEIGHTS.hasInvestments.weight;
  adjustment += investImpact;
  factors.push({
    feature: 'Investments',
    impactPoints: Math.round(investImpact * 100) / 100,
    yourValue: profile.hasInvestments ? 1 : 0,
    direction: investImpact >= 0 ? 'positive' : 'negative',
    advice: getAdvice('hasInvestments', investImpact >= 0 ? 'positive' : 'negative', profile.hasInvestments ? 1 : 0),
  });

  const rawScore = baseScore + adjustment;
  const predictedScore = Math.max(300, Math.min(850, Math.round(rawScore)));

  factors.sort((a, b) => Math.abs(b.impactPoints) - Math.abs(a.impactPoints));

  return {
    predictedScore,
    baseScore,
    factors,
  };
}

// Simulate what happens if user takes an action
export function simulateAction(
  profile: FinancialProfile,
  action: string,
  customAmount?: number,
  customPercentage?: number
): { newScore: number; change: number; explanation: string } {
  const modifiedProfile = { ...profile };

  switch (action) {
    // ─── Debt Management ────────────────────────────────────────────────
    case 'pay_debt_custom': {
      const amount = customAmount || 500;
      modifiedProfile.totalDebt = Math.max(0, profile.totalDebt - amount);
      // Adjust credit utilization proportionally
      const utilReduction = profile.totalDebt > 0 
        ? (amount / profile.totalDebt) * profile.creditUtilization 
        : 0;
      modifiedProfile.creditUtilization = Math.max(0, profile.creditUtilization - utilReduction);
      break;
    }
    case 'pay_debt_500':
      modifiedProfile.totalDebt = Math.max(0, profile.totalDebt - 500);
      modifiedProfile.creditUtilization = Math.max(0, profile.creditUtilization - 3);
      break;
    case 'pay_debt_1000':
      modifiedProfile.totalDebt = Math.max(0, profile.totalDebt - 1000);
      modifiedProfile.creditUtilization = Math.max(0, profile.creditUtilization - 5);
      break;

    // ─── Savings Management ─────────────────────────────────────────────
    case 'increase_savings_custom': {
      const amount = customAmount || 500;
      modifiedProfile.totalSavings += amount;
      break;
    }
    case 'increase_savings_500':
      modifiedProfile.totalSavings += 500;
      break;

    // ─── Credit Utilization Management ──────────────────────────────────
    case 'reduce_utilization_custom': {
      const percentage = customPercentage || 10;
      modifiedProfile.creditUtilization = Math.max(0, profile.creditUtilization - percentage);
      break;
    }
    case 'reduce_utilization':
      modifiedProfile.creditUtilization = Math.max(0, profile.creditUtilization - 10);
      break;

    // ─── Income Management ──────────────────────────────────────────────
    case 'increase_income_custom': {
      const amount = customAmount || 2000;
      modifiedProfile.monthlyIncome += amount;
      break;
    }
    case 'increase_income_5k':
      modifiedProfile.monthlyIncome += 5000;
      break;

    // ─── Monthly Rent Adjustment ────────────────────────────────────────
    case 'adjust_rent_custom': {
      const amount = customAmount || 0;
      modifiedProfile.monthlyRent = Math.max(0, profile.monthlyRent + amount);
      break;
    }

    // ─── Payment History (Hard Inquiry / Account Aging) ─────────────────
    case 'miss_payment_single':
      modifiedProfile.missedPayments = Math.min(profile.missedPayments + 1, 6);
      break;
    case 'miss_payment_multiple': {
      const count = customAmount || 2;
      modifiedProfile.missedPayments = Math.min(profile.missedPayments + count, 6);
      break;
    }
    case 'cure_missed_payments': {
      const count = customAmount || 1;
      modifiedProfile.missedPayments = Math.max(0, profile.missedPayments - count);
      break;
    }

    // ─── Credit Card Management ────────────────────────────────────────
    case 'new_credit_card':
      modifiedProfile.numberOfCreditCards += 1;
      modifiedProfile.ageOfCreditHistory = Math.max(0, profile.ageOfCreditHistory - 0.5);
      break;
    case 'new_credit_card_custom': {
      const count = customAmount || 1;
      modifiedProfile.numberOfCreditCards += count;
      // Each hard inquiry reduces age slightly
      modifiedProfile.ageOfCreditHistory = Math.max(0, profile.ageOfCreditHistory - (count * 0.3));
      break;
    }

    // ─── Loan Management ────────────────────────────────────────────────
    case 'new_loan':
      modifiedProfile.numberOfLoans += 1;
      modifiedProfile.totalDebt += 5000;
      break;
    case 'new_loan_custom': {
      const amount = customAmount || 5000;
      modifiedProfile.numberOfLoans += 1;
      modifiedProfile.totalDebt += amount;
      break;
    }
    case 'pay_off_loan': {
      if (modifiedProfile.numberOfLoans > 0) {
        modifiedProfile.numberOfLoans -= 1;
      }
      break;
    }

    // ─── Credit History Management ──────────────────────────────────────
    case 'age_credit_history_years': {
      const years = customAmount || 1;
      modifiedProfile.ageOfCreditHistory = Math.max(0, profile.ageOfCreditHistory + years);
      break;
    }

    // ─── Investment & Gambling Management ────────────────────────────────
    case 'start_investing':
      modifiedProfile.hasInvestments = true;
      break;
    case 'reduce_gambling':
      modifiedProfile.gambling = profile.gambling === 'High' ? 'Low' : 'No';
      break;
    case 'reduce_gambling_custom': {
      const level = customAmount || 1; // 0=No, 1=Low, 2=High
      if (level === 2) modifiedProfile.gambling = 'Low';
      else if (level === 1) modifiedProfile.gambling = 'No';
      break;
    }
    case 'increase_gambling':
      modifiedProfile.gambling = profile.gambling === 'No' ? 'Low' : 'High';
      break;

    // ─── Mortgage Management ────────────────────────────────────────────
    case 'get_mortgage':
      if (!modifiedProfile.hasMortgage) {
        modifiedProfile.hasMortgage = true;
        modifiedProfile.numberOfLoans += 1;
        modifiedProfile.totalDebt += 500000; // Typical mortgage
      }
      break;
    case 'pay_off_mortgage':
      if (modifiedProfile.hasMortgage) {
        modifiedProfile.hasMortgage = false;
        modifiedProfile.numberOfLoans = Math.max(0, modifiedProfile.numberOfLoans - 1);
        modifiedProfile.totalDebt = Math.max(0, modifiedProfile.totalDebt - 500000);
      }
      break;

    // ─── Employment Status ──────────────────────────────────────────────
    case 'change_employment_custom': {
      const statuses: Array<'Employed' | 'Self-Employed' | 'Unemployed' | 'Retired'> = ['Employed', 'Self-Employed', 'Unemployed', 'Retired'];
      const currentIdx = statuses.indexOf(profile.employmentStatus);
      const newStatus = statuses[(currentIdx + 1) % statuses.length];
      modifiedProfile.employmentStatus = newStatus;
      break;
    }

    case 'miss_payment':
      modifiedProfile.missedPayments += 1;
      break;

    default:
      break;
  }

  const currentResult = predictCreditScore(profile);
  const newResult = predictCreditScore(modifiedProfile);
  const change = newResult.predictedScore - currentResult.predictedScore;

  const actionLabels: Record<string, string> = {
    // Debt
    pay_debt_custom: `Paying off R${customAmount || 500} in debt`,
    pay_debt_500: 'Paying off R500 in debt',
    pay_debt_1000: 'Paying off R1,000 in debt',
    
    // Savings
    increase_savings_custom: `Adding R${customAmount || 500} to savings`,
    increase_savings_500: 'Adding R500 to savings',
    
    // Utilization
    reduce_utilization_custom: `Reducing credit utilization by ${customPercentage || 10}%`,
    reduce_utilization: 'Reducing credit utilization by 10%',
    
    // Income
    increase_income_custom: `Increasing income by R${customAmount || 2000}/month`,
    increase_income_5k: 'Increasing income by R5,000/month',
    
    // Rent
    adjust_rent_custom: `Adjusting monthly rent by R${customAmount || 0}`,
    
    // Payments
    miss_payment_single: 'Missing one payment',
    miss_payment_multiple: `Missing ${customAmount || 2} payments`,
    cure_missed_payments: `Curing ${customAmount || 1} missed payment(s)`,
    miss_payment: 'Missing a payment',
    
    // Cards
    new_credit_card: 'Opening a new credit card',
    new_credit_card_custom: `Opening ${customAmount || 1} new credit card(s)`,
    
    // Loans
    new_loan: 'Taking out a new R5,000 loan',
    new_loan_custom: `Taking out a R${customAmount || 5000} loan`,
    pay_off_loan: 'Paying off one loan entirely',
    
    // History
    age_credit_history_years: `Aging credit history by ${customAmount || 1} year(s)`,
    
    // Investments & Gambling
    start_investing: 'Starting an investment portfolio',
    reduce_gambling: 'Reducing gambling activity',
    reduce_gambling_custom: `Reducing gambling activity to ${customAmount === 1 ? 'Low' : 'None'}`,
    increase_gambling: 'Increasing gambling activity',
    
    // Mortgage
    get_mortgage: 'Getting a R500k mortgage',
    pay_off_mortgage: 'Paying off mortgage entirely',
    
    // Employment
    change_employment_custom: `Changing employment status to ${
      ['Employed', 'Self-Employed', 'Unemployed', 'Retired'][
        ((['Employed', 'Self-Employed', 'Unemployed', 'Retired'].indexOf(profile.employmentStatus) + 1) % 4)
      ]
    }`,
  };

  return {
    newScore: newResult.predictedScore,
    change,
    explanation: `${actionLabels[action] || action} would ${change >= 0 ? 'increase' : 'decrease'} your score by ${Math.abs(change)} points.`,
  };
}

// ─── Fraud / Scam Detection (Simulates Naive Bayes) ────────────────────────

const SCAM_KEYWORDS = [
  'urgent', 'winner', 'won', 'prize', 'lottery', 'claim', 'act now',
  'limited time', 'click here', 'verify your account', 'suspend',
  'unusual activity', 'confirm your identity', 'wire transfer',
  'western union', 'moneygram', 'gift card', 'bitcoin', 'crypto',
  'nigerian prince', 'inheritance', 'congratulations', 'free money',
  'risk-free', 'guaranteed', 'no obligation', 'credit card number',
  'social security', 'id number', 'password', 'pin number', 'otp',
  'bank account', 'account locked', 'suspended', 'unauthorized',
  'immediate action', 'expire', 'penalty', 'legal action',
  'sars', 'tax refund', 'overpayment', 'refund', 'billing',
  'fnb', 'absa', 'standard bank', 'nedbank', 'capitec',
  'paypal', 'apple id', 'microsoft support', 'tech support',
  'remote access', 'teamviewer', 'anydesk', 'you have been selected',
  'dear customer', 'dear user', 'dear beneficiary', 'kindly',
  'do not ignore', 'respond immediately', 'send money',
  'advance fee', 'processing fee', 'transfer fee', 'eft',
];

const SCAM_PATTERNS = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
  /\b(?:https?:\/\/)?(?:bit\.ly|tinyurl|goo\.gl)\b/i,
  /R[\d,]+(?:\.\d{2})?\s*(?:million|thousand|rand)/i,
  /(?:call|text|whatsapp)\s*(?:now|immediately|urgently)/i,
  /\bfree\b.*\b(?:iphone|macbook|samsung|gift)\b/i,
];

export function detectFraud(
  text: string,
  userId: string
): FraudScanResult {
  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];

  for (const keyword of SCAM_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
    }
  }

  let patternMatches = 0;
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(text)) {
      patternMatches++;
    }
  }

  const keywordScore = Math.min(foundKeywords.length * 0.12, 0.6);
  const patternScore = Math.min(patternMatches * 0.2, 0.3);
  const lengthPenalty = text.length > 500 ? 0.05 : 0;
  const urgencyBonus = /!{2,}|URGENT|ACT NOW/i.test(text) ? 0.1 : 0;

  let confidence = keywordScore + patternScore + lengthPenalty + urgencyBonus;
  confidence = Math.min(Math.max(confidence, 0.02), 0.99);

  const isScam = confidence > 0.35;

  return {
    id: generateId(),
    userId,
    inputText: text,
    result: isScam ? 'Scam' : 'Safe',
    confidence: Math.round(confidence * 100),
    scannedAt: new Date().toISOString(),
    keywords: foundKeywords,
  };
}
