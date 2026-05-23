import { v4 as uuidv4 } from 'uuid';

// ─── User & Auth Models ─────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarColor: string;
  createdAt: string;
  onboarded: boolean;
}

export interface FinancialProfile {
  userId: string;
  currentCreditScore: number;
  monthlyIncome: number;
  totalSavings: number;
  totalDebt: number;
  numberOfCreditCards: number;
  numberOfLoans: number;
  monthlyRent: number;
  gambling: 'No' | 'Low' | 'High';
  hasInvestments: boolean;
  hasMortgage: boolean;
  missedPayments: number;
  creditUtilization: number;
  ageOfCreditHistory: number;
  employmentStatus: 'Employed' | 'Self-Employed' | 'Unemployed' | 'Retired';
  updatedAt: string;
}

// ─── Credit Score Models ────────────────────────────────────────────────────
export interface CreditScoreEntry {
  id: string;
  userId: string;
  score: number;
  predictedScore: number;
  date: string;
  factors: ShapFactor[];
}

export interface ShapFactor {
  feature: string;
  impactPoints: number;
  yourValue: number;
  direction: 'positive' | 'negative';
  advice: string;
}

// ─── Expense Models ─────────────────────────────────────────────────────────
export type ExpenseCategory =
  | 'Housing'
  | 'Transportation'
  | 'Food'
  | 'Utilities'
  | 'Healthcare'
  | 'Entertainment'
  | 'Shopping'
  | 'Education'
  | 'Debt Payment'
  | 'Savings'
  | 'Insurance'
  | 'Other';

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  createdAt: string;
}

// ─── Income Models ──────────────────────────────────────────────────────────
export interface IncomeEntry {
  id: string;
  userId: string;
  amount: number;
  source: string;
  date: string;
  recurring: boolean;
}

// ─── Saving Plan Models ─────────────────────────────────────────────────────
export interface SavingPlan {
  id: string;
  userId: string;
  name: string;
  goalAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  deadline: string;
  createdAt: string;
}

// ─── Score Circle Models ────────────────────────────────────────────────────
export interface ScoreCircle {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: string[];
  inviteCode: string;
  createdAt: string;
  goals: CircleGoal[];
}

export interface CircleGoal {
  id: string;
  circleId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface CirclePost {
  id: string;
  circleId: string;
  userId: string;
  userName: string;
  content: string;
  type: 'win' | 'advice' | 'update' | 'nudge';
  createdAt: string;
  likes: string[];
}

// ─── Nudge Models ───────────────────────────────────────────────────────────
export interface Nudge {
  id: string;
  circleId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ─── Fraud Detection Models ─────────────────────────────────────────────────
export interface FraudScanResult {
  id: string;
  userId: string;
  inputText: string;
  result: 'Safe' | 'Scam';
  confidence: number;
  scannedAt: string;
  keywords: string[];
}

// ─── Cash Back Models (Future) ──────────────────────────────────────────────
export interface CashBackReward {
  id: string;
  userId: string;
  merchant: string;
  amount: number;
  earnedAt: string;
  redeemed: boolean;
}

// ─── Navigation ─────────────────────────────────────────────────────────────
export type AppPage =
  | 'login'
  | 'register'
  | 'onboarding'
  | 'dashboard'
  | 'expenses'
  | 'income'
  | 'savings'
  | 'circles'
  | 'circle-detail'
  | 'fraud-detector'
  | 'settings'
  | 'cashback';

// ─── Helpers ────────────────────────────────────────────────────────────────
export function generateId(): string {
  return uuidv4();
}

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Currency formatter for South African Rands
export function formatRands(amount: number): string {
  return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatRandsShort(amount: number): string {
  return `R${amount.toLocaleString('en-ZA')}`;
}
