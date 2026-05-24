import { useState } from 'react';
import { useApp } from '../../Controllers/AppController';
import { Shield, TrendingUp, Users, Eye, EyeOff } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillTrendUp } from '@fortawesome/free-solid-svg-icons';

export default function LoginPage() {
  const { login, navigate } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setTimeout(() => {
      const err = login(email, password);
      if (err) setError(err);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0B1D0F 0%, #1B4332 40%, #2D6A4F 100%)' }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #52B788, #95D5B2)' }}>
              <FontAwesomeIcon icon={faMoneyBillTrendUp} className="w-8 h-8 text-[#0B1D0F]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sechaba Score</h1>
              <p className="text-emerald-300 text-sm">Smart Credit Tracking</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Take Control of Your <span className="text-emerald-300">Financial Future</span>
          </h2>
          <p className="text-emerald-200 text-lg mb-10 leading-relaxed">
            AI-powered credit score predictions, expense tracking, and community-driven financial accountability — all in one place.
          </p>
          <div className="space-y-5">
            {[
              { icon: TrendingUp, text: 'ML-powered credit score forecasting' },
              { icon: Shield, text: 'Fraud & scam detection for your messages' },
              { icon: Users, text: 'Score Circles for group financial goals' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-800/50 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-emerald-300" />
                </div>
                <span className="text-emerald-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #52B788, #95D5B2)' }}>
              <FontAwesomeIcon icon={faMoneyBillTrendUp} className="w-6 h-6 text-[#0B1D0F]" />
            </div>
            <h1 className="text-2xl font-bold text-white">Sechaba Score</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500 mb-8">Sign in to access your dashboard</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-gray-900"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors text-gray-900 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('register')}
                  className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
