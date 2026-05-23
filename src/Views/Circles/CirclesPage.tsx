import { useState } from 'react';
import { useApp } from '../../Controllers/AppController';
import { Plus, Users, Copy, ArrowRight, X, UserPlus } from 'lucide-react';

export default function CirclesPage() {
  const { getUserCircles, createCircle, joinCircle, navigate, getCircleMembers, getUserNudges, markNudgeRead } = useApp();
  const circles = getUserCircles();
  const nudges = getUserNudges().filter(n => !n.read);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); if (!name) return; createCircle(name, desc); setName(''); setDesc(''); setShowCreate(false); };
  const handleJoin = (e: React.FormEvent) => { e.preventDefault(); if (!inviteCode) return; const err = joinCircle(inviteCode); if (err) setError(err); else { setInviteCode(''); setShowJoin(false); setError(''); } };
  const copyCode = (code: string) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 2000); };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div><h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Score Circles</h1><p className="text-gray-500 mt-1">Community-driven financial accountability</p></div>
        <div className="flex gap-3">
          <button onClick={() => setShowJoin(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"><UserPlus className="w-4 h-4" /> Join Circle</button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg shadow-emerald-200" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}><Plus className="w-4 h-4" /> Create Circle</button>
        </div>
      </div>

      {nudges.length > 0 && (
        <div className="mb-6 space-y-2">
          {nudges.map(n => (
            <div key={n.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 font-semibold">N</span>
              <div className="flex-1"><p className="text-sm font-medium text-amber-800">{n.message}</p><p className="text-xs text-amber-600">{new Date(n.createdAt).toLocaleDateString('en-ZA')}</p></div>
              <button onClick={() => markNudgeRead(n.id)} className="text-amber-500 hover:text-amber-700 text-sm font-semibold">Dismiss</button>
            </div>
          ))}
        </div>
      )}

      {circles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Circles Yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">Create a Score Circle or join one with an invite code to start tracking financial goals together.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowJoin(true)} className="px-5 py-2.5 rounded-xl border-2 border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50">Join Circle</button>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>Create Circle</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {circles.map(circle => {
            const members = getCircleMembers(circle.id);
            const goalProgress = circle.goals.length > 0 ? circle.goals.reduce((s, g) => s + (g.currentAmount / g.targetAmount), 0) / circle.goals.length * 100 : 0;
            const healthScore = Math.min(100, Math.round(goalProgress));
            return (
              <div key={circle.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('circle-detail', circle.id)}>
                <div className="flex items-start justify-between mb-4">
                  <div><h4 className="font-bold text-gray-900">{circle.name}</h4><p className="text-xs text-gray-500 mt-0.5">{circle.description || 'No description'}</p></div>
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90"><circle cx="24" cy="24" r="20" fill="none" stroke="#F3F4F6" strokeWidth="4" /><circle cx="24" cy="24" r="20" fill="none" stroke={healthScore >= 70 ? '#22C55E' : healthScore >= 40 ? '#F59E0B' : '#EF4444'} strokeWidth="4" strokeDasharray={`${(healthScore / 100) * 125.6} 125.6`} strokeLinecap="round" /></svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600">{healthScore}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-2">{members.slice(0, 4).map(m => (<div key={m.id} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: m.avatarColor }}>{m.fullName.charAt(0)}</div>))}{members.length > 4 && (<div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">+{members.length - 4}</div>)}</div>
                  <span className="text-xs text-gray-500">{members.length} member(s)</span>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={e => { e.stopPropagation(); copyCode(circle.inviteCode); }} className="flex items-center gap-1 text-xs text-emerald-600 font-mono bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors"><Copy className="w-3 h-3" />{copied === circle.inviteCode ? 'Copied!' : circle.inviteCode}</button>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-gray-900">Create Score Circle</h3><button onClick={() => setShowCreate(false)} className="p-1 text-gray-400"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Circle Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" placeholder="e.g., Family Finance, Business Partners" required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Description (optional)</label><textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900 h-20 resize-none" placeholder="What's this circle about?" /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold">Cancel</button><button type="submit" className="flex-1 py-2.5 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>Create</button></div>
            </form>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-gray-900">Join Score Circle</h3><button onClick={() => { setShowJoin(false); setError(''); }} className="p-1 text-gray-400"><X className="w-5 h-5" /></button></div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleJoin} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Invite Code</label><input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900 font-mono text-center text-lg tracking-widest" placeholder="XXXXXX" maxLength={6} required /></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => { setShowJoin(false); setError(''); }} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold">Cancel</button><button type="submit" className="flex-1 py-2.5 rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>Join</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
