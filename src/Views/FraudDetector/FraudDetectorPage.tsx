import { useState } from 'react';
import { useApp } from '../../Controllers/AppController';
import { detectFraud } from '../../Services/MLService';
import { Shield, ShieldAlert, ShieldCheck, Send, MessageSquare } from 'lucide-react';

const SAMPLE_MESSAGES = [
  { label: '🎰 Lottery Scam', text: 'CONGRATULATIONS! You have been selected as a winner of R1,000,000! Click here to claim your prize immediately. Send R500 processing fee via EFT.' },
  { label: '🏦 Bank Phishing', text: 'URGENT: Your FNB account has been suspended due to unusual activity. Verify your identity immediately by clicking this link or your account will be permanently locked.' },
  { label: '✅ Legitimate Bank', text: 'Your monthly statement is ready. Log in to your account at our official website to view your transactions. If you have questions, call us at the number on your card.' },
  { label: '👤 Friend Message', text: 'Hey, are you coming to braai tonight? I was thinking we could meet at 6pm. Let me know!' },
  { label: '💻 Tech Support Scam', text: 'ALERT: Your computer has been compromised. Call Microsoft Support immediately at 012-XXX-XXXX. Our technicians will install TeamViewer to fix the issue. Do not ignore this warning!' },
  { label: '📦 Package Scam', text: 'Your parcel could not be delivered. Pay the R29.99 redelivery fee now using this link: bit.ly/xxxxx. Respond immediately to avoid return to sender.' },
];

export default function FraudDetectorPage() {
  const { currentUser, addFraudScan, getUserFraudScans } = useApp();
  const [inputText, setInputText] = useState('');
  const [scanning, setScanning] = useState(false);
  const scans = getUserFraudScans().sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());

  const handleScan = () => {
    if (!inputText.trim() || !currentUser) return;
    setScanning(true);
    setTimeout(() => { const result = detectFraud(inputText, currentUser.id); addFraudScan(result); setInputText(''); setScanning(false); }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3"><Shield className="w-8 h-8 text-emerald-600" /> Fraud & Scam Detector</h1>
        <p className="text-gray-500 mt-1">Paste any SMS or email message to check if it's a scam (Naive Bayes ML Model)</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Paste a suspicious message</label>
        <textarea value={inputText} onChange={e => setInputText(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-gray-900 h-32 resize-none text-sm" placeholder="Paste an SMS, email, or WhatsApp message here..." />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3">
          <div className="flex flex-wrap gap-2">{SAMPLE_MESSAGES.map((sample, i) => (<button key={i} onClick={() => setInputText(sample.text)} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium">{sample.label}</button>))}</div>
          <button onClick={handleScan} disabled={!inputText.trim() || scanning} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white disabled:opacity-50 transition-all whitespace-nowrap" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>
            {scanning ? (<><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Analyzing...</>) : (<><Send className="w-4 h-4" /> Scan Message</>)}
          </button>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-3">Scan History</h3>
      {scans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center text-gray-400"><MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">No scans yet</p><p className="text-sm mt-1">Paste a message above to check if it's a scam</p></div>
      ) : (
        <div className="space-y-3">{scans.map(scan => (
          <div key={scan.id} className={`bg-white rounded-2xl p-5 border shadow-sm ${scan.result === 'Scam' ? 'border-red-200' : 'border-green-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${scan.result === 'Scam' ? 'bg-red-50' : 'bg-green-50'}`}>{scan.result === 'Scam' ? <ShieldAlert className="w-6 h-6 text-red-500" /> : <ShieldCheck className="w-6 h-6 text-green-500" />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap"><span className={`text-sm font-bold ${scan.result === 'Scam' ? 'text-red-600' : 'text-green-600'}`}>{scan.result === 'Scam' ? '⚠️ SCAM DETECTED' : '✅ SAFE'}</span><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${scan.result === 'Scam' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{scan.confidence}% confidence</span></div>
                <p className="text-sm text-gray-700 mb-2 line-clamp-2">{scan.inputText}</p>
                {scan.keywords.length > 0 && (<div className="flex flex-wrap gap-1"><span className="text-xs text-gray-500">Flagged keywords:</span>{scan.keywords.slice(0, 8).map((kw, i) => (<span key={i} className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">{kw}</span>))}</div>)}
                <p className="text-xs text-gray-400 mt-2">{new Date(scan.scannedAt).toLocaleString('en-ZA')}</p>
              </div>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
