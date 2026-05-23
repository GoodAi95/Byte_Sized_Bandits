import { useApp } from '../../Controllers/AppController';
import { predictCreditScore, simulateAction } from '../../Services/MLService';
import { TrendingUp, DollarSign, CreditCard, PiggyBank, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, Zap, RefreshCw } from 'lucide-react';
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useState } from 'react';
import { formatRandsShort } from '../../Models';

export default function Dashboard() {
  const { currentUser, profile, getUserExpenses, getUserIncomes, getUserSavingPlans, getUserCreditHistory, getUserCircles, recordCreditScore } = useApp();
  const [selectedAction, setSelectedAction] = useState('');
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

  const scoreColor = prediction.predictedScore >= 740 ? '#22C55E' : prediction.predictedScore >= 670 ? '#F59E0B' : prediction.predictedScore >= 580 ? '#F97316' : '#EF4444';
  const scoreLabel = prediction.predictedScore >= 740 ? 'Excellent' : prediction.predictedScore >= 670 ? 'Good' : prediction.predictedScore >= 580 ? 'Fair' : 'Poor';

  const historyData = creditHistory.map((h, i) => ({
    name: `Entry ${i + 1}`,
    actual: h.score,
    predicted: h.predictedScore,
    date: new Date(h.date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
  }));

  const actions = [
    { value: 'pay_debt_500', label: 'Pay off R500 debt', emoji: '💰' },
    { value: 'pay_debt_1000', label: 'Pay off R1,000 debt', emoji: '💵' },
    { value: 'increase_savings_500', label: 'Save R500 more', emoji: '🐷' },
    { value: 'reduce_utilization', label: 'Reduce utilization 10%', emoji: '📉' },
    { value: 'start_investing', label: 'Start investing', emoji: '📈' },
    { value: 'reduce_gambling', label: 'Reduce gambling', emoji: '🚫' },
    { value: 'miss_payment', label: 'Miss a payment', emoji: '⚠️' },
    { value: 'new_credit_card', label: 'Open new credit card', emoji: '💳' },
    { value: 'new_loan', label: 'Take new R5k loan', emoji: '🏦' },
  ];

  const handleSimulate = () => {
    if (!selectedAction) return;
    const result = simulateAction(profile, selectedAction);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Predicted Score', value: prediction.predictedScore.toString(), sub: scoreLabel, icon: TrendingUp, color: scoreColor, bgColor: `${scoreColor}15` },
          { label: 'Monthly Expenses', value: formatRandsShort(thisMonthExpenses), sub: `${expenses.length} transactions`, icon: CreditCard, color: '#EF4444', bgColor: '#FEF2F2' },
          { label: 'Monthly Income', value: formatRandsShort(thisMonthIncome || profile.monthlyIncome), sub: thisMonthIncome ? `${incomes.length} sources` : 'Base salary', icon: DollarSign, color: '#22C55E', bgColor: '#F0FDF4' },
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

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> What-If Simulator</h3>
          <p className="text-sm text-gray-500 mb-4">See how your actions affect your score</p>
          <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto pr-1">
            {actions.map(action => (
              <button key={action.value} onClick={() => { setSelectedAction(action.value); setSimResult(null); }}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${selectedAction === action.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <span className="mr-2">{action.emoji}</span><span className="font-medium text-gray-800">{action.label}</span>
              </button>
            ))}
          </div>
          <button onClick={handleSimulate} disabled={!selectedAction}
            className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50 transition-all" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>
            Simulate Impact
          </button>
          {simResult && (
            <div className={`mt-4 p-4 rounded-xl border-2 ${simResult.change >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`text-3xl font-bold ${simResult.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {simResult.change >= 0 ? '+' : ''}{simResult.change}
                </div>
                <div><p className="text-sm font-semibold text-gray-900">New Score: {simResult.newScore}</p><p className="text-xs text-gray-500">Current: {prediction.predictedScore}</p></div>
              </div>
              <p className="text-sm text-gray-700">{simResult.explanation}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
