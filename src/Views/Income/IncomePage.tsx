import { useState } from 'react';
import { useApp } from '../../Controllers/AppController';
import type { IncomeEntry } from '../../Models';
import { formatRandsShort } from '../../Models';
import { Plus, Edit2, Trash2, X, DollarSign, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function IncomePage() {
  const { getUserIncomes, addIncome, updateIncome, deleteIncome, profile } = useApp();
  const incomes = getUserIncomes();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ amount: '', source: '', date: new Date().toISOString().split('T')[0], recurring: false });

  const resetForm = () => { setForm({ amount: '', source: '', date: new Date().toISOString().split('T')[0], recurring: false }); setEditingId(null); setShowForm(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.source) return;
    if (editingId) { updateIncome(editingId, { amount: parseFloat(form.amount), source: form.source, date: form.date, recurring: form.recurring }); }
    else { addIncome({ amount: parseFloat(form.amount), source: form.source, date: form.date, recurring: form.recurring }); }
    resetForm();
  };

  const handleEdit = (income: IncomeEntry) => { setForm({ amount: income.amount.toString(), source: income.source, date: income.date, recurring: income.recurring }); setEditingId(income.id); setShowForm(true); };

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const recurringIncome = incomes.filter(i => i.recurring).reduce((sum, i) => sum + i.amount, 0);
  const monthlyData: Record<string, number> = {};
  incomes.forEach(i => { const month = new Date(i.date).toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' }); monthlyData[month] = (monthlyData[month] || 0) + i.amount; });
  const chartData = Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));
  const sorted = [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div><h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Income</h1><p className="text-gray-500 mt-1">Track your earnings and income sources</p></div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg shadow-emerald-200" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}><Plus className="w-4 h-4" /> Add Income</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div><span className="text-sm font-semibold text-gray-500">Total Logged</span></div><p className="text-2xl font-bold text-gray-900">{formatRandsShort(totalIncome)}</p></div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><RefreshCw className="w-5 h-5 text-blue-600" /></div><span className="text-sm font-semibold text-gray-500">Recurring</span></div><p className="text-2xl font-bold text-gray-900">{formatRandsShort(recurringIncome)}</p></div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-purple-600" /></div><span className="text-sm font-semibold text-gray-500">Base Salary</span></div><p className="text-2xl font-bold text-gray-900">{formatRandsShort(profile?.monthlyIncome || 0)}/mo</p></div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">Monthly Income</h3>
          <ResponsiveContainer width="100%" height={200}><BarChart data={chartData}><XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" /><YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" /><Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} formatter={(value) => `R${Number(value).toFixed(2)}`} /><Bar dataKey="amount" fill="#2D6A4F" radius={[6, 6, 0, 0]} name="Income" /></BarChart></ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {sorted.length === 0 ? (<div className="p-12 text-center text-gray-400"><p className="text-lg font-medium">No income logged yet</p><p className="text-sm mt-1">Start tracking your income sources</p></div>) : (
          <div className="divide-y divide-gray-50">
            {sorted.map(income => (
              <div key={income.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{income.source}</p><p className="text-xs text-gray-500">{new Date(income.date).toLocaleDateString('en-ZA')}{income.recurring && <span className="ml-2 text-blue-500 font-medium"><RefreshCw className="inline-block w-3 h-3 align-text-bottom" /> Recurring</span>}</p></div>
                <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">+R{income.amount.toFixed(2)}</span>
                <div className="flex gap-1"><button onClick={() => handleEdit(income)} className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50"><Edit2 className="w-4 h-4" /></button><button onClick={() => deleteIncome(income.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Income' : 'Add Income'}</h3><button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Amount (R)</label><input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Source</label><input type="text" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" placeholder="e.g., Salary, Freelance, Dividends" required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
              <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-emerald-300"><input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} className="w-5 h-5 accent-emerald-600 rounded" /><div><span className="font-semibold text-gray-800 text-sm">Recurring Income</span><p className="text-xs text-gray-500">This income repeats monthly</p></div></label>
              <div className="flex gap-3 pt-2"><button type="button" onClick={resetForm} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold">Cancel</button><button type="submit" className="flex-1 py-2.5 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>{editingId ? 'Save Changes' : 'Add Income'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
