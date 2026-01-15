
import React, { useState, useRef, useEffect } from 'react';
import { chatWithSearch, getSettings } from '../services/gemini';
import { chatWithOpenAI } from '../services/openai';
import { ChatMessage, ChatSession, AppSettings } from '../types';
import { Send, Globe, ExternalLink, User, Bot, Loader2, History, Plus, BrainCircuit, Menu, Paperclip, Download, Trash2, Key, UploadCloud, X } from 'lucide-react';

const ChatSearch: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Persistence for Input
  const [input, setInput] = useState(() => {
    return localStorage.getItem('currentChatInput') || 'Erkläre mir Quantencomputer und ihre Auswirkungen auf die Zukunft.';
  });
  
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Persistence for Model
  const [model, setModel] = useState<'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'gpt-4o' | 'o1-preview'>(() => {
    return (localStorage.getItem('selectedChatModel') as any) || 'gemini-3-flash-preview';
  });
  
  // Persistence for Attached Files
  const [attachedFiles, setAttachedFiles] = useState<{name: string, data: string, type: 'image' | 'text'}[]>(() => {
      try {
          const saved = localStorage.getItem('currentChatAttachments');
          return saved ? JSON.parse(saved) : [];
      } catch (e) { return []; }
  });

  const [deepResearch, setDeepResearch] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedSessions = localStorage.getItem('chatHistory');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    } else {
      createNewSession();
    }
    
    const loadedSettings = getSettings();
    setSettings(loadedSettings);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Save attachments whenever they change
  useEffect(() => {
      try {
        localStorage.setItem('currentChatAttachments', JSON.stringify(attachedFiles));
      } catch (e) {
        console.warn("Failed to persist attachments (likely quota exceeded)", e);
      }
  }, [attachedFiles]);

  // Save input whenever it changes
  useEffect(() => {
      localStorage.setItem('currentChatInput', input);
  }, [input]);

  const handleModelChange = (newModel: string) => {
    setModel(newModel as any);
    localStorage.setItem('selectedChatModel', newModel);
  };

  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('chatHistory', JSON.stringify(updatedSessions));
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Neue Diskussion',
      messages: [],
      lastUpdated: Date.now(),
      modelUsed: model
    };
    // Prepend new session
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setShowHistory(false);
  };

  const loadSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setMessages(session.messages);
      setShowHistory(false);
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Diesen Chatverlauf löschen?')) return;
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      if (updated.length > 0) loadSession(updated[0].id);
      else createNewSession();
    }
  };

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        setAttachedFiles(prev => {
          // Check if file already exists to avoid duplicates
          if (prev.some(f => f.name === file.name)) return prev;
          
          return [...prev, {
            name: file.name,
            data: base64,
            type: file.type.startsWith('image') ? 'image' : 'text'
          }];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(files => files.filter((_, i) => i !== index));
  };

  const exportChat = () => {
    const text = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString()}.txt`;
    a.click();
  };

  const handleSend = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || loading) return;

    // Determine context images
    const images = attachedFiles.filter(f => f.type === 'image').map(f => f.data);
    
    // Construct message
    let messageText = input;
    if (attachedFiles.some(f => f.type === 'text')) {
       messageText += "\n\n[Angehängte Dateien]: " + attachedFiles.map(f => f.name).join(', ');
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      images: images.length > 0 ? images : undefined
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setAttachedFiles([]); // Clear attachments after sending
    setLoading(true);

    try {
      let responseText = "";
      let sources = undefined;

      // Model Routing
      if (model.includes('gpt') || model.includes('o1')) {
        const apiKey = settings?.apiKeys?.openai;
        if (!apiKey) {
          responseText = "Fehler: OpenAI API Key fehlt in den Einstellungen.";
        } else {
          const res = await chatWithOpenAI(apiKey, model, newMessages);
          responseText = res.text;
        }
      } else {
        // Gemini Logic
        const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }] 
        }));
        
        const isPro = model.includes('pro');
        const res = await chatWithSearch(userMessage.text, history, deepResearch || isPro);
        responseText = res.text;
        sources = res.sources;
      }
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        sources: sources
      };

      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);

      // Update session in storage
      if (activeSessionId) {
        const updatedSessions = sessions.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: finalMessages,
              title: s.messages.length === 0 ? input.slice(0, 30) || 'Dateien Analyse' : s.title,
              lastUpdated: Date.now(),
              modelUsed: model
            };
          }
          return s;
        });
        saveSessions(updatedSessions);
      }

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "Entschuldigung, ich konnte das Modell nicht erreichen."
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-600/10 backdrop-blur-sm border-2 border-indigo-600 border-dashed rounded-3xl flex items-center justify-center pointer-events-none">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center animate-bounce">
            <UploadCloud size={48} className="text-indigo-600 mb-2" />
            <p className="font-bold text-indigo-900">Dateien hier ablegen</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-0 z-20 bg-white md:bg-transparent md:w-64 flex-shrink-0 flex flex-col
        transition-transform duration-300 md:translate-x-0 border-r border-slate-100 md:border-none
        ${showHistory ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 bg-white md:bg-transparent md:p-0 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4 md:hidden">
            <h3 className="font-bold text-slate-700">Verlauf</h3>
            <button onClick={() => setShowHistory(false)}><Menu /></button>
          </div>
          
          <button 
            onClick={createNewSession}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mb-4"
          >
            <Plus size={18} /> Neue Diskussion
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`w-full flex justify-between items-center p-3 rounded-xl text-sm font-medium transition-all cursor-pointer group ${
                  activeSessionId === s.id 
                    ? 'bg-white shadow-sm border border-indigo-100 text-indigo-600' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span className="truncate flex-1">{s.title}</span>
                <button onClick={(e) => deleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <button onClick={() => setShowHistory(true)} className="md:hidden">
               <History className="text-slate-400" />
             </button>
             <div className="flex flex-col">
                <h3 className="font-bold text-slate-700 text-sm">Deep Assistant</h3>
                <div className="flex gap-2">
                   <select 
                     value={model} 
                     onChange={(e) => handleModelChange(e.target.value)}
                     className="text-[10px] bg-transparent font-bold text-slate-500 outline-none cursor-pointer hover:text-indigo-600"
                   >
                     <option value="gemini-3-flash-preview">⚡ Google Gemini Flash (Schnell)</option>
                     <option value="gemini-3-pro-preview">🧠 Google Gemini Pro (Logik)</option>
                     <option value="gpt-4o">🤖 OpenAI GPT-4o (Schlau)</option>
                     <option value="o1-preview">🔬 OpenAI o1 (Wissenschaft)</option>
                   </select>
                </div>
             </div>
          </div>
          
          <div className="flex gap-2">
             <button 
                onClick={exportChat}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Chat Herunterladen"
             >
               <Download size={18} />
             </button>
             {model.includes('gemini') && (
               <button
                 onClick={() => setDeepResearch(!deepResearch)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                   deepResearch 
                     ? 'bg-purple-100 text-purple-700 border-purple-200' 
                     : 'bg-white border-slate-200 text-slate-500'
                 }`}
               >
                 <BrainCircuit size={14} />
                 Deep Research {deepResearch ? 'AN' : 'AUS'}
               </button>
             )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20">
              <Globe size={48} />
              <div>
                <p className="text-lg font-medium">Recherchieren, Analysieren, Erstellen</p>
                <p className="text-sm">Wähle ein Modell und starte den Chat. Ziehe Dateien hierher für Kontext.</p>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : model.includes('gpt') ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[85%] space-y-2 ${m.role === 'user' ? 'items-end' : ''}`}>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  {m.text}
                  {m.images && (
                    <div className="flex gap-2 mt-2">
                      {m.images.map((img, i) => (
                        <img key={i} src={`data:image/jpeg;base64,${img}`} className="w-20 h-20 object-cover rounded-lg border border-white/20" alt="attachment" />
                      ))}
                    </div>
                  )}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {m.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-[11px] text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                      >
                        <ExternalLink size={10} />
                        {source.title.slice(0, 20)}...
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center animate-pulse">
                <Bot size={16} className="text-slate-400" />
              </div>
              <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none">
                <Loader2 size={18} className="animate-spin text-slate-400" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          {attachedFiles.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {attachedFiles.map((f, i) => (
                <div key={i} className="relative bg-slate-100 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-2 group">
                  <span className="truncate max-w-[100px]">{f.name}</span>
                  <button onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="relative flex items-center">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-3 p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
            >
              <Paperclip size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
              multiple 
              accept="image/*,.txt,.md,.csv" 
            />
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={deepResearch ? "Stelle eine komplexe Forschungsfrage..." : "Nachricht oder Dateien..."}
              className={`w-full bg-slate-100 border-none rounded-2xl py-4 pl-12 pr-14 focus:ring-2 transition-all outline-none ${deepResearch ? 'focus:ring-purple-500' : 'focus:ring-indigo-500'}`}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachedFiles.length === 0) || loading}
              className={`absolute right-2 p-2 text-white rounded-xl disabled:opacity-50 transition-all ${deepResearch ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSearch;
