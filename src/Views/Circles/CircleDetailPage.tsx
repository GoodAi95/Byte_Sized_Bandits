import { useState } from 'react';
import { useApp } from '../../Controllers/AppController';
import { predictCreditScore } from '../../Services/MLService';
import { db, DbSets } from '../../Data/ApplicationDbContext';
import type { FinancialProfile, CircleGoal, CirclePost } from '../../Models';
import { ArrowLeft, MessageSquare, Target, Users, Send, Heart, Bell, Plus, X } from 'lucide-react';

export default function CircleDetailPage() {
  const { selectedCircleId, circles, circlePosts, currentUser, navigate, getCircleMembers, addCirclePost, likePost, sendNudge, addCircleGoal, contributeToCircleGoal } = useApp();
  const circle = circles.find(c => c.id === selectedCircleId);
  const [tab, setTab] = useState<'feed' | 'goals' | 'members'>('feed');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'win' | 'advice' | 'update'>('update');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [nudgeMsg, setNudgeMsg] = useState<Record<string, string>>({});

  if (!circle || !currentUser) return (<div className="p-8 text-center"><p className="text-gray-500">Circle not found</p><button onClick={() => navigate('circles')} className="mt-4 text-emerald-600 font-semibold">← Back to Circles</button></div>);

  const members = getCircleMembers(circle.id);
  const posts = circlePosts.filter(p => p.circleId === circle.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const profiles = db.get<FinancialProfile[]>(DbSets.PROFILES, []);
  const memberScores = members.map(m => { const profile = profiles.find(p => p.userId === m.id); if (!profile) return null; return predictCreditScore(profile).predictedScore; }).filter(Boolean) as number[];
  const avgScore = memberScores.length > 0 ? Math.round(memberScores.reduce((a, b) => a + b, 0) / memberScores.length) : 0;

  const handlePost = (e: React.FormEvent) => { e.preventDefault(); if (!postContent.trim()) return; addCirclePost(circle.id, postContent, postType); setPostContent(''); };
  const handleAddGoal = (e: React.FormEvent) => { e.preventDefault(); if (!goalTitle || !goalTarget) return; addCircleGoal(circle.id, goalTitle, parseFloat(goalTarget), goalDeadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); setGoalTitle(''); setGoalTarget(''); setGoalDeadline(''); setShowGoalForm(false); };
  const handleContributeGoal = (goalId: string) => { if (!contributeAmount || parseFloat(contributeAmount) <= 0) return; contributeToCircleGoal(circle.id, goalId, parseFloat(contributeAmount)); setContributeGoalId(null); setContributeAmount(''); };
  const handleNudge = (userId: string) => { const msg = nudgeMsg[userId] || 'Hey! Don\'t forget to log your expenses and check your score! 💪'; sendNudge(circle.id, userId, msg); setNudgeMsg(prev => ({ ...prev, [userId]: '' })); };

  const healthScore = circle.goals.length > 0 ? Math.round(circle.goals.reduce((s, g) => s + Math.min(100, (g.currentAmount / g.targetAmount) * 100), 0) / circle.goals.length) : (avgScore > 0 ? Math.round(((avgScore - 300) / 550) * 100) : 50);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <button onClick={() => navigate('circles')} className="flex items-center gap-2 text-emerald-600 font-semibold mb-4 hover:text-emerald-700"><ArrowLeft className="w-4 h-4" /> Back to Circles</button>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90"><circle cx="40" cy="40" r="34" fill="none" stroke="#F3F4F6" strokeWidth="6" /><circle cx="40" cy="40" r="34" fill="none" stroke={healthScore >= 70 ? '#22C55E' : healthScore >= 40 ? '#F59E0B' : '#EF4444'} strokeWidth="6" strokeDasharray={`${(healthScore / 100) * 213.6} 213.6`} strokeLinecap="round" /></svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-700">{healthScore}%</span>
          </div>
          <div className="flex-1"><h2 className="text-2xl font-bold text-gray-900">{circle.name}</h2><p className="text-gray-500 text-sm">{circle.description || 'Score Circle'}</p><div className="flex flex-wrap gap-4 mt-2"><span className="text-sm text-gray-600"><strong>{members.length}</strong> members</span>{avgScore > 0 && <span className="text-sm text-gray-600">Avg Score: <strong className="text-emerald-600">{avgScore}</strong></span>}<span className="text-sm text-gray-600"><strong>{circle.goals.length}</strong> goal(s)</span></div></div>
          <div className="text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg">Code: {circle.inviteCode}</div>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {([{ key: 'feed', label: 'Feed', icon: MessageSquare }, { key: 'goals', label: 'Goals', icon: Target }, { key: 'members', label: 'Members', icon: Users }] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><t.icon className="w-4 h-4" /> {t.label}</button>
        ))}
      </div>

      {tab === 'feed' && (
        <div>
          <form onSubmit={handlePost} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
            <div className="flex gap-3 mb-3">{(['update', 'win', 'advice'] as const).map(t => (<button key={t} type="button" onClick={() => setPostType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${postType === t ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{t === 'win' ? '🏆 Win' : t === 'advice' ? '💡 Advice' : '📢 Update'}</button>))}</div>
            <div className="flex gap-2"><input type="text" value={postContent} onChange={e => setPostContent(e.target.value)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-sm text-gray-900" placeholder="Share with your circle..." /><button type="submit" className="p-2.5 rounded-xl text-white" style={{ background: '#2D6A4F' }}><Send className="w-4 h-4" /></button></div>
          </form>
          {posts.length === 0 ? (<div className="text-center py-12 text-gray-400"><MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No posts yet. Be the first to share!</p></div>) : (
            <div className="space-y-3">{posts.map((post: CirclePost) => (
              <div key={post.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2"><div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">{post.userName.charAt(0)}</div><div><p className="text-sm font-semibold text-gray-900">{post.userName}</p><p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString('en-ZA')} • {post.type === 'win' ? '🏆' : post.type === 'advice' ? '💡' : '📢'} {post.type}</p></div></div>
                <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                <button onClick={() => likePost(post.id)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"><Heart className={`w-4 h-4 ${post.likes.includes(currentUser.id) ? 'fill-red-500 text-red-500' : ''}`} />{post.likes.length > 0 && post.likes.length}</button>
              </div>
            ))}</div>
          )}
        </div>
      )}

      {tab === 'goals' && (
        <div>
          <div className="flex justify-end mb-4"><button onClick={() => setShowGoalForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#2D6A4F' }}><Plus className="w-4 h-4" /> Add Goal</button></div>
          {circle.goals.length === 0 ? (<div className="text-center py-12 text-gray-400"><Target className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No circle goals yet</p></div>) : (
            <div className="space-y-3">{circle.goals.map((goal: CircleGoal) => {
              const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
              return (
                <div key={goal.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2"><h4 className="font-bold text-gray-900">{goal.title}</h4><span className="text-xs text-gray-500">Due: {new Date(goal.deadline).toLocaleDateString('en-ZA')}</span></div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">R{goal.currentAmount.toLocaleString('en-ZA')}</span><span className="font-semibold">R{goal.targetAmount.toLocaleString('en-ZA')}</span></div>
                  <div className="w-full h-3 bg-gray-100 rounded-full mb-2"><div className="h-full rounded-full" style={{ width: `${progress}%`, background: progress >= 100 ? '#22C55E' : 'linear-gradient(90deg, #2D6A4F, #52B788)' }} /></div>
                  <div className="flex items-center justify-between"><span className="text-xs text-gray-400">{progress.toFixed(0)}%</span>
                    {contributeGoalId === goal.id ? (<div className="flex gap-2"><input type="number" step="0.01" min="0.01" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} className="w-24 px-2 py-1 border rounded-lg text-xs text-gray-900" placeholder="R" autoFocus /><button onClick={() => handleContributeGoal(goal.id)} className="text-xs font-semibold text-emerald-600">Add</button><button onClick={() => setContributeGoalId(null)} className="text-xs text-gray-400">✕</button></div>) : (<button onClick={() => setContributeGoalId(goal.id)} className="text-xs text-emerald-600 font-semibold hover:underline">+ Contribute</button>)}
                  </div>
                </div>
              );
            })}</div>
          )}
          {showGoalForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-gray-900">Add Circle Goal</h3><button onClick={() => setShowGoalForm(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
                <form onSubmit={handleAddGoal} className="space-y-4">
                  <input type="text" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" placeholder="Goal title" required />
                  <input type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" placeholder="Target amount (R)" required />
                  <input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900" />
                  <button type="submit" className="w-full py-2.5 rounded-xl font-semibold text-white" style={{ background: '#2D6A4F' }}>Add Goal</button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-3">{members.map(member => {
          const memberProfile = profiles.find(p => p.userId === member.id);
          const memberScore = memberProfile ? predictCreditScore(memberProfile).predictedScore : null;
          const isCurrentUser = member.id === currentUser.id;
          return (
            <div key={member.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: member.avatarColor }}>{member.fullName.charAt(0)}</div>
                <div className="flex-1"><p className="text-sm font-semibold text-gray-900">{member.fullName} {isCurrentUser && <span className="text-xs text-emerald-500">(You)</span>}</p>{memberScore && (<p className="text-xs text-gray-500">Score: <span className="font-semibold text-emerald-600">{memberScore}</span></p>)}</div>
                {!isCurrentUser && (<div className="flex items-center gap-2"><input type="text" value={nudgeMsg[member.id] || ''} onChange={e => setNudgeMsg(prev => ({ ...prev, [member.id]: e.target.value }))} className="w-40 px-3 py-1.5 border rounded-lg text-xs hidden sm:block text-gray-900" placeholder="Send a nudge..." /><button onClick={() => handleNudge(member.id)} className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Send nudge"><Bell className="w-4 h-4" /></button></div>)}
              </div>
            </div>
          );
        })}</div>
      )}
    </div>
  );
}
