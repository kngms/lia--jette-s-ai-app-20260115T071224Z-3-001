
import React, { useState, useEffect } from 'react';
import { FeedbackEntry } from '../types';
import { MessageSquarePlus, Send, Bug, Sparkles, Layout, Trash2 } from 'lucide-react';

const FeedbackPortal: React.FC = () => {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<FeedbackEntry['type']>('ui');

  useEffect(() => {
    const saved = localStorage.getItem('appFeedback');
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  const handleSubmit = () => {
    if (!description.trim()) return;
    const newEntry: FeedbackEntry = {
      id: Date.now().toString(),
      type,
      description,
      createdAt: Date.now()
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem('appFeedback', JSON.stringify(updated));
    setDescription('');
    alert('Thank you! Your feedback has been saved locally.');
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem('appFeedback', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-start gap-4 mb-8">
          <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
            <MessageSquarePlus size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Beta Feedback Portal</h3>
            <p className="text-sm text-slate-500 mt-1">
              Help us improve the UI, report bugs, or request new persona archetypes.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            {(['ui', 'bug', 'feature'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  type === t 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200'
                }`}
              >
                {t === 'bug' && <Bug size={14} />}
                {t === 'feature' && <Sparkles size={14} />}
                {t === 'ui' && <Layout size={14} />}
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue or requested feature..."
            className="w-full min-h-[120px] bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 text-sm"
          />

          <button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition-all"
          >
            <Send size={18} />
            Submit Feedback
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Your Local Logs</h4>
        {entries.map(e => (
          <div key={e.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-start group">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  e.type === 'bug' ? 'bg-red-50 text-red-600' :
                  e.type === 'feature' ? 'bg-indigo-50 text-indigo-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {e.type}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(e.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-slate-700">{e.description}</p>
            </div>
            <button 
              onClick={() => deleteEntry(e.id)}
              className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeedbackPortal;
