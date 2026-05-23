import { useState } from 'react';
import { useApp } from '../../Controllers/AppController';
import { formatRandsShort } from '../../Models';
import { Plus, Target, Trash2, X, ArrowUpCircle } from 'lucide-react';

export default function SavingsPage() {
  const { getUserSavingPlans, addSavingPlan, deleteSavingPlan, contributeToPlan } = useApp();
  const plans = getUserSavingPlans();
  const [showForm, setShowForm] = useState(false);
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [form, setForm] = useState({ name: '', goalAmount: '', currentAmount: '', monthlyContribution: '', deadline: '' });

  const resetForm = () => { setForm({ name: '', goalAmount: '', currentAmount: '', monthlyContribution: '', deadline: '' }); setShowForm(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.goalAmount) return;
    addSavingPlan({ name: form.name, goalAmount: parseFloat(form.goalAmount), currentAmount: parseFloat(form.currentAmount) || 0, monthlyContribution: parseFloat(form.monthlyContribution) || 0, deadline: form.deadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
    resetForm();
  };

  const handleContribute = (planId: string) => { if (!contributeAmount || parseFloat(contributeAmount) <= 0) return; contributeToPlan(planId, parseFloat(contributeAmount)); setContributeId(null); setContributeAmount(''); };

  const totalGoal = plans.reduce((s, p) => s + p.goalAmount, 0);
  const totalSaved = plans.reduce((s, p) => s + p.currentAmount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div><h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Saving Plans</h1><p className="text-gray-500 mt-1">Set goals and track your monthly savings</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg shadow-emerald-200" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}><Plus className="w-4 h-4" /> New Plan</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><p className="text-sm font-semibold text-gray-500">Total Goal</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatRandsShort(totalGoal)}</p></div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><p className="text-sm font-semibold text-gray-500">Total Saved</p><p className="text-2xl font-bold text-emerald-600 mt-1">{formatRandsShort(totalSaved)}</p></div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><p className="text-sm font-semibold text-gray-500">Remaining</p><p className="text-2xl font-bold text-amber-600 mt-1">{formatRandsShort(Math.max(0, totalGoal - totalSaved))}</p></div>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center text-gray-400"><Target className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-lg font-medium">No saving plans yet</p><p className="text-sm mt-1">Create a plan to start tracking your savings goals</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => {
            const progress = plan.goalAmount > 0 ? Math.min(100, (plan.currentAmount / plan.goalAmount) * 100) : 0;
            const monthsLeft = plan.monthlyContribution > 0 ? Math.ceil(Math.max(0, plan.goalAmount - plan.currentAmount) / plan.monthlyContribution) : null;
            return (
              <div key={plan.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg">🎯</div><div><h4 className="font-bold text-gray-900 text-sm">{plan.name}</h4><p className="text-xs text-gray-400">Due: {new Date(plan.deadline).toLocaleDateString('en-ZA')}</p></div></div>
                  <button onClick={() => deleteSavingPlan(plan.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">R{plan.currentAmount.toLocaleString('en-ZA')}</span><span className="font-semibold text-gray-900">R{plan.goalAmount.toLocaleString('en-ZA')}</span></div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: progress >= 100 ? '#22C55E' : 'linear-gradient(90deg, #2D6A4F, #52B788)' }} /></div>
                  <div className="flex justify-between mt-1"><span className="text-xs text-gray-400">{progress.toFixed(0)}% complete</span>{monthsLeft !== null && progress < 100 && (<span className="text-xs text-emerald-600">~{monthsLeft} mo left</span>)}</div>
                </div>
                {plan.monthlyContribution > 0 && (<p className="text-xs text-gray-500 mb-3">Monthly contribution: <span className="font-semibold text-gray-700">R{plan.monthlyContribution.toLocaleString('en-ZA')}</span></p>)}
                {contributeId === plan.id ? (
                  <div className="flex gap-2"><input type="number" step="0.01" min="0.01" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-gray-900" placeholder="Amount" autoFocus /><button onClick={() => handleContribute(plan.id)} className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: '#2D6A4F' }}>Add</button><button onClick={() => setContributeId(null)} className="px-3 py-2 text-gray-400 text-sm">✕</button></div>
                ) : (
                  <button onClick={() => setContributeId(plan.id)} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition-colors"><ArrowUpCircle className="w-4 h-4" /> Add Contribution</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-gray-900">New Saving Plan</h3><button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Plan Name</label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" placeholder="e.g., Emergency Fund, Vacation" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Goal Amount (R)</label><input type="number" step="1" min="1" value={form.goalAmount} onChange={e => setForm(f => ({ ...f, goalAmount: e.target.value }))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" required /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Already Saved (R)</label><input type="number" step="1" min="0" value={form.currentAmount} onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Monthly Contribution (R)</label><input type="number" step="1" min="0" value={form.monthlyContribution} onChange={e => setForm(f => ({ ...f, monthlyContribution: e.target.value }))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" placeholder="How much per month?" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Deadline</label><input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={resetForm} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold">Cancel</button><button type="submit" className="flex-1 py-2.5 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>Create Plan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
