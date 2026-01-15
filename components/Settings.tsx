
import React, { useState, useEffect } from 'react';
import { AppSettings, Persona, FeedbackEntry } from '../types';
import { Settings as SettingsIcon, Save, TrainFront, Mail, Users, Plus, Trash2, Palette, MessageSquarePlus, Bug, Sparkles, Layout, Send, Key, Brain, Check, Edit2, Zap } from 'lucide-react';
import { getSettings } from '../services/gemini';
import MemoryBank from './MemoryBank';
import PromptStudio from './PromptStudio';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'memory'>('settings');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [usageHistory, setUsageHistory] = useState<any>({});
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  
  // Feedback State
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackEntry['type']>('ui');

  useEffect(() => {
    const load = () => {
      const current = getSettings();
      if (!current.apiKeys) current.apiKeys = {};
      setSettings(current);
    };
    load();
    
    const usage = localStorage.getItem('usageHistory');
    if (usage) setUsageHistory(JSON.parse(usage));

    const savedFeedback = localStorage.getItem('appFeedback');
    if (savedFeedback) setFeedbackEntries(JSON.parse(savedFeedback));
  }, []);

  const handleSave = () => {
    if (!settings) return;
    localStorage.setItem('appSettings', JSON.stringify(settings));
    // Visual feedback could be added here (toast), for now alert is minimal or removed for seamlessness if using Enter
    // alert('Settings saved.'); 
  };

  const updatePersona = (p: Persona) => {
    if (!settings) return;
    const updated = settings.podcastConfig.personas.map(existing => existing.id === p.id ? p : existing);
    const newSettings = { ...settings, podcastConfig: { ...settings.podcastConfig, personas: updated } };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    setEditingPersona(null);
  };

  const addPersona = () => {
    if (!settings) return;
    if (settings.podcastConfig.personas.length >= 10) return;
    
    const newPersona: Persona = {
      id: Date.now().toString(),
      name: 'New Persona',
      age: '30',
      voice: 'Kore',
      interests: 'General',
      hobbies: '-',
      family: '-',
      socialStatus: 'Assistant',
      strengths: 'Helpful',
      avatarColor: 'bg-slate-500',
      personalityTraits: 'Neutral',
      communicationStyle: 'Clear',
      expertise: 'General'
    };
    
    const newSettings = { ...settings, podcastConfig: { ...settings.podcastConfig, personas: [...settings.podcastConfig.personas, newPersona] } };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    setEditingPersona(newPersona);
  };

  const deletePersona = (id: string) => {
    if (!settings || !window.confirm("Delete persona?")) return;
    const updated = settings.podcastConfig.personas.filter(p => p.id !== id);
    const updatedActive = settings.podcastConfig.activePersonaIds.filter(pid => pid !== id);
    const newSettings = {
      ...settings,
      podcastConfig: { ...settings.podcastConfig, personas: updated, activePersonaIds: updatedActive }
    };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };

  const togglePersonaActive = (id: string) => {
    if (!settings) return;
    const isActive = settings.podcastConfig.activePersonaIds.includes(id);
    let newActive = [];
    
    if (isActive) {
      newActive = settings.podcastConfig.activePersonaIds.filter(pid => pid !== id);
    } else {
      if (settings.podcastConfig.activePersonaIds.length >= 5) return;
      newActive = [...settings.podcastConfig.activePersonaIds, id];
    }
    const newSettings = { ...settings, podcastConfig: { ...settings.podcastConfig, activePersonaIds: newActive } };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };

  const submitFeedback = () => {
    if (!feedbackDesc.trim()) return;
    const newEntry: FeedbackEntry = {
      id: Date.now().toString(),
      type: feedbackType,
      description: feedbackDesc,
      createdAt: Date.now()
    };
    const updated = [newEntry, ...feedbackEntries];
    setFeedbackEntries(updated);
    localStorage.setItem('appFeedback', JSON.stringify(updated));
    setFeedbackDesc('');
  };

  const colors = [
    'bg-slate-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 
    'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 
    'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 
    'bg-pink-500', 'bg-rose-500'
  ];

  if (!settings) return <div className="p-8 flex justify-center"><div className="animate-spin w-6 h-6 border-2 border-indigo-600 rounded-full border-t-transparent"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h3 className="text-2xl font-bold text-slate-800">System Control</h3>
            <p className="text-sm text-slate-500">Configure global preferences and AI behavior.</p>
         </div>

         <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex">
             <button 
               onClick={() => setActiveTab('settings')}
               className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               <SettingsIcon size={16} /> Settings
             </button>
             <button 
               onClick={() => setActiveTab('memory')}
               className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'memory' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               <Brain size={16} /> Memory & Prompts
             </button>
         </div>
      </div>

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-left-4">
            
            {/* Left Column: Config & Feedback */}
            <div className="space-y-6 lg:col-span-1">
                {/* General Config */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" /> Configuration
                        </h4>
                        <button onClick={handleSave} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full transition-colors" title="Save">
                            <Save size={18} />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">OpenAI API Key</label>
                            <div className="relative">
                                <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="password"
                                    value={settings.apiKeys?.openai || ''} 
                                    onChange={e => setSettings({...settings, apiKeys: {...settings.apiKeys, openai: e.target.value}})}
                                    onBlur={handleSave}
                                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                                    className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500" 
                                    placeholder="sk-..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">User Email</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="email" 
                                    value={settings.emailConfig.userEmail} 
                                    onChange={e => setSettings({...settings, emailConfig: {...settings.emailConfig, userEmail: e.target.value}})}
                                    onBlur={handleSave}
                                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                                    className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500" 
                                    placeholder="user@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Train Scout Route</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <TrainFront size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        value={settings.trainConfig.origin} 
                                        onChange={e => setSettings({...settings, trainConfig: {...settings.trainConfig, origin: e.target.value}})}
                                        onBlur={handleSave}
                                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                                        className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500" 
                                        placeholder="Start"
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <TrainFront size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        value={settings.trainConfig.destination} 
                                        onChange={e => setSettings({...settings, trainConfig: {...settings.trainConfig, destination: e.target.value}})}
                                        onBlur={handleSave}
                                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                                        className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500" 
                                        placeholder="Dest"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feedback */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                       <MessageSquarePlus size={16} className="text-emerald-600" /> Feedback
                    </h4>
                    <div className="flex gap-2 mb-3">
                        {(['ui', 'bug', 'feature'] as const).map(t => (
                        <button key={t} onClick={() => setFeedbackType(t)} className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${feedbackType === t ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200'}`}>
                            {t === 'bug' && <Bug size={10} />}
                            {t === 'feature' && <Sparkles size={10} />}
                            {t === 'ui' && <Layout size={10} />}
                            {t.toUpperCase()}
                        </button>
                        ))}
                    </div>
                    <div className="relative">
                         <input 
                            value={feedbackDesc} 
                            onChange={e => setFeedbackDesc(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && submitFeedback()}
                            placeholder="Type feedback & press Enter..." 
                            className="w-full bg-slate-50 border-none rounded-xl pl-4 pr-10 py-3 text-xs focus:ring-2 focus:ring-emerald-500" 
                         />
                         <button onClick={submitFeedback} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"><Send size={14}/></button>
                    </div>
                    <div className="mt-4 space-y-2 max-h-[150px] overflow-y-auto pr-1">
                        {feedbackEntries.map(e => (
                            <div key={e.id} className="flex justify-between items-start text-[10px] bg-slate-50 p-2 rounded-lg text-slate-600">
                                <span>{e.description}</span>
                                <span className={`uppercase font-bold text-[8px] px-1.5 py-0.5 rounded ${e.type === 'bug' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{e.type}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Persona Management */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Users size={18} className="text-purple-600" />
                      Crew Management
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Manage active personas for podcast generation.</p>
                  </div>
                  <button onClick={addPersona} className="bg-purple-100 text-purple-700 hover:bg-purple-200 p-2 rounded-xl transition-colors">
                      <Plus size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[600px] pr-2">
                  {settings.podcastConfig.personas.map(p => {
                    const isActive = settings.podcastConfig.activePersonaIds.includes(p.id);
                    return (
                      <div key={p.id} className={`border rounded-2xl p-4 flex gap-4 transition-all ${isActive ? 'border-purple-500 bg-purple-50/50' : 'border-slate-200 bg-white hover:border-purple-200'}`}>
                          <div className={`w-12 h-12 rounded-2xl ${p.avatarColor} flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                            {p.name.charAt(0)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h5 className="font-bold text-slate-800 text-sm truncate">{p.name}</h5>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{p.voice} • {p.socialStatus}</p>
                                </div>
                                <input 
                                  type="checkbox" 
                                  checked={isActive} 
                                  onChange={() => togglePersonaActive(p.id)} 
                                  className="w-4 h-4 accent-purple-600 cursor-pointer" 
                                />
                            </div>
                            <p className="text-xs text-slate-600 mt-2 line-clamp-2">{p.personalityTraits}</p>
                            
                            <div className="flex gap-2 mt-3 justify-end">
                                <button onClick={() => setEditingPersona(p)} className="text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={14} /></button>
                                <button onClick={() => deletePersona(p.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </div>
                      </div>
                    );
                  })}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'memory' && (
         <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
             <MemoryBank />
             <div className="border-t-2 border-dashed border-slate-200/50"></div>
             <PromptStudio />
         </div>
      )}

      {/* Persona Editor Modal */}
      {editingPersona && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Edit Persona</h3>
                <button onClick={() => setEditingPersona(null)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><Trash2 size={18} className="text-slate-400" /></button>
              </div>
              
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Name</label>
                        <input value={editingPersona.name} onChange={e => setEditingPersona({...editingPersona, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm font-bold" />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Role</label>
                        <input value={editingPersona.socialStatus} onChange={e => setEditingPersona({...editingPersona, socialStatus: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Voice</label>
                        <select value={editingPersona.voice} onChange={e => setEditingPersona({...editingPersona, voice: e.target.value as any})} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm">
                            {['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Style</label>
                        <select value={editingPersona.communicationStyle} onChange={e => setEditingPersona({...editingPersona, communicationStyle: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm">
                            <option value="Formal">Formal</option>
                            <option value="Casual">Casual</option>
                            <option value="Empathetic">Empathetic</option>
                            <option value="Direct">Direct</option>
                        </select>
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Traits</label>
                    <input value={editingPersona.personalityTraits} onChange={e => setEditingPersona({...editingPersona, personalityTraits: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-sm" placeholder="e.g. Calm, Analytical" />
                 </div>

                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Avatar Color</label>
                    <div className="flex gap-2 flex-wrap">
                        {colors.map(color => (
                        <button 
                            key={color} 
                            onClick={() => setEditingPersona({...editingPersona, avatarColor: color})} 
                            className={`w-6 h-6 rounded-full ${color} transition-all flex items-center justify-center ${editingPersona.avatarColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-70 hover:opacity-100'}`}
                        >
                            {editingPersona.avatarColor === color && <Check size={12} className="text-white"/>}
                        </button>
                        ))}
                    </div>
                 </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                  <button onClick={() => updatePersona(editingPersona)} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">Save Changes</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
