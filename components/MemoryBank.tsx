
import React, { useState, useEffect } from 'react';
import { MemoryItem } from '../types';
import { Brain, Plus, Trash2, ShieldCheck, Info } from 'lucide-react';

const MemoryBank: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  // Pre-filled example
  const [newMemory, setNewMemory] = useState('Ich mag keine Pilze im Essen 🍄');
  const [category, setCategory] = useState<MemoryItem['category']>('personal');

  useEffect(() => {
    const saved = localStorage.getItem('userMemory');
    if (saved) setMemories(JSON.parse(saved));
  }, []);

  const addMemory = () => {
    if (!newMemory.trim()) return;
    const item: MemoryItem = {
      id: Date.now().toString(),
      text: newMemory,
      category,
      createdAt: Date.now()
    };
    const updated = [item, ...memories];
    setMemories(updated);
    localStorage.setItem('userMemory', JSON.stringify(updated));
    setNewMemory('');
  };

  const deleteMemory = (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    localStorage.setItem('userMemory', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-start gap-4 mb-8">
          <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">AI Memory Bank</h3>
            <p className="text-sm text-slate-500 mt-1">
              Store facts about your preferences, work style, or life. Lia's AI will automatically remember these for every task.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="md:w-40 bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
            >
              <option value="personal">Personal</option>
              <option value="style">Style</option>
              <option value="professional">Professional</option>
            </select>
            <input
              type="text"
              placeholder="e.g., I prefer British English spelling..."
              className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 text-sm"
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMemory()}
            />
            <button
              onClick={addMemory}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium">
            <ShieldCheck size={14} />
            Data is stored locally in your browser and never shared with 3rd parties.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memories.map((m) => (
          <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-start group hover:border-indigo-200 transition-colors">
            <div className="space-y-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                m.category === 'personal' ? 'bg-purple-50 text-purple-600' :
                m.category === 'style' ? 'bg-amber-50 text-amber-600' :
                'bg-emerald-50 text-emerald-600'
              }`}>
                {m.category}
              </span>
              <p className="text-sm text-slate-700 pr-4">{m.text}</p>
            </div>
            <button 
              onClick={() => deleteMemory(m.id)}
              className="text-slate-300 hover:text-red-500 transition-colors p-1"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {memories.length === 0 && (
          <div className="md:col-span-2 py-12 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
            <Info size={32} className="mb-2" />
            <p className="text-sm font-medium">No memories stored yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryBank;
