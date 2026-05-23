// AppController.tsx
// Main application state controller - equivalent to ASP.NET MVC Controllers
// Handles all business logic and state management

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type {
  User, FinancialProfile, Expense, IncomeEntry, SavingPlan,
  ScoreCircle, CirclePost, Nudge, FraudScanResult, CreditScoreEntry,
  AppPage
} from '../Models';
import { generateId, simpleHash } from '../Models';
import { db, DbSets } from '../Data/ApplicationDbContext';
import { predictCreditScore } from '../Services/MLService';

interface AppState {
  currentUser: User | null;
  profile: FinancialProfile | null;
  creditHistory: CreditScoreEntry[];
  expenses: Expense[];
  incomes: IncomeEntry[];
  savingPlans: SavingPlan[];
  circles: ScoreCircle[];
  circlePosts: CirclePost[];
  nudges: Nudge[];
  fraudScans: FraudScanResult[];
  currentPage: AppPage;
  selectedCircleId: string | null;
}

interface AppContextType extends AppState {
  // Auth
  register: (email: string, password: string, fullName: string) => string | null;
  login: (email: string, password: string) => string | null;
  logout: () => void;
  // Navigation
  navigate: (page: AppPage, circleId?: string) => void;
  // Profile
  saveProfile: (profile: Omit<FinancialProfile, 'userId' | 'updatedAt'>) => void;
  updateProfile: (updates: Partial<FinancialProfile>) => void;
  // Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  // Income
  addIncome: (income: Omit<IncomeEntry, 'id' | 'userId'>) => void;
  updateIncome: (id: string, updates: Partial<IncomeEntry>) => void;
  deleteIncome: (id: string) => void;
  // Saving Plans
  addSavingPlan: (plan: Omit<SavingPlan, 'id' | 'userId' | 'createdAt'>) => void;
  updateSavingPlan: (id: string, updates: Partial<SavingPlan>) => void;
  deleteSavingPlan: (id: string) => void;
  contributeToPlan: (planId: string, amount: number) => void;
  // Circles
  createCircle: (name: string, description: string) => void;
  joinCircle: (inviteCode: string) => string | null;
  addCirclePost: (circleId: string, content: string, type: CirclePost['type']) => void;
  likePost: (postId: string) => void;
  addCircleGoal: (circleId: string, title: string, targetAmount: number, deadline: string) => void;
  contributeToCircleGoal: (circleId: string, goalId: string, amount: number) => void;
  sendNudge: (circleId: string, toUserId: string, message: string) => void;
  markNudgeRead: (nudgeId: string) => void;
  // Fraud
  addFraudScan: (scan: FraudScanResult) => void;
  // Credit History
  recordCreditScore: () => void;
  // Helpers
  getUserById: (id: string) => User | undefined;
  getCircleMembers: (circleId: string) => User[];
  getUserExpenses: () => Expense[];
  getUserIncomes: () => IncomeEntry[];
  getUserSavingPlans: () => SavingPlan[];
  getUserCircles: () => ScoreCircle[];
  getUserNudges: () => Nudge[];
  getUserFraudScans: () => FraudScanResult[];
  getUserCreditHistory: () => CreditScoreEntry[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const currentUserId = db.get<string | null>(DbSets.CURRENT_USER, null);
    const users = db.get<User[]>(DbSets.USERS, []);
    const currentUser = users.find(u => u.id === currentUserId) || null;
    const profiles = db.get<FinancialProfile[]>(DbSets.PROFILES, []);
    const profile = currentUser ? profiles.find(p => p.userId === currentUser.id) || null : null;

    return {
      currentUser,
      profile,
      creditHistory: db.get<CreditScoreEntry[]>(DbSets.CREDIT_HISTORY, []),
      expenses: db.get<Expense[]>(DbSets.EXPENSES, []),
      incomes: db.get<IncomeEntry[]>(DbSets.INCOME, []),
      savingPlans: db.get<SavingPlan[]>(DbSets.SAVING_PLANS, []),
      circles: db.get<ScoreCircle[]>(DbSets.CIRCLES, []),
      circlePosts: db.get<CirclePost[]>(DbSets.CIRCLE_POSTS, []),
      nudges: db.get<Nudge[]>(DbSets.NUDGES, []),
      fraudScans: db.get<FraudScanResult[]>(DbSets.FRAUD_SCANS, []),
      currentPage: currentUser ? (currentUser.onboarded ? 'dashboard' : 'onboarding') : 'login',
      selectedCircleId: null,
    };
  });

  // Persist state changes
  useEffect(() => {
    db.set(DbSets.CURRENT_USER, state.currentUser?.id || null);
    db.set(DbSets.CREDIT_HISTORY, state.creditHistory);
    db.set(DbSets.EXPENSES, state.expenses);
    db.set(DbSets.INCOME, state.incomes);
    db.set(DbSets.SAVING_PLANS, state.savingPlans);
    db.set(DbSets.CIRCLES, state.circles);
    db.set(DbSets.CIRCLE_POSTS, state.circlePosts);
    db.set(DbSets.NUDGES, state.nudges);
    db.set(DbSets.FRAUD_SCANS, state.fraudScans);
  }, [state]);

  const AVATAR_COLORS = ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#1B4332', '#4A7C59'];

  const register = useCallback((email: string, password: string, fullName: string): string | null => {
    const users = db.get<User[]>(DbSets.USERS, []);
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return 'An account with this email already exists.';
    }
    const newUser: User = {
      id: generateId(),
      email: email.toLowerCase(),
      passwordHash: simpleHash(password),
      fullName,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      createdAt: new Date().toISOString(),
      onboarded: false,
    };
    const updatedUsers = [...users, newUser];
    db.set(DbSets.USERS, updatedUsers);
    setState(prev => ({ ...prev, currentUser: newUser, currentPage: 'onboarding' }));
    return null;
  }, []);

  const login = useCallback((email: string, password: string): string | null => {
    const users = db.get<User[]>(DbSets.USERS, []);
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === simpleHash(password)
    );
    if (!user) return 'Invalid email or password.';
    const profiles = db.get<FinancialProfile[]>(DbSets.PROFILES, []);
    const profile = profiles.find(p => p.userId === user.id) || null;
    setState(prev => ({
      ...prev,
      currentUser: user,
      profile,
      currentPage: user.onboarded ? 'dashboard' : 'onboarding',
    }));
    return null;
  }, []);

  const logout = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentUser: null,
      profile: null,
      currentPage: 'login',
      selectedCircleId: null,
    }));
    db.remove(DbSets.CURRENT_USER);
  }, []);

  const navigate = useCallback((page: AppPage, circleId?: string) => {
    setState(prev => ({
      ...prev,
      currentPage: page,
      selectedCircleId: circleId || prev.selectedCircleId,
    }));
  }, []);

  const saveProfile = useCallback((profileData: Omit<FinancialProfile, 'userId' | 'updatedAt'>) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const newProfile: FinancialProfile = {
        ...profileData,
        userId: prev.currentUser.id,
        updatedAt: new Date().toISOString(),
      };
      const profiles = db.get<FinancialProfile[]>(DbSets.PROFILES, []);
      const existingIdx = profiles.findIndex(p => p.userId === prev.currentUser!.id);
      if (existingIdx >= 0) {
        profiles[existingIdx] = newProfile;
      } else {
        profiles.push(newProfile);
      }
      db.set(DbSets.PROFILES, profiles);

      const users = db.get<User[]>(DbSets.USERS, []);
      const userIdx = users.findIndex(u => u.id === prev.currentUser!.id);
      if (userIdx >= 0) {
        users[userIdx].onboarded = true;
        db.set(DbSets.USERS, users);
      }

      const prediction = predictCreditScore(newProfile);
      const entry: CreditScoreEntry = {
        id: generateId(),
        userId: prev.currentUser.id,
        score: newProfile.currentCreditScore,
        predictedScore: prediction.predictedScore,
        date: new Date().toISOString(),
        factors: prediction.factors,
      };

      return {
        ...prev,
        profile: newProfile,
        currentUser: { ...prev.currentUser, onboarded: true },
        creditHistory: [...prev.creditHistory, entry],
        currentPage: 'dashboard',
      };
    });
  }, []);

  const updateProfile = useCallback((updates: Partial<FinancialProfile>) => {
    setState(prev => {
      if (!prev.profile || !prev.currentUser) return prev;
      const updated = { ...prev.profile, ...updates, updatedAt: new Date().toISOString() };
      const profiles = db.get<FinancialProfile[]>(DbSets.PROFILES, []);
      const idx = profiles.findIndex(p => p.userId === prev.currentUser!.id);
      if (idx >= 0) profiles[idx] = updated;
      else profiles.push(updated);
      db.set(DbSets.PROFILES, profiles);
      return { ...prev, profile: updated };
    });
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const newExpense: Expense = {
        ...expense,
        id: generateId(),
        userId: prev.currentUser.id,
        createdAt: new Date().toISOString(),
      };
      return { ...prev, expenses: [...prev.expenses, newExpense] };
    });
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id),
    }));
  }, []);

  const addIncome = useCallback((income: Omit<IncomeEntry, 'id' | 'userId'>) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const newIncome: IncomeEntry = {
        ...income,
        id: generateId(),
        userId: prev.currentUser.id,
      };
      return { ...prev, incomes: [...prev.incomes, newIncome] };
    });
  }, []);

  const updateIncome = useCallback((id: string, updates: Partial<IncomeEntry>) => {
    setState(prev => ({
      ...prev,
      incomes: prev.incomes.map(i => i.id === id ? { ...i, ...updates } : i),
    }));
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      incomes: prev.incomes.filter(i => i.id !== id),
    }));
  }, []);

  const addSavingPlan = useCallback((plan: Omit<SavingPlan, 'id' | 'userId' | 'createdAt'>) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const newPlan: SavingPlan = {
        ...plan,
        id: generateId(),
        userId: prev.currentUser.id,
        createdAt: new Date().toISOString(),
      };
      return { ...prev, savingPlans: [...prev.savingPlans, newPlan] };
    });
  }, []);

  const updateSavingPlan = useCallback((id: string, updates: Partial<SavingPlan>) => {
    setState(prev => ({
      ...prev,
      savingPlans: prev.savingPlans.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, []);

  const deleteSavingPlan = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      savingPlans: prev.savingPlans.filter(p => p.id !== id),
    }));
  }, []);

  const contributeToPlan = useCallback((planId: string, amount: number) => {
    setState(prev => ({
      ...prev,
      savingPlans: prev.savingPlans.map(p =>
        p.id === planId ? { ...p, currentAmount: p.currentAmount + amount } : p
      ),
    }));
  }, []);

  const createCircle = useCallback((name: string, description: string) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const newCircle: ScoreCircle = {
        id: generateId(),
        name,
        description,
        createdBy: prev.currentUser.id,
        members: [prev.currentUser.id],
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: new Date().toISOString(),
        goals: [],
      };
      return { ...prev, circles: [...prev.circles, newCircle] };
    });
  }, []);

  const joinCircle = useCallback((inviteCode: string): string | null => {
    let error: string | null = null;
    setState(prev => {
      if (!prev.currentUser) { error = 'Not logged in'; return prev; }
      const circle = prev.circles.find(c => c.inviteCode === inviteCode.toUpperCase());
      if (!circle) { error = 'Invalid invite code.'; return prev; }
      if (circle.members.includes(prev.currentUser.id)) { error = 'You are already in this circle.'; return prev; }
      return {
        ...prev,
        circles: prev.circles.map(c =>
          c.id === circle.id ? { ...c, members: [...c.members, prev.currentUser!.id] } : c
        ),
      };
    });
    return error;
  }, []);

  const addCirclePost = useCallback((circleId: string, content: string, type: CirclePost['type']) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const newPost: CirclePost = {
        id: generateId(),
        circleId,
        userId: prev.currentUser.id,
        userName: prev.currentUser.fullName,
        content,
        type,
        createdAt: new Date().toISOString(),
        likes: [],
      };
      return { ...prev, circlePosts: [...prev.circlePosts, newPost] };
    });
  }, []);

  const likePost = useCallback((postId: string) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      return {
        ...prev,
        circlePosts: prev.circlePosts.map(p => {
          if (p.id !== postId) return p;
          const alreadyLiked = p.likes.includes(prev.currentUser!.id);
          return {
            ...p,
            likes: alreadyLiked
              ? p.likes.filter(id => id !== prev.currentUser!.id)
              : [...p.likes, prev.currentUser!.id],
          };
        }),
      };
    });
  }, []);

  const addCircleGoal = useCallback((circleId: string, title: string, targetAmount: number, deadline: string) => {
    setState(prev => ({
      ...prev,
      circles: prev.circles.map(c => {
        if (c.id !== circleId) return c;
        const goal = { id: generateId(), circleId, title, targetAmount, currentAmount: 0, deadline };
        return { ...c, goals: [...c.goals, goal] };
      }),
    }));
  }, []);

  const contributeToCircleGoal = useCallback((circleId: string, goalId: string, amount: number) => {
    setState(prev => ({
      ...prev,
      circles: prev.circles.map(c => {
        if (c.id !== circleId) return c;
        return {
          ...c,
          goals: c.goals.map(g =>
            g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
          ),
        };
      }),
    }));
  }, []);

  const sendNudge = useCallback((circleId: string, toUserId: string, message: string) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const nudge: Nudge = {
        id: generateId(),
        circleId,
        fromUserId: prev.currentUser.id,
        toUserId,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      };
      return { ...prev, nudges: [...prev.nudges, nudge] };
    });
  }, []);

  const markNudgeRead = useCallback((nudgeId: string) => {
    setState(prev => ({
      ...prev,
      nudges: prev.nudges.map(n => n.id === nudgeId ? { ...n, read: true } : n),
    }));
  }, []);

  const addFraudScan = useCallback((scan: FraudScanResult) => {
    setState(prev => ({ ...prev, fraudScans: [...prev.fraudScans, scan] }));
  }, []);

  const recordCreditScore = useCallback(() => {
    setState(prev => {
      if (!prev.currentUser || !prev.profile) return prev;
      const prediction = predictCreditScore(prev.profile);
      const entry: CreditScoreEntry = {
        id: generateId(),
        userId: prev.currentUser.id,
        score: prev.profile.currentCreditScore,
        predictedScore: prediction.predictedScore,
        date: new Date().toISOString(),
        factors: prediction.factors,
      };
      return { ...prev, creditHistory: [...prev.creditHistory, entry] };
    });
  }, []);

  const getUserById = useCallback((id: string): User | undefined => {
    const users = db.get<User[]>(DbSets.USERS, []);
    return users.find(u => u.id === id);
  }, []);

  const getCircleMembers = useCallback((circleId: string): User[] => {
    const circle = state.circles.find(c => c.id === circleId);
    if (!circle) return [];
    const users = db.get<User[]>(DbSets.USERS, []);
    return circle.members.map(mid => users.find(u => u.id === mid)).filter(Boolean) as User[];
  }, [state.circles]);

  const getUserExpenses = useCallback((): Expense[] => {
    if (!state.currentUser) return [];
    return state.expenses.filter(e => e.userId === state.currentUser!.id);
  }, [state.currentUser, state.expenses]);

  const getUserIncomes = useCallback((): IncomeEntry[] => {
    if (!state.currentUser) return [];
    return state.incomes.filter(i => i.userId === state.currentUser!.id);
  }, [state.currentUser, state.incomes]);

  const getUserSavingPlans = useCallback((): SavingPlan[] => {
    if (!state.currentUser) return [];
    return state.savingPlans.filter(p => p.userId === state.currentUser!.id);
  }, [state.currentUser, state.savingPlans]);

  const getUserCircles = useCallback((): ScoreCircle[] => {
    if (!state.currentUser) return [];
    return state.circles.filter(c => c.members.includes(state.currentUser!.id));
  }, [state.currentUser, state.circles]);

  const getUserNudges = useCallback((): Nudge[] => {
    if (!state.currentUser) return [];
    return state.nudges.filter(n => n.toUserId === state.currentUser!.id);
  }, [state.currentUser, state.nudges]);

  const getUserFraudScans = useCallback((): FraudScanResult[] => {
    if (!state.currentUser) return [];
    return state.fraudScans.filter(f => f.userId === state.currentUser!.id);
  }, [state.currentUser, state.fraudScans]);

  const getUserCreditHistory = useCallback((): CreditScoreEntry[] => {
    if (!state.currentUser) return [];
    return state.creditHistory.filter(h => h.userId === state.currentUser!.id);
  }, [state.currentUser, state.creditHistory]);

  const value: AppContextType = {
    ...state,
    register, login, logout, navigate,
    saveProfile, updateProfile,
    addExpense, updateExpense, deleteExpense,
    addIncome, updateIncome, deleteIncome,
    addSavingPlan, updateSavingPlan, deleteSavingPlan, contributeToPlan,
    createCircle, joinCircle, addCirclePost, likePost,
    addCircleGoal, contributeToCircleGoal,
    sendNudge, markNudgeRead,
    addFraudScan, recordCreditScore,
    getUserById, getCircleMembers,
    getUserExpenses, getUserIncomes, getUserSavingPlans,
    getUserCircles, getUserNudges, getUserFraudScans, getUserCreditHistory,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
