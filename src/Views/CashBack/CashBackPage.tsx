import { Gift, CreditCard, Store, Percent } from 'lucide-react';

const placeholderRewards = [
  { merchant: 'Takealot', percent: '5%', category: 'Shopping', icon: '🛒' },
  { merchant: 'Uber Eats', percent: '3%', category: 'Food', icon: '🍔' },
  { merchant: 'Engen', percent: '4%', category: 'Transportation', icon: '⛽' },
  { merchant: 'Showmax', percent: '2%', category: 'Entertainment', icon: '🎬' },
  { merchant: 'Checkers', percent: '3%', category: 'Shopping', icon: '🏪' },
  { merchant: 'Spotify', percent: '2%', category: 'Entertainment', icon: '🎵' },
];

export default function CashBackPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3"><Gift className="w-8 h-8 text-amber-500" /> Cash Back Rewards</h1>
        <p className="text-gray-500 mt-1">Earn rewards on your everyday purchases</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl p-8 mb-8" style={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F, #40916C)' }}>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-400/20 rounded-full text-amber-300 text-sm font-semibold mb-4"><Gift className="w-4 h-4" /> Coming Soon</div>
          <h2 className="text-3xl font-bold text-white mb-3">Cash Back Rewards Integration</h2>
          <p className="text-emerald-200 max-w-lg text-lg">We're building partnerships with major South African retailers to bring you automatic cash back rewards on your everyday purchases — tracked right here in Byte-Sized Bandits.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2"><CreditCard className="w-5 h-5 text-emerald-300" /><span className="text-white text-sm">Auto-tracked</span></div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2"><Percent className="w-5 h-5 text-emerald-300" /><span className="text-white text-sm">Up to 5% back</span></div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2"><Store className="w-5 h-5 text-emerald-300" /><span className="text-white text-sm">100+ merchants</span></div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/10 rounded-full" />
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-400/10 rounded-full" />
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-4">Preview: Available Rewards</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {placeholderRewards.map((reward, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm opacity-75 relative overflow-hidden">
            <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">COMING SOON</div>
            <div className="flex items-center gap-3 mb-3"><div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl">{reward.icon}</div><div><h4 className="font-bold text-gray-900">{reward.merchant}</h4><p className="text-xs text-gray-500">{reward.category}</p></div></div>
            <div className="flex items-center justify-between"><span className="text-2xl font-bold text-emerald-600">{reward.percent}</span><span className="text-sm text-gray-400">Cash Back</span></div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Your Rewards Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl text-center"><p className="text-3xl font-bold text-gray-300">R0.00</p><p className="text-sm text-gray-400 mt-1">Total Earned</p></div>
          <div className="p-4 bg-gray-50 rounded-xl text-center"><p className="text-3xl font-bold text-gray-300">R0.00</p><p className="text-sm text-gray-400 mt-1">Pending</p></div>
          <div className="p-4 bg-gray-50 rounded-xl text-center"><p className="text-3xl font-bold text-gray-300">R0.00</p><p className="text-sm text-gray-400 mt-1">Redeemed</p></div>
        </div>
      </div>
    </div>
  );
}
