import { useApp } from '../../Controllers/AppController';
import { predictCreditScore, simulateAction } from '../../Services/MLService';
import { TrendingUp, DollarSign, CreditCard, PiggyBank, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, Zap, RefreshCw } from 'lucide-react';
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useState } from 'react';
import { formatRandsShort } from '../../Models';

export default function Dashboard() {
  const { currentUser, profile, getUserExpenses, getUserIncomes, getUserSavingPlans, getUserCreditHistory, getUserCircles, recordCreditScore } = useApp();
  const [selectedAction, setSelectedAction] = useState('');
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [customPercentage, setCustomPercentage] = useState<number | ''>('');
  const [simResult, setSimResult] = useState<{ newScore: number; change: number; explanation: string } | null>(null);

  if (!profile || !currentUser) return null;

  const prediction = predictCreditScore(profile);
  const expenses = getUserExpenses();
  const incomes = getUserIncomes();
  const savingPlans = getUserSavingPlans();
  const creditHistory = getUserCreditHistory();
  const circles = getUserCircles();

  const thisMonthExpenses = expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.amount, 0);
  const thisMonthIncome = incomes.filter(i => new Date(i.date).getMonth() === new Date().getMonth()).reduce((sum, i) => sum + i.amount, 0);
  const totalSaved = savingPlans.reduce((sum, p) => sum + p.currentAmount, 0);
  
  // Include rent in total expenses
  const totalMonthlyExpenses = thisMonthExpenses + profile.monthlyRent;
  // Calculate remaining balance after all expenses
  const monthlyIncomeAmount = thisMonthIncome || profile.monthlyIncome;
  const remainingBalance = monthlyIncomeAmount - totalMonthlyExpenses;

  const scoreColor = prediction.predictedScore >= 740 ? '#22C55E' : prediction.predictedScore >= 670 ? '#F59E0B' : prediction.predictedScore >= 580 ? '#F97316' : '#EF4444';
  const scoreLabel = prediction.predictedScore >= 740 ? 'Excellent' : prediction.predictedScore >= 670 ? 'Good' : prediction.predictedScore >= 580 ? 'Fair' : 'Poor';

  const historyData = creditHistory.map((h, i) => ({
    name: `Entry ${i + 1}`,
    actual: h.score,
    predicted: h.predictedScore,
    date: new Date(h.date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
  }));

  // Action groups for better organization
  const actionGroups = {
    debtManagement: [
      { value: 'pay_debt_custom', label: 'Pay off custom amount', emoji: '💰', hasCustom: true, customType: 'amount' as const },
      { value: 'pay_debt_500', label: 'Pay off R500', emoji: '💰' },
      { value: 'pay_debt_1000', label: 'Pay off R1,000', emoji: '💵' },
    ],
    savingsInvestment: [
      { value: 'increase_savings_custom', label: 'Save custom amount', emoji: '🐷', hasCustom: true, customType: 'amount' as const },
      { value: 'increase_savings_500', label: 'Save R500 more', emoji: '🐷' },
      { value: 'start_investing', label: 'Start investing', emoji: '📈' },
    ],
    creditUtilization: [
      { value: 'reduce_utilization_custom', label: 'Reduce util. by %', emoji: '📉', hasCustom: true, customType: 'percentage' as const },
      { value: 'reduce_utilization', label: 'Reduce util. 10%', emoji: '📉' },
    ],
    incomeEmployment: [
      { value: 'increase_income_custom', label: 'Increase income', emoji: '📊', hasCustom: true, customType: 'amount' as const },
      { value: 'increase_income_5k', label: 'Increase +R5k/month', emoji: '📊' },
      { value: 'change_employment_custom', label: 'Change employment', emoji: '💼' },
      { value: 'adjust_rent_custom', label: 'Adjust rent', emoji: '🏠', hasCustom: true, customType: 'amount' as const },
    ],
    creditCards: [
      { value: 'new_credit_card_custom', label: 'Open # of cards', emoji: '💳', hasCustom: true, customType: 'amount' as const },
      { value: 'new_credit_card', label: 'Open new card', emoji: '💳' },
    ],
    loans: [
      { value: 'new_loan_custom', label: 'Take custom loan', emoji: '🏦', hasCustom: true, customType: 'amount' as const },
      { value: 'new_loan', label: 'Take R5k loan', emoji: '🏦' },
      { value: 'pay_off_loan', label: 'Pay off one loan', emoji: '✅' },
      { value: 'get_mortgage', label: 'Get R500k Home loan', emoji: '🏡' },
      { value: 'pay_off_mortgage', label: 'Pay off Home loan', emoji: '🔓' },
    ],
    paymentHistory: [
      { value: 'miss_payment_single', label: 'Miss 1 payment', emoji: '⚠️' },
      { value: 'miss_payment_multiple', label: 'Miss # payments', emoji: '⚠️', hasCustom: true, customType: 'amount' as const },
      { value: 'cure_missed_payments', label: 'Cure missed pmts', emoji: '✨', hasCustom: true, customType: 'amount' as const },
      { value: 'miss_payment', label: 'Miss a payment', emoji: '⚠️' },
    ],
    lifestyleRisk: [
      { value: 'reduce_gambling', label: 'Reduce gambling', emoji: '🚫' },
      { value: 'reduce_gambling_custom', label: 'Reduce gambling to', emoji: '🚫', hasCustom: true, customType: 'amount' as const },
      { value: 'increase_gambling', label: 'Increase gambling', emoji: '🎲' },
    ],
    creditHistory: [
      { value: 'age_credit_history_years', label: 'Age credit # years', emoji: '📅', hasCustom: true, customType: 'amount' as const },
    ],
  };

  const allActions = Object.values(actionGroups).flat();
  
  // Determine if current action needs custom input
  const currentActionConfig = allActions.find(a => a.value === selectedAction);
  const needsCustomInput = currentActionConfig?.hasCustom;

  const handleSimulate = () => {
    if (!selectedAction) return;
    
    const customVal = needsCustomInput 
      ? (currentActionConfig?.customType === 'percentage' ? customPercentage : customAmount)
      : undefined;
    
    const result = simulateAction(
      profile, 
      selectedAction,
      currentActionConfig?.customType === 'amount' ? Number(customVal) || undefined : undefined,
      currentActionConfig?.customType === 'percentage' ? Number(customVal) || undefined : undefined
    );
    setSimResult(result);
  };

  const positiveFactors = prediction.factors.filter(f => f.direction === 'positive').slice(0, 3);
  const negativeFactors = prediction.factors.filter(f => f.direction === 'negative').slice(0, 3);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back, {currentUser.fullName.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 mt-1">Here's your financial health overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Predicted Score', value: prediction.predictedScore.toString(), sub: scoreLabel, icon: TrendingUp, color: scoreColor, bgColor: `${scoreColor}15` },
          { label: 'Monthly Expenses', value: formatRandsShort(totalMonthlyExpenses), sub: `${expenses.length + (profile.monthlyRent > 0 ? 1 : 0)} items (incl. rent)`, icon: CreditCard, color: '#EF4444', bgColor: '#FEF2F2' },
          { label: 'Monthly Income', value: formatRandsShort(monthlyIncomeAmount), sub: thisMonthIncome ? `${incomes.length} sources` : 'Base salary', icon: DollarSign, color: '#22C55E', bgColor: '#F0FDF4' },
          { label: 'Remaining Balance', value: formatRandsShort(remainingBalance), sub: remainingBalance >= 0 ? 'Available' : 'Deficit', icon: PiggyBank, color: remainingBalance >= 0 ? '#22C55E' : '#EF4444', bgColor: remainingBalance >= 0 ? '#F0FDF4' : '#FEF2F2' },
          { label: 'Total Saved', value: formatRandsShort(totalSaved + profile.totalSavings), sub: `${savingPlans.length} active plan(s)`, icon: PiggyBank, color: '#8B5CF6', bgColor: '#F5F3FF' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.bgColor }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              {i === 0 && (
                <button onClick={recordCreditScore} className="text-gray-400 hover:text-emerald-600 transition-colors" title="Refresh prediction">
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            <p className="text-xs mt-1" style={{ color: stat.color }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Credit Score</h3>
          <div className="flex justify-center mb-4">
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                <circle cx="100" cy="100" r="82" fill="none" stroke="#F3F4F6" strokeWidth="14" />
                <circle cx="100" cy="100" r="82" fill="none" stroke={scoreColor} strokeWidth="14"
                  strokeDasharray={`${((prediction.predictedScore - 300) / 550) * 515} 515`} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: scoreColor }}>{prediction.predictedScore}</span>
                <span className="text-sm text-gray-500 font-medium">{scoreLabel}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-4"><span>300</span><span>500</span><span>670</span><span>740</span><span>850</span></div>
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Your Reported Score</span>
              <span className="font-bold text-gray-900">{profile.currentCreditScore}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">AI Predicted Score</span>
              <span className="font-bold" style={{ color: scoreColor }}>{prediction.predictedScore}</span>
            </div>
            {prediction.predictedScore !== profile.currentCreditScore && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                {prediction.predictedScore > profile.currentCreditScore ? (
                  <><ArrowUpRight className="w-3 h-3 text-green-500" /><span className="text-green-600">Model suggests your score may be higher</span></>
                ) : (
                  <><ArrowDownRight className="w-3 h-3 text-amber-500" /><span className="text-amber-600">Model suggests potential risk factors</span></>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Score History & Trend</h3>
          {historyData.length > 1 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={historyData}>
                <defs><linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.15} /><stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis domain={[300, 850]} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '13px' }} />
                <Area type="monotone" dataKey="predicted" stroke="#2D6A4F" strokeWidth={2.5} fill="url(#colorPredicted)" name="Predicted" />
                <Line type="monotone" dataKey="actual" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} name="Reported" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[260px] text-gray-400">
              <TrendingUp className="w-12 h-12 mb-3 opacity-30" /><p className="font-medium">Not enough data yet</p>
              <p className="text-sm">Update your profile or log expenses to see trends</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-1">AI Insights</h3>
          <p className="text-sm text-gray-500 mb-4">What's affecting your score (SHAP Analysis)</p>
          {positiveFactors.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1.5 mb-2"><CheckCircle className="w-4 h-4" /> Helping Your Score</h4>
              <div className="space-y-2">
                {positiveFactors.map((f, i) => (
                  <div key={i} className="p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-green-800">{f.feature}</span>
                      <span className="text-xs font-bold text-green-600">+{f.impactPoints} pts</span>
                    </div>
                    <p className="text-xs text-green-700/80">{f.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {negativeFactors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 flex items-center gap-1.5 mb-2"><AlertTriangle className="w-4 h-4" /> Hurting Your Score</h4>
              <div className="space-y-2">
                {negativeFactors.map((f, i) => (
                  <div key={i} className="p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-red-800">{f.feature}</span>
                      <span className="text-xs font-bold text-red-600">{f.impactPoints} pts</span>
                    </div>
                    <p className="text-xs text-red-700/80">{f.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm col-span-1 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> What-If Simulator</h3>
          <p className="text-sm text-gray-500 mb-4">Predict score impact with custom amounts & detailed scenarios</p>
          
          {/* Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {Object.entries(actionGroups).map(([key, _]) => (
              <button key={key} onClick={() => { setSelectedAction(''); setSimResult(null); setCustomAmount(''); setCustomPercentage(''); }}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all" 
                style={{ 
                  background: selectedAction && allActions.find(a => a.value === selectedAction && actionGroups[key as keyof typeof actionGroups]?.find(x => x.value === a.value)) ? '#2D6A4F' : '#F3F4F6',
                  color: selectedAction && allActions.find(a => a.value === selectedAction && actionGroups[key as keyof typeof actionGroups]?.find(x => x.value === a.value)) ? '#fff' : '#6B7280'
                }}>
                {key.split(/(?=[A-Z])/).join(' ')}
              </button>
            ))}
          </div>

          {/* Action Buttons - Grid Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-[320px] overflow-y-auto pr-2">
            {allActions.map(action => (
              <button 
                key={action.value} 
                onClick={() => { 
                  setSelectedAction(action.value); 
                  setSimResult(null);
                  if (action.customType === 'amount') setCustomAmount('');
                  if (action.customType === 'percentage') setCustomPercentage('');
                }}
                className={`text-left p-2.5 rounded-lg border transition-all text-xs sm:text-sm flex flex-col items-start ${
                  selectedAction === action.value 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                }`}
              >
                <span className="text-lg mb-1">{action.emoji}</span>
                <span className="font-medium text-gray-800 line-clamp-2">{action.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Input Fields */}
          {needsCustomInput && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {currentActionConfig?.customType === 'amount' 
                  ? 'Enter Amount (R)' 
                  : 'Enter Percentage (%)'}
              </label>
              <input 
                type="number" 
                value={currentActionConfig?.customType === 'amount' ? customAmount : customPercentage}
                onChange={(e) => {
                  if (currentActionConfig?.customType === 'amount') {
                    setCustomAmount(e.target.value ? Number(e.target.value) : '');
                  } else {
                    setCustomPercentage(e.target.value ? Number(e.target.value) : '');
                  }
                }}
                placeholder={currentActionConfig?.customType === 'amount' ? '500' : '10'}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-600 mt-2">
                {currentActionConfig?.customType === 'amount' 
                  ? 'Specify any amount for more accurate simulation'
                  : 'Enter percentage to reduce by'}
              </p>
            </div>
          )}

          {/* Simulate Button & Results */}
          <div className="space-y-3">
            <button 
              onClick={handleSimulate} 
              disabled={!selectedAction || (needsCustomInput && !customAmount && !customPercentage)}
              className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-40 transition-all" 
              style={{ background: !selectedAction || (needsCustomInput && !customAmount && !customPercentage) ? '#D1D5DB' : 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>
              Simulate Impact
            </button>

            {simResult && (
              <div className={`p-4 rounded-lg border-2 ${simResult.change >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`text-4xl font-bold ${simResult.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {simResult.change >= 0 ? '+' : ''}{simResult.change}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Score Impact</p>
                    <p className="text-xs text-gray-600">New: {simResult.newScore} | Current: {prediction.predictedScore}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{simResult.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-500 mb-2">Expense Breakdown</h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Monthly Rent 🏠</span>
                <span className="text-sm font-semibold text-gray-900">{formatRandsShort(profile.monthlyRent)}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${profile.monthlyRent > 0 ? (profile.monthlyRent / totalMonthlyExpenses) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Other Expenses 📊</span>
                <span className="text-sm font-semibold text-gray-900">{formatRandsShort(thisMonthExpenses)}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 transition-all" style={{ width: `${thisMonthExpenses > 0 ? (thisMonthExpenses / totalMonthlyExpenses) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Total Expenses</span>
                <span className="text-sm font-bold text-gray-900">{formatRandsShort(totalMonthlyExpenses)}</span>
              </div>
            </div>
            <div className={`p-2 rounded-lg text-center ${remainingBalance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-xs text-gray-600 mb-1">Remaining</p>
              <p className={`text-lg font-bold ${remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatRandsShort(remainingBalance)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-500 mb-2">Debt-to-Income Ratio</h4>
          <div className="text-2xl font-bold text-gray-900">{profile.monthlyIncome > 0 ? Math.round((profile.totalDebt / (profile.monthlyIncome * 12)) * 100) : 0}%</div>
          <div className="w-full h-2 bg-gray-100 rounded-full mt-3">
            <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, profile.monthlyIncome > 0 ? (profile.totalDebt / (profile.monthlyIncome * 12)) * 100 : 0)}%`, background: profile.totalDebt / (profile.monthlyIncome * 12) > 0.43 ? '#EF4444' : '#22C55E' }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{profile.totalDebt / (profile.monthlyIncome * 12) > 0.43 ? 'Above recommended 43%' : 'Healthy ratio ✓'}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-500 mb-2">Credit Utilization</h4>
          <div className="text-2xl font-bold text-gray-900">{profile.creditUtilization}%</div>
          <div className="w-full h-2 bg-gray-100 rounded-full mt-3">
            <div className="h-2 rounded-full transition-all" style={{ width: `${profile.creditUtilization}%`, background: profile.creditUtilization > 30 ? '#F59E0B' : '#22C55E' }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{profile.creditUtilization > 30 ? 'Try to reduce below 30%' : 'Great - under 30% ✓'}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-500 mb-2">Score Circles</h4>
          <div className="text-2xl font-bold text-gray-900">{circles.length}</div>
          <p className="text-sm text-gray-400 mt-1">Active circle(s)</p>
          <p className="text-xs text-emerald-600 mt-2">{circles.length === 0 ? 'Join or create your first circle →' : 'View your circles →'}</p>
        </div>
      </div>
    </div>
  );
}
