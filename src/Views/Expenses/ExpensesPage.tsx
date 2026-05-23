import { useState } from 'react';
import { useApp } from '../../Controllers/AppController';
import type { ExpenseCategory, Expense } from '../../Models';
import { formatRandsShort } from '../../Models';
import { Plus, Edit2, Trash2, X, Search, Filter } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faCar, faUtensils, faLightbulb, faHospital, faFilm, faShoppingBag, faBookOpen, faWallet, faPiggyBank, faShieldHalved, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CATEGORIES: ExpenseCategory[] = ['Housing', 'Transportation', 'Food', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Debt Payment', 'Savings', 'Insurance', 'Other'];
const CATEGORY_COLORS: Record<string, string> = { Housing: '#2D6A4F', Transportation: '#40916C', Food: '#52B788', Utilities: '#74C69D', Healthcare: '#95D5B2', Entertainment: '#F59E0B', Shopping: '#EC4899', Education: '#8B5CF6', 'Debt Payment': '#EF4444', Savings: '#22C55E', Insurance: '#3B82F6', Other: '#6B7280' };
const CATEGORY_ICONS: Record<string, any> = { Housing: faHouse, Transportation: faCar, Food: faUtensils, Utilities: faLightbulb, Healthcare: faHospital, Entertainment: faFilm, Shopping: faShoppingBag, Education: faBookOpen, 'Debt Payment': faWallet, Savings: faPiggyBank, Insurance: faShieldHalved, Other: faEllipsisH };
const getCategoryInitials = (category: string) => category.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();

export default function ExpensesPage() {
  const { getUserExpenses, addExpense, updateExpense, deleteExpense } = useApp();
  const expenses = getUserExpenses();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [form, setForm] = useState({ amount: '', category: 'Food' as ExpenseCategory, description: '', date: new Date().toISOString().split('T')[0] });

  const resetForm = () => { setForm({ amount: '', category: 'Food', description: '', date: new Date().toISOString().split('T')[0] }); setEditingId(null); setShowForm(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    if (editingId) { updateExpense(editingId, { amount: parseFloat(form.amount), category: form.category, description: form.description, date: form.date }); }
    else { addExpense({ amount: parseFloat(form.amount), category: form.category, description: form.description, date: form.date }); }
    resetForm();
  };

  const handleEdit = (expense: Expense) => { setForm({ amount: expense.amount.toString(), category: expense.category, description: expense.description, date: expense.date }); setEditingId(expense.id); setShowForm(true); };

  const filtered = expenses.filter(e => filterCategory === 'All' || e.category === filterCategory).filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const categoryTotals = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<string, number>);
  const chartData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div><h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expenses</h1><p className="text-gray-500 mt-1">Track and categorize your spending</p></div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg shadow-emerald-200" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}><Plus className="w-4 h-4" /> Add Expense</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"><h3 className="text-sm font-semibold text-gray-500 mb-1">Total Expenses</h3><p className="text-3xl font-bold text-gray-900">{formatRandsShort(totalExpenses)}</p><p className="text-sm text-gray-400 mt-1">{expenses.length} transaction(s)</p></div>
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Spending Breakdown</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={chartData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2} dataKey="value">{chartData.map((entry, i) => (<Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#6B7280'} />))}</Pie><Tooltip formatter={(value) => `R${Number(value).toFixed(2)}`} /><Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} /></PieChart>
            </ResponsiveContainer>
          ) : (<div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">No expenses logged yet</div>)}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search expenses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm text-gray-900" /></div>
          <div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm bg-white text-gray-900 appearance-none"><option value="All">All Categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (<div className="p-12 text-center text-gray-400"><p className="text-lg font-medium">No expenses found</p><p className="text-sm mt-1">Start logging your expenses to track spending</p></div>) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(expense => (
              <div key={expense.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <span className="w-10 h-10 rounded-2xl bg-emerald-50 grid place-items-center text-emerald-600">
                  <FontAwesomeIcon icon={CATEGORY_ICONS[expense.category] ?? faEllipsisH} className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 truncate">{expense.description}</p><p className="text-xs text-gray-500">{expense.category} • {new Date(expense.date).toLocaleDateString('en-ZA')}</p></div>
                <span className="text-sm font-bold text-red-600 whitespace-nowrap">-R{expense.amount.toFixed(2)}</span>
                <div className="flex gap-1"><button onClick={() => handleEdit(expense)} className="p-2 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"><Edit2 className="w-4 h-4" /></button><button onClick={() => deleteExpense(expense.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Expense' : 'Add Expense'}</h3><button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Amount (R)</label><input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" placeholder="0.00" required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Category</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900 bg-white">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Description</label><input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" placeholder="What did you spend on?" required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={resetForm} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-gray-300">Cancel</button><button type="submit" className="flex-1 py-2.5 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>{editingId ? 'Save Changes' : 'Add Expense'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
