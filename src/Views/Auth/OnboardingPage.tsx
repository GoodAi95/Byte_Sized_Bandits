import { useState } from 'react';
import { useApp } from '../../Controllers/AppController';
import { TrendingUp, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

const STEPS = ['Credit Score', 'Income & Debt', 'Credit Details', 'Lifestyle'];

export default function OnboardingPage() {
  const { currentUser, saveProfile } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    currentCreditScore: 650,
    monthlyIncome: 25000,
    totalSavings: 50000,
    totalDebt: 30000,
    numberOfCreditCards: 2,
    numberOfLoans: 0,
    monthlyRent: 8000,
    gambling: 'No' as 'No' | 'Low' | 'High',
    hasInvestments: false,
    hasMortgage: false,
    missedPayments: 0,
    creditUtilization: 30,
    ageOfCreditHistory: 5,
    employmentStatus: 'Employed' as 'Employed' | 'Self-Employed' | 'Unemployed' | 'Retired',
  });

  const update = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));
  const handleFinish = () => { saveProfile(form); };
  const canNext = () => { if (step === 0) return form.currentCreditScore >= 300 && form.currentCreditScore <= 850; return true; };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold text-gray-900">What's your current credit score?</h3>
              <p className="text-gray-500 mt-1">If you don't know exactly, give your best estimate (300–850)</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-6">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  <circle cx="100" cy="100" r="85" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                  <circle cx="100" cy="100" r="85" fill="none"
                    stroke={form.currentCreditScore >= 740 ? '#22C55E' : form.currentCreditScore >= 670 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="12" strokeDasharray={`${((form.currentCreditScore - 300) / 550) * 534} 534`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">{form.currentCreditScore}</span>
                  <span className="text-sm text-gray-500">
                    {form.currentCreditScore >= 740 ? 'Excellent' : form.currentCreditScore >= 670 ? 'Good' : form.currentCreditScore >= 580 ? 'Fair' : 'Poor'}
                  </span>
                </div>
              </div>
              <input type="range" min="300" max="850" value={form.currentCreditScore}
                onChange={e => update('currentCreditScore', parseInt(e.target.value))} className="w-full max-w-sm accent-emerald-600" />
              <div className="flex justify-between w-full max-w-sm mt-1 text-xs text-gray-400">
                <span>300</span><span>500</span><span>650</span><span>750</span><span>850</span>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold text-gray-900">Income & Debt</h3>
              <p className="text-gray-500 mt-1">Help us understand your financial situation (in Rands)</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Monthly Income (R)</label>
                <input type="number" value={form.monthlyIncome} onChange={e => update('monthlyIncome', Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total Savings (R)</label>
                <input type="number" value={form.totalSavings} onChange={e => update('totalSavings', Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total Debt (R)</label>
                <input type="number" value={form.totalDebt} onChange={e => update('totalDebt', Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Monthly Rent (R)</label>
                <input type="number" value={form.monthlyRent} onChange={e => update('monthlyRent', Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employment Status</label>
              <select value={form.employmentStatus} onChange={e => update('employmentStatus', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900 bg-white">
                <option value="Employed">Employed</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold text-gray-900">Credit Details</h3>
              <p className="text-gray-500 mt-1">Tell us about your credit accounts</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Credit Cards</label>
                <input type="number" min="0" value={form.numberOfCreditCards} onChange={e => update('numberOfCreditCards', Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Active Loans</label>
                <input type="number" min="0" value={form.numberOfLoans} onChange={e => update('numberOfLoans', Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Missed Payments (last 12mo)</label>
                <input type="number" min="0" value={form.missedPayments} onChange={e => update('missedPayments', Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Credit Utilization (%)</label>
                <input type="number" min="0" max="100" value={form.creditUtilization} onChange={e => update('creditUtilization', Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Age of Credit History (years)</label>
              <input type="number" min="0" step="0.5" value={form.ageOfCreditHistory} onChange={e => update('ageOfCreditHistory', Math.max(0, Number(e.target.value)))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold text-gray-900">Lifestyle & Habits</h3>
              <p className="text-gray-500 mt-1">Final step — almost there!</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gambling Activity</label>
              <div className="grid grid-cols-3 gap-3">
                {(['No', 'Low', 'High'] as const).map(val => (
                  <button key={val} type="button" onClick={() => update('gambling', val)}
                    className={`py-3 rounded-xl border-2 font-semibold transition-all ${form.gambling === val ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {val}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 transition-colors">
                <input type="checkbox" checked={form.hasInvestments} onChange={e => update('hasInvestments', e.target.checked)}
                  className="w-5 h-5 text-emerald-600 accent-emerald-600 rounded" />
                <div>
                  <span className="font-semibold text-gray-800">I have investments</span>
                  <p className="text-sm text-gray-500">Stocks, bonds, retirement accounts, etc.</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300 transition-colors">
                <input type="checkbox" checked={form.hasMortgage} onChange={e => update('hasMortgage', e.target.checked)}
                  className="w-5 h-5 text-emerald-600 accent-emerald-600 rounded" />
                <div>
                  <span className="font-semibold text-gray-800">I have a mortgage</span>
                  <p className="text-sm text-gray-500">Active home loan payments</p>
                </div>
              </label>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: 'linear-gradient(135deg, #0B1D0F 0%, #1B4332 40%, #2D6A4F 100%)' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="flex items-center gap-2 justify-center mb-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span className="text-white font-bold text-lg">Sechaba Score</span>
          </div>
          <p className="text-emerald-300 text-sm">Welcome, {currentUser?.fullName}! Let's set up your profile.</p>
        </div>

        <div className="flex items-center gap-2 mb-6 px-2">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 flex items-center gap-1">
              <div className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? 'bg-emerald-400' : 'bg-white/20'}`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mb-4 px-2">
          {STEPS.map((label, i) => (
            <span key={i} className={`text-xs ${i <= step ? 'text-emerald-300' : 'text-white/40'}`}>{label}</span>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          {renderStep()}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:border-gray-300 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}
            {step < STEPS.length - 1 ? (
              <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white disabled:opacity-50 transition-all"
                style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>
                <CheckCircle className="w-4 h-4" /> Finish Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
