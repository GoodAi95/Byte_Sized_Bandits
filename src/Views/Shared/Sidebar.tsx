import { useApp } from '../../Controllers/AppController';
import type { AppPage } from '../../Models';
import {
  LayoutDashboard, CreditCard, DollarSign, PiggyBank, Users,
  Shield, Gift, LogOut, TrendingUp, Bell, Menu, X, Settings
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS: { page: AppPage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'expenses', label: 'Expenses', icon: CreditCard },
  { page: 'income', label: 'Income', icon: DollarSign },
  { page: 'savings', label: 'Saving Plans', icon: PiggyBank },
  { page: 'circles', label: 'Score Circles', icon: Users },
  { page: 'fraud-detector', label: 'Fraud Detector', icon: Shield },
  { page: 'cashback', label: 'Cash Back', icon: Gift },
  { page: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { currentUser, currentPage, navigate, logout, getUserNudges } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadNudges = getUserNudges().filter(n => !n.read).length;

  const handleNav = (page: AppPage) => { navigate(page); setMobileOpen(false); };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-emerald-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #52B788, #95D5B2)' }}>
            <TrendingUp className="w-5 h-5 text-[#0B1D0F]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Sechaba Score</h1>
            <p className="text-[10px] text-emerald-400 uppercase tracking-widest">Credit Score Tracker</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = currentPage === item.page;
          return (
            <button key={item.page} onClick={() => handleNav(item.page)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/30' : 'text-emerald-300/70 hover:bg-emerald-800/30 hover:text-emerald-200'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {item.page === 'circles' && unreadNudges > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{unreadNudges}</span>
              )}
              {item.page === 'cashback' && (
                <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">Soon</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-emerald-800/50 pt-4">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: currentUser?.avatarColor || '#2D6A4F' }}>
            {currentUser?.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-100 truncate">{currentUser?.fullName}</p>
            <p className="text-xs text-emerald-400/70 truncate">{currentUser?.email}</p>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-900/20 transition-colors font-medium">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl text-white" style={{ background: '#1B4332' }}>
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {unreadNudges > 0 && (
        <button onClick={() => handleNav('circles')}
          className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-xl text-white relative" style={{ background: '#1B4332' }}>
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadNudges}</span>
        </button>
      )}

      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex-shrink-0 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #0B1D0F 0%, #1B4332 100%)' }}>
        {sidebarContent}
      </aside>
    </>
  );
}
