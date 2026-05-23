import { useState, useEffect } from 'react';
import { useApp } from '../../Controllers/AppController';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const { profile, updateProfile, recordCreditScore, currentUser } = useApp();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ currentCreditScore: 650, monthlyIncome: 25000, totalSavings: 50000, totalDebt: 30000, numberOfCreditCards: 2, numberOfLoans: 0, monthlyRent: 8000, gambling: 'No' as 'No' | 'Low' | 'High', hasInvestments: false, hasMortgage: false, missedPayments: 0, creditUtilization: 30, ageOfCreditHistory: 5, employmentStatus: 'Employed' as 'Employed' | 'Self-Employed' | 'Unemployed' | 'Retired' });

  useEffect(() => { if (profile) { setForm({ currentCreditScore: profile.currentCreditScore, monthlyIncome: profile.monthlyIncome, totalSavings: profile.totalSavings, totalDebt: profile.totalDebt, numberOfCreditCards: profile.numberOfCreditCards, numberOfLoans: profile.numberOfLoans, monthlyRent: profile.monthlyRent, gambling: profile.gambling, hasInvestments: profile.hasInvestments, hasMortgage: profile.hasMortgage, missedPayments: profile.missedPayments, creditUtilization: profile.creditUtilization, ageOfCreditHistory: profile.ageOfCreditHistory, employmentStatus: profile.employmentStatus }); } }, [profile]);

  const handleSave = (e: React.FormEvent) => { e.preventDefault(); updateProfile(form); recordCreditScore(); setSaved(true); setTimeout(() => setSaved(false), 3000); };
  const update = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings & Profile</h1><p className="text-gray-500 mt-1">Update your financial information to improve predictions</p></div>

      {saved && (<div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold">Profile updated and credit score recalculated!</div>)}

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: currentUser?.avatarColor }}>{currentUser?.fullName.charAt(0)}</div>
          <div><p className="text-lg font-bold text-gray-900">{currentUser?.fullName}</p><p className="text-sm text-gray-500">{currentUser?.email}</p><p className="text-xs text-gray-400">Joined {new Date(currentUser?.createdAt || '').toLocaleDateString('en-ZA')}</p></div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Profile</h3>
          <div className="space-y-5">
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Credit Score ({form.currentCreditScore})</label><input type="range" min="300" max="850" value={form.currentCreditScore} onChange={e => update('currentCreditScore', parseInt(e.target.value))} className="w-full" /><div className="flex justify-between text-xs text-gray-400 mt-1"><span>300</span><span>850</span></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Income (R)</label><input type="number" value={form.monthlyIncome} onChange={e => update('monthlyIncome', Math.max(0, Number(e.target.value)))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Total Savings (R)</label><input type="number" value={form.totalSavings} onChange={e => update('totalSavings', Math.max(0, Number(e.target.value)))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Total Debt (R)</label><input type="number" value={form.totalDebt} onChange={e => update('totalDebt', Math.max(0, Number(e.target.value)))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Rent (R)</label><input type="number" value={form.monthlyRent} onChange={e => update('monthlyRent', Math.max(0, Number(e.target.value)))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
            </div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Employment Status</label><select value={form.employmentStatus} onChange={e => update('employmentStatus', e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900 bg-white"><option value="Employed">Employed</option><option value="Self-Employed">Self-Employed</option><option value="Unemployed">Unemployed</option><option value="Retired">Retired</option></select></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Credit Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Credit Cards</label><input type="number" min="0" value={form.numberOfCreditCards} onChange={e => update('numberOfCreditCards', Math.max(0, Number(e.target.value)))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Active Loans</label><input type="number" min="0" value={form.numberOfLoans} onChange={e => update('numberOfLoans', Math.max(0, Number(e.target.value)))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Missed Payments (12mo)</label><input type="number" min="0" value={form.missedPayments} onChange={e => update('missedPayments', Math.max(0, Number(e.target.value)))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Credit Utilization (%)</label><input type="number" min="0" max="100" value={form.creditUtilization} onChange={e => update('creditUtilization', Math.min(100, Math.max(0, Number(e.target.value))))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
          </div>
          <div className="mt-4"><label className="block text-sm font-semibold text-gray-700 mb-1">Credit History Age (years)</label><input type="number" min="0" step="0.5" value={form.ageOfCreditHistory} onChange={e => update('ageOfCreditHistory', Math.max(0, Number(e.target.value)))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Lifestyle</h3>
          <div className="mb-4"><label className="block text-sm font-semibold text-gray-700 mb-2">Gambling Activity</label><div className="grid grid-cols-3 gap-3">{(['No', 'Low', 'High'] as const).map(val => (<button key={val} type="button" onClick={() => update('gambling', val)} className={`py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${form.gambling === val ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}>{val}</button>))}</div></div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300"><input type="checkbox" checked={form.hasInvestments} onChange={e => update('hasInvestments', e.target.checked)} className="w-5 h-5 accent-emerald-600" /><span className="font-semibold text-gray-800 text-sm">I have investments</span></label>
            <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300"><input type="checkbox" checked={form.hasMortgage} onChange={e => update('hasMortgage', e.target.checked)} className="w-5 h-5 accent-emerald-600" /><span className="font-semibold text-gray-800 text-sm">I have a mortgage</span></label>
          </div>
        </div>

        <button type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-lg shadow-lg shadow-emerald-200" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}><Save className="w-5 h-5" /> Save & Recalculate Score</button>
      </form>
    </div>
  );
}
