
import React, { useState, useEffect } from 'react';
import { CustomPrompt, Persona, PromptExample } from '../types';
import { runCustomPrompt, generatePromptName, getSettings } from '../services/gemini';
import { Plus, Trash2, Play, Cpu, X, Loader2, Copy, Sparkles, Wand2, User, Filter, AlertCircle, Quote, Layers, Zap, Brain, Download, SortAsc, FileJson, FileText, ChevronDown } from 'lucide-react';

const PromptStudio: React.FC = () => {
  const [prompts, setPrompts] = useState<CustomPrompt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activePrompt, setActivePrompt] = useState<CustomPrompt | null>(null);
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availablePersonas, setAvailablePersonas] = useState<Persona[]>([]);
  
  // Filtering & Sorting State
  const [filterType, setFilterType] = useState<'category' | 'model' | 'persona' | 'tag' | 'persona_assoc'>('category');
  const [filterValue, setFilterValue] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'category'>('date');
  
  // Export Menu State
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Form states
  const [name, setName] = useState('Meeting Zusammenfasser');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [model, setModel] = useState<CustomPrompt['model']>('gemini-3-flash-preview');
  const [system, setSystem] = useState('Du bist ein effizienter Sekretär. Fasse Texte kurz und prägnant zusammen.');
  const [template, setTemplate] = useState('Erstelle eine Zusammenfassung der folgenden Notizen: {{input}}');
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [examples, setExamples] = useState<PromptExample[]>([{input: "Meeting Notizen...", output: "Zusammenfassung..."}]);
  const [tags, setTags] = useState<string[]>(['productivity', 'summary']);
  const [currentTag, setCurrentTag] = useState('');
  const [generatingName, setGeneratingName] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('customPrompts');
    let loadedPrompts: CustomPrompt[] = saved ? JSON.parse(saved) : [];
    
    // Initialize Jette's specific prompts if not present
    const jettePrompts: CustomPrompt[] = [
        {
            id: 'email-validator-1',
            name: 'Email Address Validator',
            category: 'Utility',
            model: 'gemini-3-pro-preview',
            systemInstruction: 'You are an AI assistant that validates email addresses. Return true if the email is valid, false otherwise. Do not include any explanation.',
            template: 'Is this email valid: {{input}}?',
            tags: ['validation', 'email', 'utility'],
            createdAt: Date.now(),
            examples: [{input: "user@example.com", output: "true"}, {input: "invalid-email", output: "false"}]
        },
        {
            id: 'dyslexia-helper-1',
            name: 'Dyslexia Text Helper',
            category: 'Writing Assistance',
            model: 'gemini-3-pro-preview',
            systemInstruction: 'You are an AI assistant specializing in helping users with dyslexia. Rephrase the provided text to improve readability by adjusting sentence structure, simplifying vocabulary, and ensuring clear spacing. Offer synonyms where appropriate, focusing on clarity and ease of understanding. Maintain a supportive and encouraging tone.',
            template: 'Please help me improve this text for better readability: {{input}}',
            tags: ['accessibility', 'writing', 'dyslexia'],
            createdAt: Date.now(),
            examples: [{input: "The project managment  systm is to complex and i cant find the files needed for the meeting tomorow.", output: "The project management system is a bit complex. I am having trouble finding the files I need for tomorrow's meeting."}]
        },
        {
            id: 'jette-1',
            name: 'Queer Awareness Briefing',
            category: 'Coordination',
            model: 'gemini-3-pro-preview',
            systemInstruction: 'Du bist Expertin für Diversity & Inclusion im queeren Kontext. Erstelle Briefings für externe Partner (z.B. Security, Catering). Tonfall: Professionell, bestimmt, aber edukativ.',
            template: 'Erstelle ein Awareness-Briefing für: {{input}}. Enthalte: Do\'s & Don\'ts, Pronomen-Nutzung, Umgang mit Diskriminierung.',
            tags: ['awareness', 'orga', 'extern'],
            createdAt: Date.now(),
            examples: [{input: "Sicherheitsdienst für Karaoke-Abend", output: "Briefing Dokument..."}]
        },
        // ... (Other Jette prompts retained)
    ];

    // Merge defaults if missing
    const missingJettePrompts = jettePrompts.filter(jp => !loadedPrompts.some(lp => lp.id === jp.id));
    
    if (missingJettePrompts.length > 0) {
        loadedPrompts = [...loadedPrompts, ...missingJettePrompts];
        localStorage.setItem('customPrompts', JSON.stringify(loadedPrompts));
    }
    
    setPrompts(loadedPrompts);
    
    const settings = getSettings();
    if (settings && settings.podcastConfig) {
      setAvailablePersonas(settings.podcastConfig.personas);
    }
  }, []);

  const savePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('Bitte gib dem Prompt einen Namen.');
      return;
    }
    if (!template.trim()) {
      setValidationError('Bitte definiere ein Prompt-Template.');
      return;
    }

    const finalCategory = category === 'Custom' ? customCategory : category;
    if (!finalCategory.trim()) {
      setValidationError('Bitte wähle eine Kategorie.');
      return;
    }

    const newPrompt: CustomPrompt = {
      id: Date.now().toString(),
      name,
      category: finalCategory,
      model,
      systemInstruction: system,
      template,
      personaId: selectedPersonaId || undefined,
      examples,
      tags,
      createdAt: Date.now(),
    };

    const updated = [newPrompt, ...prompts];
    setPrompts(updated);
    localStorage.setItem('customPrompts', JSON.stringify(updated));

    setShowForm(false);
    resetForm();
  };

  const deletePrompt = (id: string) => {
    if (!window.confirm("Bist du sicher, dass du diesen Prompt löschen willst?")) return;
    const updated = prompts.filter(p => p.id !== id);
    setPrompts(updated);
    localStorage.setItem('customPrompts', JSON.stringify(updated));
    if (activePrompt?.id === id) setActivePrompt(null);
  };

  const handleExportJSON = () => {
     const dataStr = JSON.stringify(prompts, null, 2);
     const blob = new Blob([dataStr], { type: "application/json" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `my_prompts_export_${new Date().toISOString().split('T')[0]}.json`;
     a.click();
     URL.revokeObjectURL(url);
     setShowExportMenu(false);
  };

  const handleExportMarkdown = () => {
    let mdContent = `# Prompt Library Export - ${new Date().toLocaleDateString()}\n\n`;
    
    prompts.forEach(p => {
        mdContent += `## ${p.name}\n\n`;
        mdContent += `**Category:** ${p.category}  \n`;
        mdContent += `**Model:** \`${p.model}\`  \n`;
        if (p.tags && p.tags.length > 0) {
            mdContent += `**Tags:** ${p.tags.map(t => `\`#${t}\``).join(' ')}  \n`;
        }
        
        if (p.systemInstruction) {
            mdContent += `\n### System Instruction\n> ${p.systemInstruction.replace(/\n/g, '\n> ')}\n`;
        }
        
        mdContent += `\n### Template\n\`\`\`\n${p.template}\n\`\`\`\n`;
        
        if (p.examples && p.examples.length > 0) {
            mdContent += `\n### Examples\n`;
            p.examples.forEach((ex, i) => {
                mdContent += `**Example ${i + 1}**\n`;
                mdContent += `- **Input:** ${ex.input}\n`;
                mdContent += `- **Output:** ${ex.output}\n\n`;
            });
        }
        mdContent += `\n---\n\n`;
    });

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_prompts_export_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const resetForm = () => {
    setName('Neuer Prompt');
    setCategory('General');
    setCustomCategory('');
    setModel('gemini-3-flash-preview');
    setSystem('');
    setTemplate('');
    setSelectedPersonaId('');
    setExamples([]);
    setTags([]);
    setCurrentTag('');
    setValidationError('');
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addExample = () => {
    setExamples([...examples, { input: '', output: '' }]);
  };

  const updateExample = (index: number, field: 'input' | 'output', value: string) => {
    const newExamples = [...examples];
    newExamples[index][field] = value;
    setExamples(newExamples);
  };

  const removeExample = (index: number) => {
    const newExamples = examples.filter((_, i) => i !== index);
    setExamples(newExamples);
  };

  const handleRun = async () => {
    if (!activePrompt || loading) return;
    setLoading(true);
    setOutput(null);
    
    let activePersona: Persona | undefined;
    if (activePrompt.personaId) {
      const settings = getSettings();
      activePersona = settings.podcastConfig.personas.find(p => p.id === activePrompt.personaId);
    }
    
    try {
      const result = await runCustomPrompt(
        activePrompt.model, 
        activePrompt.template, 
        userInput, 
        activePrompt.systemInstruction,
        activePersona
      );
      setOutput(result || 'Kein Output generiert.');
    } catch (error) {
      console.error(error);
      alert('Fehler beim Ausführen des Prompts.');
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateName = async () => {
    if (!template) return;
    setGeneratingName(true);
    try {
      const result = await generatePromptName(template, system);
      if (result) setName(result);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingName(false);
    }
  };

  const formCategories = Array.from(new Set(prompts.map(p => p.category)));
  if (!formCategories.includes('General')) formCategories.unshift('General');

  // Filter Logic
  const getFilterOptions = (): string[] => {
    switch (filterType) {
      case 'category':
        return Array.from(new Set(prompts.map(p => p.category)));
      case 'model':
        return Array.from(new Set(prompts.map(p => p.model)));
      case 'persona':
        return Array.from(new Set(prompts.filter(p => p.personaId).map(p => {
          const persona = availablePersonas.find(ap => ap.id === p.personaId);
          return persona ? persona.name : 'Unknown';
        })));
      case 'tag':
         const allTags = prompts.flatMap(p => p.tags || []);
         return Array.from(new Set(allTags)).filter((t): t is string => !!t);
      case 'persona_assoc':
         return ['Has Persona', 'No Persona'];
      default:
        return [];
    }
  };

  const filteredPrompts = prompts.filter(p => {
    if (filterValue === 'All') return true;
    switch (filterType) {
      case 'category':
        return p.category === filterValue;
      case 'model':
        return p.model === filterValue;
      case 'persona':
        const persona = availablePersonas.find(ap => ap.id === p.personaId);
        return persona?.name === filterValue;
      case 'tag':
         return p.tags?.includes(filterValue);
      case 'persona_assoc':
         if (filterValue === 'Has Persona') return !!p.personaId;
         if (filterValue === 'No Persona') return !p.personaId;
         return true;
      default:
        return true;
    }
  }).sort((a, b) => {
    if (sortBy === 'date') return b.createdAt - a.createdAt;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    return 0;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Cpu className="text-indigo-600" />
          Prompt Studio
        </h3>
        <div className="flex gap-2">
           <div className="relative">
               <button
                 onClick={() => setShowExportMenu(!showExportMenu)}
                 className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-slate-50 transition-all text-sm"
                 title="Export Options"
               >
                 <Download size={18} /> Export
                 <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`}/>
               </button>
               {showExportMenu && (
                   <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 overflow-hidden animate-in fade-in zoom-in-95">
                       <button onClick={handleExportJSON} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                           <FileJson size={16} className="text-indigo-600"/> JSON Format
                       </button>
                       <button onClick={handleExportMarkdown} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 text-slate-700 flex items-center gap-2 border-t border-slate-50">
                           <FileText size={16} className="text-indigo-600"/> Markdown
                       </button>
                   </div>
               )}
           </div>
           <button
             onClick={() => { setShowForm(true); }}
             className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
           >
             <Plus size={20} />
             Neu Erstellen
           </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Filter Type Selection */}
            <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
            <Filter size={16} className="text-slate-400" />
            <select 
                value={filterType} 
                onChange={(e) => { setFilterType(e.target.value as any); setFilterValue('All'); }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
                <option value="category">Kategorie</option>
                <option value="tag">Tags</option>
                <option value="persona_assoc">Persona Status</option>
                <option value="persona">Persona Name</option>
                <option value="model">KI Modell</option>
            </select>
            </div>

            {/* Sort Selection */}
            <div className="flex items-center gap-2 border-r border-slate-100 pr-4">
                <SortAsc size={16} className="text-slate-400" />
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                    <option value="date">Datum (Neu)</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="category">Kategorie</option>
                </select>
            </div>
            
            {/* Dynamic Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto w-full scrollbar-hide">
            <button 
                onClick={() => setFilterValue('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterValue === 'All' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
                Alle
            </button>
            {getFilterOptions().map((opt: string) => (
                <button 
                key={opt}
                onClick={() => setFilterValue(opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterValue === opt ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >
                {filterType === 'model' && opt.includes('flash') ? '⚡ Flash' : 
                filterType === 'model' && opt.includes('pro') ? '🧠 Pro' : 
                filterType === 'model' && opt.includes('image') ? '🎨 Image' : opt}
                </button>
            ))}
            </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-bold">Neue Prompt Konfiguration</h4>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>
            
            {validationError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle size={16} /> {validationError}
              </div>
            )}

            <form onSubmit={savePrompt} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Prompt Name</label>
                  <div className="flex gap-2">
                    <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500" placeholder="z.B. Bewerbungshelfer" />
                    <button 
                      type="button" 
                      onClick={autoGenerateName}
                      disabled={generatingName || !template}
                      className="bg-purple-100 text-purple-600 p-2.5 rounded-xl hover:bg-purple-200 transition-colors"
                      title="Name automatisch generieren"
                    >
                      {generatingName ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Kategorie</label>
                  <div className="flex gap-2">
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500">
                      {formCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="Custom">+ Neu Erstellen</option>
                    </select>
                    {category === 'Custom' && (
                      <input 
                        value={customCategory} 
                        onChange={e => setCustomCategory(e.target.value)}
                        placeholder="Name der Kategorie"
                        className="w-full bg-indigo-50 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Modell Auswahl</label>
                  <select value={model} onChange={e => setModel(e.target.value as any)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500">
                    <option value="gemini-3-flash-preview">Gemini Flash (Schnell)</option>
                    <option value="gemini-3-pro-preview">Gemini Pro (Logik/Research)</option>
                    <option value="gemini-3-pro-image-preview">Imagen (Bilder)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Bevorzugte Persona (Optional)</label>
                  <select value={selectedPersonaId} onChange={e => setSelectedPersonaId(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500">
                    <option value="">Keine spezifische Persona</option>
                    {availablePersonas.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.socialStatus})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-500 uppercase">Tags</label>
                 <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                       <span key={tag} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                          #{tag} <button type="button" onClick={() => removeTag(tag)}><X size={10}/></button>
                       </span>
                    ))}
                 </div>
                 <input 
                    value={currentTag} 
                    onChange={e => setCurrentTag(e.target.value)}
                    onKeyDown={addTag}
                    placeholder="Tag tippen und Enter drücken..."
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm"
                 />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">System Instruktion (Optional)</label>
                <textarea value={system} onChange={e => setSystem(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 min-h-[80px]" placeholder="Du bist ein hilfreicher HR Experte..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Prompt Template (Benutze {"{{input}}"} als Platzhalter)</label>
                <textarea value={template} onChange={e => setTemplate(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 min-h-[120px]" placeholder="Schreibe ein Anschreiben für: {{input}}" />
              </div>

              {/* Examples Section */}
              <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                   <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Quote size={12}/> Beispiele</label>
                   <button type="button" onClick={addExample} className="text-xs font-bold text-indigo-600 hover:underline">+ Beispiel hinzufügen</button>
                </div>
                {examples.map((ex, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <input value={ex.input} onChange={e => updateExample(idx, 'input', e.target.value)} placeholder="User Input Beispiel" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs" />
                      <input value={ex.output} onChange={e => updateExample(idx, 'output', e.target.value)} placeholder="Erwarteter Output" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs" />
                    </div>
                    <button type="button" onClick={() => removeExample(idx)} className="text-slate-400 hover:text-red-500 p-1"><X size={14}/></button>
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                Prompt Speichern
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-2">
            {filteredPrompts.map(p => (
              <div 
                key={p.id}
                onClick={() => { setActivePrompt(p); setOutput(null); }}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  activePrompt?.id === p.id 
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                    : 'bg-white border-slate-100 hover:border-indigo-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                       <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                         {p.category === 'image' ? <Sparkles size={8}/> : <Layers size={8}/>} {p.category}
                       </span>
                       <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                         {p.model.includes('flash') ? <Zap size={8}/> : <Brain size={8}/>} {p.model.includes('flash') ? 'Flash' : 'Pro'}
                       </span>
                    </div>
                    {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {p.tags.map(t => (
                                <span key={t} className="text-[8px] text-indigo-400 bg-indigo-50 px-1 rounded">#{t}</span>
                            ))}
                        </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deletePrompt(p.id); }}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filteredPrompts.length === 0 && (
              <div className="text-center py-10 opacity-40">
                <p className="text-xs">Keine Prompts gefunden.</p>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          {activePrompt ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6 h-full flex flex-col">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{activePrompt.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{activePrompt.model}</p>
                </div>
                <div className="flex items-center gap-2">
                  {activePrompt.personaId && (
                     <div className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <User size={10} /> Persona Aktiv
                     </div>
                  )}
                  <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {activePrompt.category}
                  </div>
                </div>
              </div>

              {activePrompt.examples && activePrompt.examples.length > 0 && (
                 <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Beispiel Input</p>
                    <p className="text-xs text-slate-600 italic">"{activePrompt.examples[0].input}"</p>
                 </div>
              )}

              <div className="space-y-4 flex-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Input Inhalt</label>
                  <textarea
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 min-h-[150px] text-sm"
                    placeholder="Hier den Kontext oder den dynamischen Teil deines Prompts eingeben..."
                  />
                </div>
                <button
                  onClick={handleRun}
                  disabled={loading || !userInput}
                  className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Play size={18} fill="currentColor" />}
                  {loading ? 'Task läuft...' : 'Prompt Ausführen'}
                </button>
              </div>

              {output && (
                <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-bold text-slate-800">Ergebnis</h5>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(output); alert('Kopiert!'); }}
                      className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  {activePrompt.model.includes('image') ? (
                    <div className="flex justify-center">
                      <img src={output} alt="Generated" className="rounded-2xl max-h-[400px] shadow-lg" />
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-2xl">
                      {output}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4 h-full border border-slate-100">
              <Cpu size={64} className="text-slate-100" />
              <div>
                <h4 className="text-lg font-bold text-slate-400">Wähle einen Prompt</h4>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">Wähle eine gespeicherte Konfiguration aus der Liste oder erstelle eine neue, um Aufgaben zu automatisieren.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptStudio;
